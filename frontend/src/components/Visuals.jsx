export function Mark({ light = false, className = 'h-9 w-9' }) {
  const background = light ? '#eef7c8' : '#17261f';
  const trace = light ? '#17261f' : '#c8ee62';
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
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18M10.7 6.1A9.7 9.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-2.1 2.8M6.2 6.2A15.8 15.8 0 0 0 2.5 12s3.5 6 9.5 6c1 0 2-.2 2.8-.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    file: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5M9 13h6M9 17h4" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export function BoardSchematic() {
  return (
    <svg viewBox="0 0 720 470" className="h-full w-full" role="img" aria-label="Abstract printed circuit board schematic">
      <defs>
        <pattern id="pcb-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#2a3a32" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="720" height="470" fill="#14231c" />
      <rect width="720" height="470" fill="url(#pcb-grid)" opacity=".7" />
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
