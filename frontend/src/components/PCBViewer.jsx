import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from './Visuals';

export default function PCBViewer({
  board,
  errors = [],
  selectedErrorIndex = 0,
  onSelectError,
  onUploadFile,
  isLoading = false,
  isDemo = false,
  onLoadDemo,
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0, panX: 0, panY: 0 });
  const [activeLayers, setActiveLayers] = useState({ ALL: true });
  const [showReticle, setShowReticle] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredErrorIndex, setHoveredErrorIndex] = useState(null);
  const [cursorCoords, setCursorCoords] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const gridId = useId().replace(/:/g, '');

  const layers = Array.isArray(board?.layers) ? board.layers : [];
  const width = Math.max(Number(board?.width) || 80, 0.01);
  const height = Math.max(Number(board?.height) || 55, 0.01);
  const padding = Math.max(Number(board?.padding) || 0, Math.max(width, height) * 0.05);
  const originX = Number(board?.origin_x) || 0;
  const topY = Number(board?.top_y) || height;

  // Initialize all layers as visible
  useEffect(() => {
    if (layers.length) {
      const initial = { ALL: true };
      layers.forEach((layer) => {
        initial[layer.name] = true;
      });
      setActiveLayers(initial);
    }
  }, [layers]);

  // Transformed markers mapped to SVG coordinates
  const markers = useMemo(() => {
    return errors.map((error, index) => {
      const rawX = Number(error.coordinates?.x);
      const rawY = Number(error.coordinates?.y);
      return {
        error,
        index,
        x: rawX - originX,
        y: topY - rawY,
        rawX,
        rawY,
        rule: error.rule,
        component: error.component || `Node #${index + 1}`,
        color: getOrganicMarkerColor(error.rule),
      };
    }).filter((marker) => Number.isFinite(marker.x) && Number.isFinite(marker.y));
  }, [errors, originX, topY]);

  const selectedMarker = markers.find((marker) => marker.index === selectedErrorIndex) || null;

  // Focus view on selected error
  useEffect(() => {
    if (selectedMarker) {
      const targetPanX = width / 2 - selectedMarker.x;
      const targetPanY = height / 2 - selectedMarker.y;
      setPan({ x: targetPanX, y: targetPanY });
      setZoom((current) => Math.max(current, 2.0));
    }
  }, [selectedErrorIndex, selectedMarker, width, height]);

  // Fit view helper
  function handleFitView() {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setShowReticle(true);
  }

  // Handle Wheel Zoom around pointer
  function handleWheel(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => {
      const next = Math.max(0.5, Math.min(prev * zoomFactor, 15));
      return Number(next.toFixed(2));
    });
  }

  // Pan dragging
  function handleMouseDown(event) {
    if (event.button !== 0) return;
    setIsDragging(true);
    setDragOrigin({
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    });
  }

  function handleMouseMove(event) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;

    const svgPixelWidth = rect.width;
    const svgPixelHeight = rect.height;
    const scaleFactor = Math.min(svgPixelWidth / width, svgPixelHeight / height) * zoom;
    const boardCenterScreenX = svgPixelWidth / 2 + pan.x * (svgPixelWidth / width) * zoom;
    const boardCenterScreenY = svgPixelHeight / 2 + pan.y * (svgPixelHeight / height) * zoom;

    const mouseBoardX = ((relX - boardCenterScreenX) / scaleFactor) + (width / 2) + originX;
    const mouseBoardY = topY - (((relY - boardCenterScreenY) / scaleFactor) + (height / 2));

    if (mouseBoardX >= originX && mouseBoardX <= originX + width && mouseBoardY >= 0 && mouseBoardY <= topY) {
      setCursorCoords({ x: mouseBoardX, y: mouseBoardY });
    } else {
      setCursorCoords(null);
    }

    if (isDragging) {
      const deltaX = (event.clientX - dragOrigin.x) / ((svgPixelWidth / width) * zoom);
      const deltaY = (event.clientY - dragOrigin.y) / ((svgPixelHeight / height) * zoom);
      setPan({
        x: dragOrigin.panX + deltaX,
        y: dragOrigin.panY + deltaY,
      });
    }
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  // Toggle layer
  function toggleLayer(layerName) {
    if (layerName === 'ALL') {
      const newState = !activeLayers.ALL;
      const updated = { ALL: newState };
      layers.forEach((layer) => {
        updated[layer.name] = newState;
      });
      setActiveLayers(updated);
    } else {
      setActiveLayers((prev) => {
        const next = { ...prev, [layerName]: !prev[layerName] };
        const allActive = layers.every((l) => next[l.name]);
        next.ALL = allActive;
        return next;
      });
    }
  }

  // Stepper navigation
  function handlePrev() {
    if (!errors.length) return;
    const nextIndex = selectedErrorIndex > 0 ? selectedErrorIndex - 1 : errors.length - 1;
    onSelectError(nextIndex);
  }

  function handleNext() {
    if (!errors.length) return;
    const nextIndex = selectedErrorIndex < errors.length - 1 ? selectedErrorIndex + 1 : 0;
    onSelectError(nextIndex);
  }

  // Toggle fullscreen
  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      if (event.key === 'ArrowRight' || event.key === 'j') handleNext();
      else if (event.key === 'ArrowLeft' || event.key === 'k') handlePrev();
      else if (event.key === 'f' || event.key === 'F') handleFitView();
      else if (event.key === '+' || event.key === '=') setZoom((z) => Math.min(z + 0.3, 15));
      else if (event.key === '-' || event.key === '_') setZoom((z) => Math.max(z - 0.3, 0.5));
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedErrorIndex, errors.length]);

  const baseBox = {
    x: -padding,
    y: -padding,
    w: width + padding * 2,
    h: height + padding * 2,
  };

  const currentViewBox = {
    x: baseBox.x - pan.x,
    y: baseBox.y - pan.y,
    w: baseBox.w / zoom,
    h: baseBox.h / zoom,
  };

  const gridStep = Math.max(Math.min(Math.max(width, height) / 20, 10), 0.5);
  const markerRadius = Math.max(Math.min(Math.min(width, height) * 0.045, 1.8), 0.35);

  const activeTooltipMarker = hoveredErrorIndex !== null ? markers[hoveredErrorIndex] : null;

  return (
    <div
      ref={containerRef}
      className={`pcb-viewer-card relative flex flex-col h-full w-full bg-[#081329] select-none overflow-hidden rounded-2xl border border-[#1a2f5a] shadow-xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragOver={(e) => { e.preventDefault(); }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.[0] && onUploadFile) {
          onUploadFile(e.dataTransfer.files[0]);
        }
      }}
    >
      {/* Layer and viewport controls */}
      <div className="pcb-toolbar flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#0a1733] border-b border-[#182d57] z-20">
        {/* Layer Selector buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <span className="text-[11px] font-medium text-[#7c9cd2] mr-1 hidden sm:inline">
            Layers:
          </span>
          <button
            type="button"
            onClick={() => toggleLayer('ALL')}
            aria-pressed={activeLayers.ALL}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeLayers.ALL
                ? 'bg-[#1b356e] text-white shadow-sm border border-[#2b4d96]'
                : 'bg-[#0f1f44] text-[#6d88ba] hover:text-white border border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Composite
          </button>

          {layers.map((layer) => {
            const isVisible = activeLayers[layer.name] !== false;
            return (
              <button
                key={layer.name}
                type="button"
                onClick={() => toggleLayer(layer.name)}
                aria-pressed={isVisible}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  isVisible
                    ? 'bg-[#142854] text-white border border-[#244380]'
                    : 'bg-[#0c1836] text-[#556d99] line-through border-transparent'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isVisible ? layer.color || '#10b981' : '#475569' }}
                />
                <span>{formatLayerName(layer.name)}</span>
              </button>
            );
          })}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Buttons (Image 1 style) */}
          <div className="flex items-center bg-[#0d1d40] rounded-lg border border-[#1b3363] p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1.5 text-[#8ca8dc] hover:text-white hover:bg-[#19326b] rounded transition"
              title="Zoom Out (-)"
            >
              <Icon name="zoomOut" className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-xs font-mono font-medium text-white min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(15, Number((z + 0.25).toFixed(2))))}
              className="p-1.5 text-[#8ca8dc] hover:text-white hover:bg-[#19326b] rounded transition"
              title="Zoom In (+)"
            >
              <Icon name="zoomIn" className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitView}
            className="p-2 rounded-lg bg-[#0d1d40] border border-[#1b3363] text-[#8ca8dc] hover:text-white hover:bg-[#19326b] transition"
            title="Fit Board to View (F)"
          >
            <Icon name="fit" className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setShowReticle((r) => !r)}
            className={`p-2 rounded-lg border transition ${
              showReticle
                ? 'bg-[#1b356e] border-[#2b4d96] text-[#60a5fa]'
                : 'bg-[#0d1d40] border-[#1b3363] text-[#64748b] hover:text-white'
            }`}
            title="Toggle Reticle Target"
          >
            <Icon name="crosshair" className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#0d1d40] border border-[#1b3363] text-[#8ca8dc] hover:text-white hover:bg-[#19326b] transition"
            title="Toggle Fullscreen"
          >
            <Icon name={isFullscreen ? 'minimize' : 'expand'} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Interactive Vector Canvas */}
      <div
        className={`relative flex-1 w-full h-full overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setCursorCoords(null);
        }}
      >
        <svg
          className="w-full h-full block"
          viewBox={`${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Interactive vector PCB diagram with ${markers.length} defect indicators`}
        >
          <defs>
            {/* Subtle engineering CAD grid */}
            <pattern id={gridId} width={gridStep} height={gridStep} patternUnits="userSpaceOnUse">
              <path
                d={`M ${gridStep} 0 L 0 0 0 ${gridStep}`}
                fill="none"
                stroke="#244c3b"
                strokeWidth={gridStep * 0.02}
                strokeOpacity={showGrid ? 0.6 : 0}
              />
            </pattern>

            {/* Forest-green board canvas */}
            <radialGradient id={`${gridId}-pcb-substrate`} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#105a43" />
              <stop offset="70%" stopColor="#0b4937" />
              <stop offset="100%" stopColor="#073729" />
            </radialGradient>

            {/* Reticle Glow Filter */}
            <filter id={`${gridId}-soft-glow`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="0.35" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Canvas workspace background */}
          <rect
            x={currentViewBox.x}
            y={currentViewBox.y}
            width={currentViewBox.w}
            height={currentViewBox.h}
            fill="#061711"
          />
          {showGrid && (
            <rect
              x={currentViewBox.x}
              y={currentViewBox.y}
              width={currentViewBox.w}
              height={currentViewBox.h}
              fill={`url(#${gridId})`}
            />
          )}

          {/* Normalized copper extents shown on a neutral board canvas. */}
          <g className="pcb-board-body">
            {/* Soft drop shadow */}
            <rect
              x={-0.3}
              y={-0.3}
              width={width + 0.6}
              height={height + 0.6}
              rx={Math.min(width, height) * 0.035}
              fill="#000000"
              fillOpacity="0.4"
            />
            {/* PCB Substrate (Deep organic solder mask green) */}
            <rect
              x={0}
              y={0}
              width={width}
              height={height}
              rx={Math.min(width, height) * 0.03}
              fill={`url(#${gridId}-pcb-substrate)`}
              stroke="#36785e"
              strokeWidth={Math.max(width, height) * 0.003}
            />
          </g>

          {/* Vector Copper & Silkscreen Layers */}
          {layers.map((layer) => {
            if (activeLayers[layer.name] === false) return null;
            const isSilkscreen = layer.name.toLowerCase().includes('silk');
            const isTop = layer.name.toLowerCase().includes('top') || layer.name.toLowerCase().includes('gtl');
            const defaultColor = isSilkscreen ? '#f8fafc' : isTop ? '#10b981' : '#3b82f6';
            const layerColor = layer.color || defaultColor;

            return (
              <g
                key={layer.name}
                className="pcb-copper-paths"
                fillRule="evenodd"
              >
                {layer.paths?.map((pathString, pIndex) => (
                  <path
                    key={`${layer.name}-${pIndex}`}
                    d={pathString}
                    fill={layerColor}
                    fillOpacity={isSilkscreen ? 0.95 : isTop ? 0.88 : 0.65}
                    stroke={layerColor}
                    strokeWidth={Math.max(width, height) * 0.0007}
                    strokeOpacity={0.9}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            );
          })}

            {/* Precision finding reticle */}
          {showReticle && selectedMarker && (
            <g
              className="reticle-target transition-all duration-300"
              transform={`translate(${selectedMarker.x}, ${selectedMarker.y})`}
              filter={`url(#${gridId}-soft-glow)`}
            >
              {/* Thin hairline crosshairs extending outwards */}
              <line
                x1={-width * 2}
                y1={0}
                x2={width * 2}
                y2={0}
                stroke="#e9b444"
                strokeWidth={0.12}
                strokeOpacity={0.4}
                strokeDasharray="2 1"
              />
              <line
                x1={0}
                y1={-height * 2}
                x2={0}
                y2={height * 2}
                stroke="#e9b444"
                strokeWidth={0.12}
                strokeOpacity={0.4}
                strokeDasharray="2 1"
              />

              {/* Concentric rings */}
              <circle
                cx={0}
                cy={0}
                r={markerRadius * 3.2}
                fill="none"
                stroke="#e9b444"
                strokeWidth={0.25}
                strokeOpacity={0.7}
                strokeDasharray="1 1"
              />
              <circle
                cx={0}
                cy={0}
                r={markerRadius * 1.8}
                fill="none"
                stroke="#e9b444"
                strokeWidth={0.3}
                strokeOpacity={0.85}
              />
              <circle cx={0} cy={0} r={markerRadius * 0.4} fill="#e9b444" />

              {/* Target brackets [ + ] */}
              <g stroke="#e9b444" strokeWidth={0.35} fill="none">
                <path d={`M ${-markerRadius * 2.5} ${-markerRadius * 1.3} v ${-markerRadius * 1.2} h ${markerRadius * 1.2}`} />
                <path d={`M ${markerRadius * 2.5} ${-markerRadius * 1.3} v ${-markerRadius * 1.2} h ${-markerRadius * 1.2}`} />
                <path d={`M ${-markerRadius * 2.5} ${markerRadius * 1.3} v ${markerRadius * 1.2} h ${markerRadius * 1.2}`} />
                <path d={`M ${markerRadius * 2.5} ${markerRadius * 1.3} v ${markerRadius * 1.2} h ${-markerRadius * 1.2}`} />
              </g>

              {/* Coordinate label tag on the reticle */}
              <g transform={`translate(${markerRadius * 3.2}, ${-markerRadius * 2.5})`}>
                <rect
                  x={0}
                  y={0}
                  width={15}
                  height={4.2}
                  rx={0.8}
                  fill="#0b1736"
                  fillOpacity="0.95"
                  stroke="#e9b444"
                  strokeWidth="0.25"
                />
                <text
                  x={1.2}
                  y={2.9}
                  fill="#ffffff"
                  fontSize="2"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  X:{selectedMarker.rawX.toFixed(2)} Y:{selectedMarker.rawY.toFixed(2)}
                </text>
              </g>
            </g>
          )}

          {/* Defect Markers (Organic halos, Image 1 SmartSensor-X style) */}
          <g className="pcb-defect-markers">
            {markers.map((marker, idx) => {
              const isSelected = selectedErrorIndex === idx;
              const isHovered = hoveredErrorIndex === idx;
              const isRed = marker.color === '#df3b20';

              return (
                <g
                  key={`marker-${idx}`}
                  className="cursor-pointer group"
                  transform={`translate(${marker.x}, ${marker.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectError(idx);
                  }}
                  onMouseEnter={() => setHoveredErrorIndex(idx)}
                  onMouseLeave={() => setHoveredErrorIndex(null)}
                >
                  {/* Soft organic outer glowing halo (like Image 1) */}
                  <circle
                    cx={0}
                    cy={0}
                    r={markerRadius * (isSelected ? 3.0 : isHovered ? 2.4 : 1.9)}
                    fill={isRed ? '#f87171' : '#fbbf24'}
                    fillOpacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.22}
                    className="transition-all duration-200"
                  />

                  {/* Inner halo */}
                  <circle
                    cx={0}
                    cy={0}
                    r={markerRadius * (isSelected ? 1.8 : 1.4)}
                    fill={isRed ? '#df3b20' : '#e9b444'}
                    fillOpacity={0.65}
                  />

                  {/* White center core dot */}
                  <circle
                    cx={0}
                    cy={0}
                    r={markerRadius * 0.9}
                    fill="#ffffff"
                    stroke={isRed ? '#dc2626' : '#d97706'}
                    strokeWidth={0.25}
                  />

                  {/* Marker Number */}
                  <text
                    x={0}
                    y={markerRadius * 0.35}
                    textAnchor="middle"
                    fill="#0f172a"
                    fontSize={markerRadius * 0.95}
                    fontFamily="sans-serif"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {idx + 1}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Clean White Floating Tooltip (Identical to Image 1 SmartSensor-X Tooltip!) */}
        {activeTooltipMarker && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${
                ((activeTooltipMarker.x - currentViewBox.x) / currentViewBox.w) * 100
              }%`,
              top: `${
                ((activeTooltipMarker.y - currentViewBox.y) / currentViewBox.h) * 100
              }%`,
            }}
          >
            {/* Pure white clean card from Image 1 */}
            <div className="bg-white rounded-xl p-3 shadow-2xl border border-slate-200 text-slate-800 text-xs min-w-[220px] pointer-events-auto">
              <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-100 pb-1.5">
                <span className="font-bold text-rose-600 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Defect #{activeTooltipMarker.index + 1}: {humanRule(activeTooltipMarker.rule)}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>Location:</span>
                  <strong className="text-slate-800 font-mono">
                    {activeTooltipMarker.component}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Coordinates:</span>
                  <span className="font-mono text-slate-800">
                    {activeTooltipMarker.rawX.toFixed(2)}, {activeTooltipMarker.rawY.toFixed(2)} mm
                  </span>
                </div>
                {activeTooltipMarker.error.measured && (
                  <div className="flex justify-between text-rose-600 font-medium">
                    <span>Measured:</span>
                    <span>{activeTooltipMarker.error.measured.toFixed(3)} mm</span>
                  </div>
                )}
              </div>
            </div>
            {/* Tooltip triangle caret */}
            <div className="w-2.5 h-2.5 bg-white border-r border-b border-slate-200 transform rotate-45 mx-auto -mt-1.5" />
          </div>
        )}

        {/* Real-time Engineering HUD Overlay (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 bg-[#0a1733]/90 backdrop-blur-md border border-[#1a2f5a] px-3 py-1.5 rounded-lg text-xs font-mono text-[#8ca8dc] shadow-lg pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-200">CAD Readout:</span>
          </div>
          {cursorCoords ? (
            <span className="text-white font-semibold">
              X: {cursorCoords.x.toFixed(2)} mm | Y: {cursorCoords.y.toFixed(2)} mm
            </span>
          ) : (
            <span>Hover board for coords</span>
          )}
          <span className="text-[#2b4478]">|</span>
          <span>
            Extents: {width.toFixed(1)} × {height.toFixed(1)} mm
          </span>
        </div>

        {/* Stepper Navigation Bar (Bottom-Center) */}
        {errors.length > 0 && (
          <div className="absolute bottom-3 right-3 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 z-20 flex items-center gap-2 bg-[#0a1733]/95 backdrop-blur-md border border-[#1a2f5a] px-3 py-1.5 rounded-xl shadow-xl">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded text-[#8ca8dc] hover:text-white hover:bg-[#162c5b] transition flex items-center gap-1 text-xs"
              title="Previous Defect (←)"
            >
              <Icon name="prev" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            <div className="px-2 font-mono text-xs text-white font-medium flex items-center gap-1">
              <span className="text-rose-400 font-bold">#{selectedErrorIndex + 1}</span>
              <span className="text-slate-400">/</span>
              <span>{errors.length}</span>
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded text-[#8ca8dc] hover:text-white hover:bg-[#162c5b] transition flex items-center gap-1 text-xs"
              title="Next Defect (→)"
            >
              <span className="hidden sm:inline">Next</span>
              <Icon name="next" className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drag-over overlay */}
        {isDragOver && (
          <div className="absolute inset-0 z-40 bg-[#081329]/95 backdrop-blur-sm border-2 border-dashed border-blue-400 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[#152e63] flex items-center justify-center text-blue-300 animate-bounce">
              <Icon name="upload" className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Drop Gerber ZIP Archive</h3>
            <p className="text-sm text-blue-200">Release to parse copper layers & inspect geometry</p>
          </div>
        )}

        {/* Empty state overlay */}
        {!layers.length && !isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#081329]/95 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#0f214a] border border-[#1d3a78] flex items-center justify-center text-blue-300 mb-4 shadow">
              <Icon name="board" className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Board Geometry Loaded</h3>
            <p className="text-sm text-[#8ca8dc] max-w-sm mb-5 leading-relaxed">
              Upload your Gerber ZIP archive to inspect copper layers, trace clearance, and annular rings.
            </p>
            {onLoadDemo && (
              <button
                type="button"
                onClick={onLoadDemo}
                className="px-4 py-2 rounded-lg bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-medium text-xs flex items-center gap-2 transition shadow-md"
              >
                <Icon name="sparkles" className="w-4 h-4" />
                Load Sample Sensor PCB Demo
              </button>
            )}
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-[#081329]/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-[#1e3a78] border-t-blue-400 rounded-full animate-spin" />
            <p className="text-sm font-medium text-blue-200">Processing Vector Copper Geometry…</p>
          </div>
        )}
      </div>

      {/* Viewer Footer Bar */}
      <div className="pcb-viewer-footer flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#071024] border-t border-[#14264e] text-xs text-[#7392c7] z-20">
        <div className="flex items-center gap-3">
          {layers.slice(0, 3).map((layer) => (
            <span className="flex items-center gap-1.5" key={`legend-${layer.name}`}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: layer.color || '#d6a34a' }} />
              {formatLayerName(layer.name)}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#df3b20]" />
            {errors.length} {errors.length === 1 ? 'finding' : 'findings'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span>Shortcuts: [←/→] Navigate · [F] Fit · [+/-] Zoom</span>
        </div>
      </div>
    </div>
  );
}

function getOrganicMarkerColor(rule) {
  const norm = String(rule || '').toUpperCase();
  if (norm.includes('CLEARANCE') || norm.includes('SHORT')) return '#df3b20';
  return '#e9b444';
}

function humanRule(rule) {
  return String(rule || 'Defect')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatLayerName(name) {
  const norm = String(name || '').toLowerCase();
  if (norm.includes('top') || norm.includes('gtl') || norm.includes('f_cu')) return 'Top Cu';
  if (norm.includes('bot') || norm.includes('gbl') || norm.includes('b_cu')) return 'Bot Cu';
  if (norm.includes('silk')) return 'Silkscreen';
  if (norm.includes('inner') || norm.includes('g1')) return 'Inner 1';
  return name.replace(/\.(gbr|ger|gtl|gbl)/i, '').slice(0, 8);
}
