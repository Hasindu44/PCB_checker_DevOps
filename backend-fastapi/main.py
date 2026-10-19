from __future__ import annotations

import io
import math
import re
import zipfile
from pathlib import PurePosixPath
from typing import Any

import gerber
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from shapely.geometry import LineString, Point, box
from shapely.geometry.base import BaseGeometry
from shapely.ops import nearest_points
from shapely.strtree import STRtree


MAX_ARCHIVE_BYTES = 25 * 1024 * 1024
MAX_UNCOMPRESSED_BYTES = 100 * 1024 * 1024
MAX_ARCHIVE_FILES = 300
MAX_PRIMITIVES_PER_LAYER = 20_000
MAX_REPORTED_ERRORS = 1_000

COPPER_EXTENSIONS = {".gtl", ".gbl", ".g1", ".g2", ".g3", ".g4", ".g5", ".g6", ".g7", ".g8", ".cmp", ".sol", ".top", ".bot"}
GERBER_EXTENSIONS = {".gbr", ".ger", ".pho", ".art"}
DRILL_EXTENSIONS = {".drl", ".xln", ".exc", ".drd", ".tap"}
NON_COPPER_TERMS = ("silk", "legend", "mask", "paste", "outline", "edge", "profile", "assembly", "mechanical", "drill", "fab", "drawing")
COPPER_TERMS = ("copper", "cu", "top", "bottom", "inner", "in1", "in2", "in3", "in4", "f_cu", "b_cu")

app = FastAPI(title="CircuitGuard DRC Engine", version="1.0.0")


class Coordinates(BaseModel):
    x: float
    y: float


class DrcError(BaseModel):
    rule: str
    message: str
    coordinates: Coordinates


class ValidationResult(BaseModel):
    status: str
    total_errors: int
    errors: list[DrcError]
    warnings: list[str]


def _positive_number(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) and number > 0 else None


def _aperture_width(primitive: Any) -> float | None:
    aperture = getattr(primitive, "aperture", None)
    values = [
        _positive_number(getattr(primitive, "diameter", None)),
        _positive_number(getattr(aperture, "diameter", None)),
        _positive_number(getattr(aperture, "width", None)),
    ]
    values = [value for value in values if value is not None]
    return min(values) if values else None


def _primitive_geometry(primitive: Any) -> BaseGeometry | None:
    start = getattr(primitive, "start", None)
    end = getattr(primitive, "end", None)
    width = _aperture_width(primitive)
    if start is not None and end is not None and width is not None:
        return LineString([start, end]).buffer(width / 2, cap_style="round", join_style="round")

    position = getattr(primitive, "position", None)
    diameter = _positive_number(getattr(primitive, "diameter", None))
    if position is not None and diameter is not None:
        return Point(position).buffer(diameter / 2, quad_segs=12)

    children = getattr(primitive, "primitives", None)
    if children:
        geometries = [geometry for child in children if (geometry := _primitive_geometry(child)) is not None]
        if geometries:
            from shapely.ops import unary_union
            return unary_union(geometries)

    bounds = getattr(primitive, "bounding_box", None)
    if bounds and len(bounds) == 2:
        (min_x, max_x), (min_y, max_y) = bounds
        if all(math.isfinite(float(value)) for value in (min_x, max_x, min_y, max_y)):
            return box(float(min_x), float(min_y), float(max_x), float(max_y))
    return None


def _is_copper_file(name: str) -> bool:
    path = PurePosixPath(name)
    suffix = path.suffix.lower()
    stem = path.stem.lower().replace("-", "_").replace(" ", "_")
    if any(term in stem for term in NON_COPPER_TERMS):
        return False
    if suffix in COPPER_EXTENSIONS:
        return True
    if suffix not in GERBER_EXTENSIONS:
        return False
    if any(term in stem for term in COPPER_TERMS):
        return True
    # Generic .gbr names are often used for copper layers. Only accept them
    # when no more specific non-copper naming marker is present.
    return bool(stem)


def _is_drill_file(name: str) -> bool:
    path = PurePosixPath(name)
    suffix = path.suffix.lower()
    stem = path.stem.lower()
    if suffix in DRILL_EXTENSIONS:
        return True
    return suffix == ".txt" and any(term in stem for term in ("drill", "hole", "pth", "npth"))


