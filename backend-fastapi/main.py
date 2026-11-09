from __future__ import annotations

import io
import asyncio
import json
import math
import os
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path, PurePosixPath
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
MAX_VISUAL_PATHS = 4_000
MAX_VISUAL_PATH_CHARS = 1_500_000

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
    severity: str = "error"


class ValidationResult(BaseModel):
    status: str
    total_errors: int
    total_warnings: int = 0
    errors: list[DrcError]
    warnings: list[str]
    board: dict[str, Any]
    analysis_mode: str = "GERBER"


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


def _iter_polygons(geometry: BaseGeometry) -> list[Any]:
    if geometry.geom_type == "Polygon":
        return [geometry]
    if hasattr(geometry, "geoms"):
        return [polygon for child in geometry.geoms for polygon in _iter_polygons(child)]
    return []


def _ring_path(coordinates: Any, min_x: float, max_y: float) -> str:
    points = list(coordinates)
    if len(points) < 4:
        return ""
    commands = [f"M{points[0][0] - min_x:.3f},{max_y - points[0][1]:.3f}"]
    commands.extend(f"L{x - min_x:.3f},{max_y - y:.3f}" for x, y, *_ in points[1:])
    return "".join(commands) + "Z"


def _geometry_path(geometry: BaseGeometry, min_x: float, max_y: float, tolerance: float) -> str:
    try:
        simplified = geometry.simplify(tolerance, preserve_topology=True)
    except Exception:
        simplified = geometry
    paths: list[str] = []
    for polygon in _iter_polygons(simplified):
        path = _ring_path(polygon.exterior.coords, min_x, max_y)
        for interior in polygon.interiors:
            path += _ring_path(interior.coords, min_x, max_y)
        if path:
            paths.append(path)
    return "".join(paths)


def _layer_color(name: str) -> str:
    normalized = name.lower()
    if any(token in normalized for token in ("bottom", "b_cu", ".gbl", ".bot", ".sol")):
        return "#78aede"
    if any(token in normalized for token in ("inner", "in1", "in2", "in3", "in4")) or re.search(r"\.g[1-8]$", normalized):
        return "#309978"
    return "#d6a34a"


def _board_visualization(parsed_layers: list[tuple[str, list[Any], list[BaseGeometry]]]) -> dict[str, Any]:
    all_shapes = [shape for _, _, shapes in parsed_layers for shape in shapes if not shape.is_empty]
    min_x = min(shape.bounds[0] for shape in all_shapes)
    min_y = min(shape.bounds[1] for shape in all_shapes)
    max_x = max(shape.bounds[2] for shape in all_shapes)
    max_y = max(shape.bounds[3] for shape in all_shapes)
    width = max(max_x - min_x, 0.01)
    height = max(max_y - min_y, 0.01)
    tolerance = max(width, height) * 0.00015

    layers: list[dict[str, Any]] = []
    path_count = 0
    path_chars = 0
    truncated = False
    for layer_name, _primitives, shapes in parsed_layers:
        layer_paths: list[str] = []
        for shape in shapes:
            if path_count >= MAX_VISUAL_PATHS or path_chars >= MAX_VISUAL_PATH_CHARS:
                truncated = True
                break
            path = _geometry_path(shape, min_x, max_y, tolerance)
            if not path:
                continue
            if path_chars + len(path) > MAX_VISUAL_PATH_CHARS:
                remaining = MAX_VISUAL_PATH_CHARS - path_chars
                if remaining > 32:
                    truncated_path = path[:remaining]
                    safe_end = truncated_path.rfind("Z")
                    if safe_end > 0:
                        truncated_path = truncated_path[:safe_end + 1]
                        layer_paths.append(truncated_path)
                        path_chars += len(truncated_path)
                truncated = True
                break
            layer_paths.append(path)
            path_count += 1
            path_chars += len(path)
        layers.append({
            "name": PurePosixPath(layer_name).name,
            "color": _layer_color(layer_name),
            "paths": layer_paths,
        })
        if truncated:
            break

    return {
        "width": round(width, 4),
        "height": round(height, 4),
        "origin_x": round(min_x, 4),
        "top_y": round(max_y, 4),
        "padding": round(max(width, height) * 0.04, 4),
        "layers": layers,
        "truncated": truncated,
    }


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


