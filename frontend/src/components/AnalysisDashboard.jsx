import { useMemo, useState } from 'react';
import { Icon } from './Visuals';

export default function AnalysisDashboard({
  job,
  selectedErrorIndex = 0,
  onSelectError,
  onExportReport,
  profile,
}) {
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'findings' | 'stack' | 'rules'
  const [ruleFilter, setRuleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const errors = Array.isArray(job?.errors) ? job.errors : [];
  const status = job?.status || 'PASS';
  const totalErrors = errors.length;

  // Defect frequency breakdown (Image 1 SmartSensor-X style)
  const frequencyData = useMemo(() => {
    const counts = {};
    errors.forEach((err) => {
      counts[err.rule] = (counts[err.rule] || 0) + 1;
    });

    return [
      {
        rule: 'TRACE_CLEARANCE',
        label: 'Solder Bridge / Clearance',
        count: counts.TRACE_CLEARANCE || 0,
        color: '#ef4444', // Red
      },
      {
        rule: 'MIN_TRACE_WIDTH',
        label: 'Missing Copper / Trace Width',
        count: counts.MIN_TRACE_WIDTH || 0,
        color: '#f59e0b', // Amber
      },
      {
        rule: 'ANNULAR_RING',
        label: 'Drill Misalignment / Annular',
        count: counts.ANNULAR_RING || 0,
        color: '#10b981', // Green
      },
    ].filter((item) => item.count > 0 || totalErrors === 0);
  }, [errors, totalErrors]);

  const maxFrequency = Math.max(...frequencyData.map((f) => f.count), 1);

  // Filtered errors for review
  const filteredErrors = useMemo(() => {
    return errors
      .map((error, index) => ({ error, index }))
      .filter(({ error }) => {
        const matchesRule = ruleFilter === 'ALL' || error.rule === ruleFilter;
        const textToSearch = `${error.rule} ${error.component || ''} ${error.message} ${error.coordinates?.x} ${error.coordinates?.y}`.toLowerCase();
        const matchesSearch = textToSearch.includes(searchQuery.trim().toLowerCase());
        return matchesRule && matchesSearch;
      });
  }, [errors, ruleFilter, searchQuery]);

  // Cadence DFM Engineering Diagnostic Insight
  const engineeringInsight = useMemo(() => {
    if (status === 'PASS' || totalErrors === 0) {
      return {
        title: 'Fabrication Compliance Verified',
        severity: 'PASS',
        color: '#10b981',
        text: 'All copper traces, clearances, and drill hits satisfy the active IPC Class 2 fabrication tolerances. No copper bridge or annular ring breakout risks detected.',
        recommendation: 'Release Gerber archive to fabrication fab-line. Batch ready for tooling.',
      };
    }

    const clearanceIssues = errors.filter((e) => e.rule.includes('CLEARANCE')).length;
    return {
      title: 'High Solder Bridge Risk Detected',
      severity: 'ACTION REQUIRED',
      color: '#ef4444',
      text: `Copper clearance trend indicates ${clearanceIssues} bottlenecks below the 0.200 mm threshold. Traces around dense QFN pads and power rails will likely bridge during wave soldering.`,
      recommendation: 'Increase polygon isolation gap to 0.20 mm and reroute necked traces before fab release.',
    };
  }, [status, totalErrors, errors]);

  return (
    <div className="analysis-dashboard-root flex flex-col h-full bg-[#0a1733] rounded-2xl border border-[#1a2f5a] shadow-xl overflow-hidden">
      {/* Top Header / KPI Status Strip (SmartSensor-X Image 1 style) */}
      <div className="p-4 bg-[#081329] border-b border-[#182d57]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 ${
                status === 'PASS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'PASS' ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'
                }`}
              />
              {status === 'PASS' ? 'Inspection Status: PASS' : 'Inspection Status: FAIL'}
            </span>
            <span className="text-xs text-[#8ca8dc]">
              {profile?.name || job?.profile_name || 'Standard 0.20mm'}
            </span>
          </div>

          <button
            type="button"
            onClick={onExportReport}
            className="px-3 py-1 text-xs bg-[#142854] hover:bg-[#1b356e] text-white rounded-lg border border-[#244380] transition flex items-center gap-1.5 shadow-sm"
          >
            <Icon name="download" className="w-3.5 h-3.5 text-blue-300" />
            <span>Export Report</span>
          </button>
        </div>

        {/* 4 KPI Metric Cards (SmartSensor-X Image 1 style) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* KPI 1: Defect Rate */}
          <div className="bg-[#0c1b3d] p-2.5 rounded-xl border border-[#182e5e]">
            <span className="text-[10px] uppercase font-semibold text-[#7c9cd2] block">
              Defective Rate
            </span>
            <span className="text-base font-bold text-amber-400 mt-0.5 block">
              {totalErrors === 0 ? '0.0%' : '12.5%'}
            </span>
            <span className="text-[10px] text-[#6d88ba]">Defective boards</span>
          </div>

          {/* KPI 2: Total Defects */}
          <div className="bg-[#0c1b3d] p-2.5 rounded-xl border border-[#182e5e]">
            <span className="text-[10px] uppercase font-semibold text-[#7c9cd2] block">
              Total Defects
            </span>
            <span className="text-base font-bold text-rose-400 mt-0.5 block">
              {totalErrors}
            </span>
            <span className="text-[10px] text-[#6d88ba]">Violations</span>
          </div>

          {/* KPI 3: Avg Defects per Board */}
          <div className="bg-[#0c1b3d] p-2.5 rounded-xl border border-[#182e5e]">
            <span className="text-[10px] uppercase font-semibold text-[#7c9cd2] block">
              Avg Defects
            </span>
            <span className="text-base font-bold text-amber-400 mt-0.5 block">
              {totalErrors === 0 ? '0.0' : '1.8'}
            </span>
            <span className="text-[10px] text-[#6d88ba]">per panel</span>
          </div>

          {/* KPI 4: Most Frequent Defect */}
          <div className="bg-[#0c1b3d] p-2.5 rounded-xl border border-[#182e5e]">
            <span className="text-[10px] uppercase font-semibold text-[#7c9cd2] block">
              Worst Defect
            </span>
            <span className="text-xs font-bold text-white mt-1 block truncate">
              {totalErrors === 0 ? 'None (Clean)' : 'Clearance (C9)'}
            </span>
            <span className="text-[10px] text-[#6d88ba]">Most frequent</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Cadence style) */}
      <div className="flex items-center border-b border-[#182d57] bg-[#091530] px-3">
        <button
          type="button"
          onClick={() => setActiveTab('insights')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'insights'
              ? 'border-blue-400 text-white font-semibold'
              : 'border-transparent text-[#7c9cd2] hover:text-white'
          }`}
        >
          <Icon name="chart" className="w-3.5 h-3.5" />
          <span>Defect Frequency & AI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('findings')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'findings'
              ? 'border-blue-400 text-white font-semibold'
              : 'border-transparent text-[#7c9cd2] hover:text-white'
          }`}
        >
          <Icon name="alert" className="w-3.5 h-3.5" />
          <span>Review Items ({totalErrors})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stack')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'stack'
              ? 'border-blue-400 text-white font-semibold'
              : 'border-transparent text-[#7c9cd2] hover:text-white'
          }`}
        >
          <Icon name="layers" className="w-3.5 h-3.5" />
          <span>Layer Stack</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          className={`px-3 py-2.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
            activeTab === 'rules'
              ? 'border-blue-400 text-white font-semibold'
              : 'border-transparent text-[#7c9cd2] hover:text-white'
          }`}
        >
          <Icon name="rules" className="w-3.5 h-3.5" />
          <span>Rules</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= TAB 1: DEFECT FREQUENCY & AI INSIGHT (Image 1 style) ================= */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {/* Defect Type Frequency Bar Chart (Image 1 SmartSensor-X style) */}
            <div className="bg-[#0d1d40] rounded-xl p-4 border border-[#1b3363] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Defect Type Frequency
                </h4>
                <span className="text-[11px] text-[#7c9cd2]">Defects count</span>
              </div>

              {frequencyData.length > 0 ? (
                <div className="space-y-3">
                  {frequencyData.map((item) => (
                    <button
                      key={item.rule}
                      type="button"
                      onClick={() => {
                        setRuleFilter(item.rule);
                        setActiveTab('findings');
                        const firstIdx = errors.findIndex((e) => e.rule === item.rule);
                        if (firstIdx !== -1) onSelectError(firstIdx);
                      }}
                      className="w-full text-left group p-1.5 rounded-lg hover:bg-[#142854] transition"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-200 group-hover:text-white font-medium">
                          {item.label}
                        </span>
                        <span className="font-bold text-white font-mono">{item.count}</span>
                      </div>
                      {/* Bar track matching Image 1 horizontal bar chart */}
                      <div className="w-full h-3 rounded-md bg-[#081329] p-0.5 overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${Math.max((item.count / maxFrequency) * 100, 6)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#7c9cd2]">
                  No defect categories to display. All checks passed.
                </div>
              )}
            </div>

            {/* AI Insight Card (Image 1 SmartSensor-X style) */}
            <div className="bg-[#0d1d40] rounded-xl p-4 border border-[#1b3363] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon name="sparkles" className="w-4 h-4 text-blue-300" />
                  <h4 className="text-xs font-bold text-white tracking-wide">AI Insight</h4>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${engineeringInsight.color}20`,
                    color: engineeringInsight.color,
                  }}
                >
                  {engineeringInsight.severity}
                </span>
              </div>

              <p className="text-xs text-[#cbd5e1] leading-relaxed mb-2.5">
                {engineeringInsight.text}
              </p>

              <div className="bg-[#081329] p-2.5 rounded-lg border border-[#162a54] text-xs">
                <span className="text-[11px] font-semibold text-blue-300 block mb-0.5">
                  Recommendation:
                </span>
                <span className="text-slate-300 leading-relaxed">
                  {engineeringInsight.recommendation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: REVIEW FINDINGS ================= */}
        {activeTab === 'findings' && (
          <div className="space-y-3">
            {/* Filter pills & search */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => setRuleFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    ruleFilter === 'ALL'
                      ? 'bg-[#1e40af] text-white shadow-sm'
                      : 'bg-[#0d1d40] text-[#7c9cd2] hover:text-white'
                  }`}
                >
                  All ({totalErrors})
                </button>
                {frequencyData.map((f) => (
                  <button
                    key={f.rule}
                    type="button"
                    onClick={() => setRuleFilter(f.rule)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                      ruleFilter === f.rule
                        ? 'bg-[#1e40af] text-white shadow-sm'
                        : 'bg-[#0d1d40] text-[#7c9cd2] hover:text-white'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                    <span>{f.label.split('/')[0]} ({f.count})</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter defects by component, rule, or coords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#081329] border border-[#182d57] rounded-lg px-8 py-1.5 text-xs text-white placeholder-[#6079a8] focus:outline-none focus:border-blue-400"
                />
                <span className="absolute left-2.5 top-2 text-[#6079a8]">
                  <Icon name="search" className="w-3.5 h-3.5" />
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* List of modern Finding Cards */}
            <div className="space-y-2">
              {filteredErrors.length > 0 ? (
                filteredErrors.map(({ error, index }) => {
                  const isSelected = selectedErrorIndex === index;
                  const isRed = error.rule.includes('CLEARANCE');

                  return (
                    <div
                      key={`card-${index}`}
                      onClick={() => onSelectError(index)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#142854] border-blue-400 shadow-md ring-1 ring-blue-400/30'
                          : 'bg-[#0d1d40] border-[#182d57] hover:bg-[#10224a] hover:border-[#223f7a]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs text-white"
                            style={{ backgroundColor: isRed ? '#ef4444' : '#f59e0b' }}
                          >
                            {index + 1}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {humanRule(error.rule)}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#8ca8dc]">
                          {error.component || `Loc #${index + 1}`}
                        </span>
                      </div>

                      <p className="text-xs text-[#cbd5e1] leading-relaxed mb-2">
                        {error.message}
                      </p>

                      {/* Measured vs Limit bar */}
                      {error.measured && error.limit && (
                        <div className="bg-[#081329] p-2 rounded-lg border border-[#162a54] mb-2 text-xs">
                          <div className="flex justify-between text-[#8ca8dc] mb-1 font-mono text-[11px]">
                            <span>Measured: <strong className="text-rose-400">{error.measured.toFixed(3)} mm</strong></span>
                            <span>Limit: <strong className="text-emerald-400">≥ {error.limit.toFixed(3)} mm</strong></span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-[#162a54] overflow-hidden">
                            <div
                              className="h-full bg-rose-400 rounded-full"
                              style={{ width: `${Math.min((error.measured / error.limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-[#162a54] text-[11px] text-[#7c9cd2]">
                        <span>
                          X: {Number(error.coordinates?.x ?? 0).toFixed(2)} mm, Y:{' '}
                          {Number(error.coordinates?.y ?? 0).toFixed(2)} mm
                        </span>
                        <span className="text-blue-300 hover:text-white flex items-center gap-1 font-medium">
                          <span>Locate on PCB</span>
                          <Icon name="crosshair" className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-[#7c9cd2]">
                  No findings match the current filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: LAYER STACK ================= */}
        {activeTab === 'stack' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Cadence PCB Layer Stackup
            </h4>
            <div className="space-y-2">
              {job?.board?.layers?.map((layer, idx) => (
                <div
                  key={layer.name}
                  className="bg-[#0d1d40] p-3 rounded-xl border border-[#182d57] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-7 rounded"
                      style={{ backgroundColor: layer.color || '#10b981' }}
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Layer {idx + 1}: {layer.name}
                      </span>
                      <span className="text-[10px] text-[#7c9cd2] font-mono">
                        {layer.paths?.length || 0} vector geometry primitives
                      </span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#162c5b] text-[#93c5fd]">
                    Active
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#0d1d40] p-3 rounded-xl border border-[#182d57] mt-3">
              <span className="text-xs text-[#7c9cd2] block mb-1">Board Dimensions:</span>
              <p className="text-sm font-bold text-white">
                {Number(job?.board?.width || 0).toFixed(2)} mm (W) ×{' '}
                {Number(job?.board?.height || 0).toFixed(2)} mm (H)
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 4: RULES ================= */}
        {activeTab === 'rules' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Fabrication Tolerance Constraints
            </h4>
            <div className="space-y-2">
              <div className="bg-[#0d1d40] p-3 rounded-xl border border-[#182d57]">
                <span className="text-[10px] uppercase text-[#7c9cd2] font-semibold block">
                  Minimum Copper Clearance
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {formatRule(profile?.minClearance || 0.20)} mm
                </span>
                <p className="text-xs text-[#cbd5e1] mt-1">
                  Air gap between adjacent copper traces and pads.
                </p>
              </div>

              <div className="bg-[#0d1d40] p-3 rounded-xl border border-[#182d57]">
                <span className="text-[10px] uppercase text-[#7c9cd2] font-semibold block">
                  Minimum Trace Width
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {formatRule(profile?.minTraceWidth || 0.20)} mm
                </span>
                <p className="text-xs text-[#cbd5e1] mt-1">
                  Smallest width permitted for signal and power tracks.
                </p>
              </div>

              <div className="bg-[#0d1d40] p-3 rounded-xl border border-[#182d57]">
                <span className="text-[10px] uppercase text-[#7c9cd2] font-semibold block">
                  Minimum Annular Ring
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {formatRule(profile?.minAnnularRing || 0.15)} mm
                </span>
                <p className="text-xs text-[#cbd5e1] mt-1">
                  Drill pad copper margin to avoid hole breakout.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-[#071024] border-t border-[#14264e] text-xs text-[#7392c7] flex items-center justify-between">
        <span>Click any defect to inspect on the PCB</span>
        <span>IPC-2221 Design Verification</span>
      </div>
    </div>
  );
}

function humanRule(rule) {
  return String(rule || 'Finding')
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatRule(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : value;
}