def _archive_members(archive: zipfile.ZipFile) -> list[zipfile.ZipInfo]:
    members = [info for info in archive.infolist() if not info.is_dir()]
    if len(members) > MAX_ARCHIVE_FILES:
        raise HTTPException(status_code=413, detail="The archive contains too many files.")
    if sum(info.file_size for info in members) > MAX_UNCOMPRESSED_BYTES:
        raise HTTPException(status_code=413, detail="The uncompressed archive is too large.")
    for info in members:
        path = PurePosixPath(info.filename.replace("\\", "/"))
        unix_mode = info.external_attr >> 16
        if path.is_absolute() or ".." in path.parts or (unix_mode & 0o170000) == 0o120000:
            raise HTTPException(status_code=400, detail="The archive contains an unsafe path.")
        if info.flag_bits & 0x1:
            raise HTTPException(status_code=400, detail="Encrypted ZIP files are not supported.")
    return members


def _parse_layer(name: str, content: bytes) -> Any:
    try:
        text = content.decode("utf-8", errors="replace")
        layer = gerber.loads(text, filename=name)
        if layer is None:
            raise ValueError("Unrecognized Gerber/Excellon format")
        if hasattr(layer, "to_metric"):
            layer.to_metric()
        return layer
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse {PurePosixPath(name).name}: {exc}") from exc


def _make_error(rule: str, message: str, point: Point) -> DrcError:
    return DrcError(
        rule=rule,
        message=message,
        coordinates=Coordinates(x=round(point.x, 4), y=round(point.y, 4)),
    )


def _check_layer_clearance(shapes: list[BaseGeometry], minimum: float) -> list[DrcError]:
    if len(shapes) < 2:
        return []
    tree = STRtree(shapes)
    errors: list[DrcError] = []
    for first_index, first in enumerate(shapes):
        candidates = tree.query(first.buffer(minimum))
        for raw_second_index in candidates:
            second_index = int(raw_second_index)
            if second_index <= first_index:
                continue
            second = shapes[second_index]
            if first.intersects(second):
                continue
            distance = first.distance(second)
            if distance >= minimum:
                continue
            first_near, second_near = nearest_points(first, second)
            midpoint = Point((first_near.x + second_near.x) / 2, (first_near.y + second_near.y) / 2)
            errors.append(_make_error(
                "TRACE_CLEARANCE",
                f"Copper clearance is {distance:.3f} mm; minimum is {minimum:.3f} mm.",
                midpoint,
            ))
            if len(errors) >= MAX_REPORTED_ERRORS:
                return errors
    return errors


def _check_trace_width(primitives: list[Any], minimum: float) -> list[DrcError]:
    errors: list[DrcError] = []
    for primitive in primitives:
        if getattr(primitive, "level_polarity", "dark") != "dark":
            continue
        if getattr(primitive, "start", None) is None or getattr(primitive, "end", None) is None:
            continue
        width = _aperture_width(primitive)
        if width is None or width >= minimum:
            continue
        shape = _primitive_geometry(primitive)
        if shape is None:
            continue
        center = shape.centroid
        errors.append(_make_error(
            "MIN_TRACE_WIDTH",
            f"Trace width is {width:.3f} mm; minimum is {minimum:.3f} mm.",
            center,
        ))
        if len(errors) >= MAX_REPORTED_ERRORS:
            break
    return errors


def _drill_hits(layer: Any) -> list[tuple[Point, float]]:
    hits: list[tuple[Point, float]] = []
    for primitive in getattr(layer, "primitives", []):
        position = getattr(primitive, "position", None)
        diameter = _positive_number(getattr(primitive, "diameter", None))
        if position is None:
            continue
        if diameter is None:
            diameter = _positive_number(getattr(getattr(primitive, "tool", None), "diameter", None))
        if diameter is not None:
            hits.append((Point(position), diameter))
    return hits