def _kicad_findings(report: dict[str, Any]) -> list[DrcError]:
    findings: list[DrcError] = []
    for section in ("violations", "unconnected_items", "schematic_parity"):
        entries = report.get(section, [])
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict) or entry.get("excluded"):
                continue
            rule = str(entry.get("type") or section).upper().replace(" ", "_")
            description = str(entry.get("description") or rule.replace("_", " ").title())
            severity = str(entry.get("severity") or "error").lower()
            if severity not in {"error", "warning"}:
                severity = "error"
            items = entry.get("items") if isinstance(entry.get("items"), list) else []
            positions = [item.get("pos") for item in items if isinstance(item, dict) and isinstance(item.get("pos"), dict)]
            pos = positions[0] if positions else entry.get("pos", {})
            if not isinstance(pos, dict):
                pos = {}
            try:
                x, y = float(pos.get("x", 0)), float(pos.get("y", 0))
                if not math.isfinite(x) or not math.isfinite(y):
                    x, y = 0.0, 0.0
            except (TypeError, ValueError):
                x, y = 0.0, 0.0
            affected = [str(item.get("description")) for item in items if isinstance(item, dict) and item.get("description")]
            message = description
            if affected:
                message += " Affected: " + "; ".join(affected[:3])
                if len(affected) > 3:
                    message += f"; and {len(affected) - 3} more item(s)"
            findings.append(DrcError(
                rule=rule[:100], message=message[:2000],
                coordinates=Coordinates(x=round(x, 4), y=round(y, 4)), severity=severity,
            ))
            if len(findings) >= MAX_REPORTED_ERRORS:
                return findings
    return findings


def _kicad_board_preview(cli: str, board_path: Path, output_dir: Path) -> dict[str, Any]:
    preview_dir = output_dir / "preview"
    preview_dir.mkdir()
    command = [cli, "pcb", "export", "gerbers", "--layers", "F.Cu,B.Cu,In1.Cu,In2.Cu,In3.Cu,In4.Cu,In5.Cu,In6.Cu,In7.Cu,In8.Cu", "--output", str(preview_dir) + os.sep, str(board_path)]
    result = subprocess.run(command, cwd=board_path.parent, capture_output=True, text=True, timeout=45, check=False)
    if result.returncode != 0:
        raise RuntimeError("KiCad could not export copper geometry for the preview.")
    parsed_layers: list[tuple[str, list[Any], list[BaseGeometry]]] = []
    for gerber_path in sorted(preview_dir.glob("*")):
        if not gerber_path.is_file() or not _is_copper_file(gerber_path.name):
            continue
        layer = _parse_layer(gerber_path.name, gerber_path.read_bytes())
        primitives = list(getattr(layer, "primitives", []))[:MAX_PRIMITIVES_PER_LAYER]
        shapes = [geometry for primitive in primitives
                  if getattr(primitive, "level_polarity", "dark") == "dark"
                  if (geometry := _primitive_geometry(primitive)) is not None and not geometry.is_empty]
        if shapes:
            parsed_layers.append((gerber_path.name, primitives, shapes))
    if not parsed_layers:
        raise RuntimeError("KiCad exported no previewable copper layers.")
    return _board_visualization(parsed_layers)


def _validate_kicad(archive: zipfile.ZipFile, members: list[zipfile.ZipInfo], cli: str) -> ValidationResult:
    boards = [item for item in members if PurePosixPath(item.filename).suffix.lower() == ".kicad_pcb"]
    if len(boards) != 1:
        raise HTTPException(status_code=422, detail="A KiCad ZIP must contain exactly one .kicad_pcb board file.")

    board_member = boards[0]
    board_rel = PurePosixPath(board_member.filename.replace("\\", "/"))
    sibling_names = {board_rel.with_suffix(suffix).as_posix(): suffix for suffix in (".kicad_pro", ".kicad_sch", ".kicad_dru")}
    included = [board_member]
    included.extend(item for item in members if (
        item.filename.replace("\\", "/") in sibling_names
        or PurePosixPath(item.filename).suffix.lower() == ".kicad_sch"
    ))

    with tempfile.TemporaryDirectory(prefix="circuitguard-kicad-") as temp_dir:
        root = Path(temp_dir).resolve()
        extracted: dict[str, Path] = {}
        for item in included:
            rel = PurePosixPath(item.filename.replace("\\", "/"))
            target = (root / Path(*rel.parts)).resolve()
            if root not in target.parents:
                raise HTTPException(status_code=400, detail="The archive contains an unsafe path.")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(item))
            extracted[item.filename.replace("\\", "/")] = target
        board_path = extracted[board_member.filename.replace("\\", "/")]
        schematic_rel = board_rel.with_suffix(".kicad_sch").as_posix()
        has_schematic = schematic_rel in extracted
        report_path = root / "drc-report.json"
        command = [cli, "pcb", "drc", "--format", "json", "--units", "mm", "--output", str(report_path), "--severity-all"]
        if has_schematic:
            command.append("--schematic-parity")
        command.append(str(board_path))
        try:
            completed = subprocess.run(command, cwd=board_path.parent, capture_output=True, text=True, timeout=90, check=False)
        except subprocess.TimeoutExpired as exc:
            raise HTTPException(status_code=408, detail="KiCad DRC exceeded the 90 second processing limit.") from exc
        except OSError as exc:
            raise HTTPException(status_code=503, detail="KiCad DRC could not be started. Check the kicad-cli installation.") from exc
        if not report_path.is_file():
            detail = (completed.stderr or completed.stdout or "KiCad did not produce a DRC report.")[-500:]
            raise HTTPException(status_code=422, detail=f"KiCad could not analyse this project: {detail}")
        try:
            report = json.loads(report_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=502, detail="KiCad produced an unreadable DRC report.") from exc
        if not isinstance(report, dict):
            raise HTTPException(status_code=502, detail="KiCad produced an invalid DRC report.")
        findings = _kicad_findings(report)
        warnings: list[str] = []
        if not has_schematic:
            warnings.append("No matching .kicad_sch file was included, so schematic parity checks were skipped.")
        board: dict[str, Any] = {}
        try:
            board = _kicad_board_preview(cli, board_path, root)
        except (RuntimeError, OSError, subprocess.TimeoutExpired, HTTPException):
            warnings.append("KiCad DRC completed, but the copper preview could not be generated.")
        error_count = sum(finding.severity == "error" for finding in findings)
        warning_count = sum(finding.severity == "warning" for finding in findings)
        status = "FAIL" if error_count else "WARN" if warning_count or warnings else "PASS"
        return ValidationResult(status=status, total_errors=error_count, total_warnings=warning_count,
                                errors=findings, warnings=warnings, board=board, analysis_mode="KICAD")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/validate", response_model=ValidationResult)
