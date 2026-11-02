export default function AnalyticsView() {
  const defectFrequency = [
    { name: 'Missing Component (C9)', count: 12, percent: 38, color: '#f59e0b' },
    { name: 'Solder Bridge / Clearance', count: 14, percent: 42, color: '#ef4444' },
    { name: 'Drill Misalignment', count: 4, percent: 12, color: '#10b981' },
    { name: 'Trace Short Circuit', count: 2, percent: 6, color: '#ef4444' },
    { name: 'Annular Breakout', count: 1, percent: 2, color: '#3b82f6' },
  ];

  const rootCauses = [
    { cause: 'Aperture Over-Etching', share: 45, count: 15 },
    { cause: 'Dense Escape Routing Necking', share: 30, count: 10 },
    { cause: 'Drill Bit Wander / Offset', share: 15, count: 5 },
    { cause: 'Thermal Relief Spacing', share: 10, count: 3 },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#070e1e]">
      {/* Page Header (SmartSensor-X Image 1 style) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Fabrication Yield & Quality Analytics
          </h1>
          <p className="text-xs text-[#7c9cd2] mt-0.5">
            Statistical defect tracking across fabrication batches, operator shifts, and board models.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7c9cd2]">
          <span>Period: <strong>01 May 2025 – 20 May 2025</strong></span>
        </div>
      </div>

      {/* KPI Cards Row (Image 1 SmartSensor-X style) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs text-[#7c9cd2] font-medium block">Defective Boards</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">12.5%</span>
          <span className="text-[11px] text-[#5d7cb4]">Avg across lines</span>
        </div>
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs text-[#7c9cd2] font-medium block">Total Defects</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">238</span>
          <span className="text-[11px] text-[#5d7cb4]">Flagged locations</span>
        </div>
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs text-[#7c9cd2] font-medium block">Avg Defects/Board</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">1.8</span>
          <span className="text-[11px] text-[#5d7cb4]">Per inspected panel</span>
        </div>
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs text-[#7c9cd2] font-medium block">Worst Shift</span>
          <span className="text-sm font-bold text-white mt-2 block">Shift B – 16 May</span>
          <span className="text-[11px] text-[#5d7cb4]">Batch 1200 / Line 3</span>
        </div>
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs text-[#7c9cd2] font-medium block">Most Frequent Defect</span>
          <span className="text-sm font-bold text-rose-300 mt-2 block truncate">
            Missing Component (C9)
          </span>
          <span className="text-[11px] text-[#5d7cb4]">Clearance bridge</span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Defect Type Frequency (Image 1 style) */}
        <div className="bg-[#0b1736] p-5 rounded-2xl border border-[#172c5c]">
          <h3 className="text-sm font-bold text-white mb-1">Defect Type Frequency</h3>
          <p className="text-xs text-[#7c9cd2] mb-4">Total occurrences across all inspection runs</p>

          <div className="space-y-3.5">
            {defectFrequency.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-200 font-medium">{item.name}</span>
                  <span className="font-mono font-bold text-white">{item.count}</span>
                </div>
                <div className="w-full h-3 rounded bg-[#071126] overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Root Cause Breakdown (Image 1 style) */}
        <div className="bg-[#0b1736] p-5 rounded-2xl border border-[#172c5c]">
          <h3 className="text-sm font-bold text-white mb-1">Root Cause Breakdown</h3>
          <p className="text-xs text-[#7c9cd2] mb-4">Underlying design and etching failure mechanisms</p>

          <div className="space-y-3">
            {rootCauses.map((rc) => (
              <div
                key={rc.cause}
                className="bg-[#081228] p-3 rounded-xl border border-[#14264e] flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-white block">{rc.cause}</span>
                  <span className="text-[11px] text-[#7c9cd2] font-mono">
                    {rc.count} instances recorded
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-400 font-mono">{rc.share}%</span>
                  <span className="text-[10px] text-[#5d7cb4] block">share</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