def _check_annular_ring(
    drill_layers: list[Any], circular_pads: list[tuple[Point, float]], minimum: float
) -> list[DrcError]:
    if minimum <= 0:
        return []
    errors: list[DrcError] = []
    for drill_layer in drill_layers:
        for center, drill_diameter in _drill_hits(drill_layer):
            possible_rings = [
                (pad_diameter - drill_diameter) / 2
                for pad_center, pad_diameter in circular_pads
                if pad_center.distance(center) <= 0.001 and pad_diameter >= drill_diameter
            ]
            if not possible_rings:
                continue
            ring = min(possible_rings)
            if ring < minimum:
                errors.append(_make_error(
                    "ANNULAR_RING",
                    f"Annular ring is {ring:.3f} mm; minimum is {minimum:.3f} mm.",
                    center,
                ))
            if len(errors) >= MAX_REPORTED_ERRORS:
                return errors
    return errors


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/validate", response_model=ValidationResult)
async def validate(
    file: UploadFile = File(...),
    min_clearance: float = Form(..., gt=0, le=10),
    min_trace_width: float = Form(..., gt=0, le=10),
    min_annular_ring: float = Form(0, ge=0, le=10),
) -> ValidationResult:
    filename = file.filename or ""
    if PurePosixPath(filename.replace("\\", "/")).suffix.lower() != ".zip":
        raise HTTPException(status_code=400, detail="Upload a Gerber ZIP archive.")

    content = await file.read(MAX_ARCHIVE_BYTES + 1)
    await file.close()
    if len(content) > MAX_ARCHIVE_BYTES:
        raise HTTPException(status_code=413, detail="ZIP files must be 25 MB or smaller.")

    try:
        archive = zipfile.ZipFile(io.BytesIO(content))
    except zipfile.BadZipFile as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid ZIP archive.") from exc

    with archive:
        members = _archive_members(archive)
        copper_members = [info for info in members if _is_copper_file(info.filename)]
        drill_members = [info for info in members if _is_drill_file(info.filename)]
        if not copper_members:
            raise HTTPException(status_code=422, detail="No copper Gerber layers were found in the ZIP.")

        copper_shapes: list[BaseGeometry] = []
        copper_primitives: list[Any] = []
        circular_pads: list[tuple[Point, float]] = []
        parsed_copper_layers: list[tuple[list[Any], list[BaseGeometry]]] = []
        for info in copper_members:
            layer = _parse_layer(info.filename, archive.read(info))
            primitives = list(getattr(layer, "primitives", []))
            if len(primitives) > MAX_PRIMITIVES_PER_LAYER:
                raise HTTPException(status_code=422, detail=f"{PurePosixPath(info.filename).name} contains too many geometry primitives.")
            copper_primitives.extend(primitives)
            layer_shapes: list[BaseGeometry] = []
            for primitive in primitives:
                if getattr(primitive, "level_polarity", "dark") != "dark":
                    continue
                geometry = _primitive_geometry(primitive)
                if geometry is not None and not geometry.is_empty:
                    copper_shapes.append(geometry)
                    layer_shapes.append(geometry)
                if primitive.__class__.__name__ == "Circle":
                    position = getattr(primitive, "position", None)
                    diameter = _positive_number(getattr(primitive, "diameter", None))
                    if position is not None and diameter is not None:
                        circular_pads.append((Point(position), diameter))
            parsed_copper_layers.append((primitives, layer_shapes))

        if not copper_shapes:
            raise HTTPException(status_code=422, detail="Copper layers contain no supported geometry.")

        errors = _check_trace_width(copper_primitives, min_trace_width)
        for _primitives, layer_shapes in parsed_copper_layers:
            errors.extend(_check_layer_clearance(layer_shapes, min_clearance))
            if len(errors) >= MAX_REPORTED_ERRORS:
                errors = errors[:MAX_REPORTED_ERRORS]
                break

        drill_layers = [_parse_layer(info.filename, archive.read(info)) for info in drill_members]
        errors.extend(_check_annular_ring(drill_layers, circular_pads, min_annular_ring))
        errors = errors[:MAX_REPORTED_ERRORS]

    warnings = [
        "This initial checker supports common RS-274X Gerber and Excellon files. Complex macro apertures and clear-polarity regions use approximate primitive bounds.",
        "Annular-ring checks currently compare drill hits with circular copper pads; rectangular and slotted pads are not evaluated.",
    ]
    return ValidationResult(
        status="FAIL" if errors else "PASS",
        total_errors=len(errors),
        errors=errors,
        warnings=warnings,
    )