async def validate(
    file: UploadFile = File(...),
    min_clearance: float = Form(0.2, gt=0, le=10),
    min_trace_width: float = Form(0.2, gt=0, le=10),
    min_annular_ring: float = Form(0, ge=0, le=10),
    analysis_mode: str = Form("GERBER"),
) -> ValidationResult:
    filename = file.filename or ""
    if PurePosixPath(filename.replace("\\", "/")).suffix.lower() != ".zip":
        raise HTTPException(status_code=400, detail="Upload a ZIP archive.")

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
        mode = analysis_mode.strip().upper()
        if mode not in {"GERBER", "KICAD"}:
            raise HTTPException(status_code=400, detail="Choose GERBER or KICAD analysis mode.")
        if mode == "KICAD":
            cli = os.environ.get("KICAD_CLI_PATH", "kicad-cli")
            return await asyncio.to_thread(_validate_kicad, archive, members, cli)
        copper_members = [info for info in members if _is_copper_file(info.filename)]
        drill_members = [info for info in members if _is_drill_file(info.filename)]
        if not copper_members:
            raise HTTPException(status_code=422, detail="No copper Gerber layers were found in the ZIP.")

        copper_shapes: list[BaseGeometry] = []
        copper_primitives: list[Any] = []
        circular_pads: list[tuple[Point, float]] = []
        parsed_copper_layers: list[tuple[str, list[Any], list[BaseGeometry]]] = []
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
            parsed_copper_layers.append((info.filename, primitives, layer_shapes))

        if not copper_shapes:
            raise HTTPException(status_code=422, detail="Copper layers contain no supported geometry.")

        errors = _check_trace_width(copper_primitives, min_trace_width)
        for _layer_name, _primitives, layer_shapes in parsed_copper_layers:
            errors.extend(_check_layer_clearance(layer_shapes, min_clearance))
            if len(errors) >= MAX_REPORTED_ERRORS:
                errors = errors[:MAX_REPORTED_ERRORS]
                break

        drill_layers = [_parse_layer(info.filename, archive.read(info)) for info in drill_members]
        errors.extend(_check_annular_ring(drill_layers, circular_pads, min_annular_ring))
        errors = errors[:MAX_REPORTED_ERRORS]
        board = _board_visualization(parsed_copper_layers)

    warnings = [
        "This initial checker supports common RS-274X Gerber and Excellon files. Complex macro apertures and clear-polarity regions use approximate primitive bounds.",
        "Annular-ring checks currently compare drill hits with circular copper pads; rectangular and slotted pads are not evaluated.",
    ]
    if board["truncated"]:
        warnings.append("The board preview was simplified to keep the report responsive; some fine geometry may not be shown.")
    return ValidationResult(
        status="FAIL" if errors else "PASS",
        total_errors=len(errors),
        total_warnings=0,
        errors=errors,
        warnings=warnings,
        board=board,
        analysis_mode="GERBER",
    )
