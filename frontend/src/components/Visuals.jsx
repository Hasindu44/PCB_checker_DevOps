export function Mark({ light = false, className = 'h-9 w-9' }) {
  const background = light ? '#f4f0df' : '#0d5140';
  const trace = light ? '#0d5140' : '#e9b444';
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="8" fill={background} />
      <circle cx="12" cy="12" r="3.25" fill="none" stroke={trace} strokeWidth="1.8" />
      <circle cx="28" cy="27" r="3.25" fill="none" stroke={trace} strokeWidth="1.8" />
      <path d="M12 15.25v6.25h7.5V27H24.8M15.25 12H28V7.5M7.5 30h9.75" fill="none" stroke={trace} strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

export function Icon({ name, className = 'h-5 w-5' }) {
  const paths = {
    overview: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" /></>,
    board: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.5" /><circle cx="16" cy="16" r="1.5" /><path d="M9.5 8H15v4h1M8 9.5V16h4" /></>,
    rules: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
    archive: <><path d="M4 7h16v13H4zM3 4h18v3H3z" /><path d="M9 11h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4.7 9A7.5 7.5 0 0 1 18.3 6L20 7M4 17v-5h5" /><path d="M19.3 15A7.5 7.5 0 0 1 5.7 18L4 17" /></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.7 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.2 6.2A15.8 15.8 0 0 0 2.5 12s3.5 6 9.5 6c1 0 2-.2 2.8-.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="m12 3 9 17H3L12 3Z" /><path d="M12 9v4M12 17h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    fit: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" /><path d="M8 8h8v8H8z" /></>,
    target: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3" /></>,
    file: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 13h6M9 17h4" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 6 12 12 16 14" /></>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
    crosshair: <><circle cx="12" cy="12" r="8" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></>,
    zoomIn: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></>,
    zoomOut: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></>,
    expand: <><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></>,
    minimize: <><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7" /></>,
    sparkles: <><path d="m12 3 1.9 4.8L19 10l-5.1 2.2L12 17l-1.9-4.8L5 10l5.1-2.2L12 3z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" /><path d="M5 2l.5 1.5L7 4l-1.5.5L5 6l-.5-1.5L3 4l1.5-.5L5 2z" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    sliders: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    arrowLeft: <line x1="19" y1="12" x2="5" y2="12" />,
    arrowRight: <line x1="5" y1="12" x2="19" y2="12" />,
    prev: <polyline points="15 18 9 12 15 6" />,
    next: <polyline points="9 18 15 12 9 6" />,
    shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>,
    cpu: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" /><line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" /><line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" /><line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" /></>,
    ruler: <><path d="M21.3 8.7 8.7 21.3a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8L15.3 2.7a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8z" /><line x1="14.5" y1="7.5" x2="12.5" y2="9.5" /><line x1="11.5" y1="10.5" x2="9.5" y2="12.5" /><line x1="8.5" y1="13.5" x2="6.5" y2="15.5" /></>,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function BoardSchematic({ patternId = 'pcb-grid' }) {
  return (
    <svg viewBox="0 0 720 470" className="h-full w-full" role="img" aria-label="Abstract printed circuit board schematic">
      <defs>
        <pattern id={patternId} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#2a3a32" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="720" height="470" fill="#14231c" />
      <rect width="720" height="470" fill={`url(#${patternId})`} opacity=".7" />
      <g fill="none" stroke="#71906d" strokeWidth="2">
        <path d="M0 93h98l35 35h122l34-34h77" />
        <path d="M0 350h118l42-42h102l31 31h91" />
        <path d="M720 74H581l-33 33h-72l-31 31h-62" />
        <path d="M720 378H610l-37-37h-80l-36-36h-77" />
        <path d="M116 0v54l30 30M608 0v122l-38 38M97 470v-75l42-42M626 470v-84l-32-32" />
      </g>
      <g fill="#14231c" stroke="#c8ee62" strokeWidth="2">
        <circle cx="98" cy="93" r="7" /><circle cx="255" cy="128" r="7" /><circle cx="366" cy="94" r="7" />
        <circle cx="118" cy="350" r="7" /><circle cx="262" cy="308" r="7" /><circle cx="384" cy="339" r="7" />
        <circle cx="581" cy="74" r="7" /><circle cx="476" cy="107" r="7" /><circle cx="610" cy="378" r="7" />
      </g>
      <g transform="translate(260 151)">
        <rect width="200" height="154" rx="5" fill="#1d3027" stroke="#a5bd77" strokeWidth="2" />
        <rect x="33" y="25" width="134" height="104" rx="2" fill="#101b16" stroke="#506658" />
        <circle cx="49" cy="41" r="4" fill="#c8ee62" />
        <path d="M56 60h88M56 76h52M56 92h70" stroke="#43584b" strokeWidth="2" />
        {Array.from({ length: 7 }).map((_, index) => <path key={`top-${index}`} d={`M${31 + index * 23} 0v-12`} stroke="#8ca280" strokeWidth="4" />)}
        {Array.from({ length: 7 }).map((_, index) => <path key={`bottom-${index}`} d={`M${31 + index * 23} 154v12`} stroke="#8ca280" strokeWidth="4" />)}
      </g>
      <g fill="#8fa08f" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="1.5">
        <text x="27" y="39">TOP COPPER / REV 03</text><text x="583" y="444">CG-2417-A</text>
      </g>
      <g transform="translate(42 397)">
        <rect width="138" height="38" rx="3" fill="#1c2e25" stroke="#3c5144" />
        <circle cx="20" cy="19" r="4" fill="#c8ee62" />
        <text x="34" y="23" fill="#aab9ac" fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="1">READY TO REVIEW</text>
      </g>
    </svg>
  );
}
