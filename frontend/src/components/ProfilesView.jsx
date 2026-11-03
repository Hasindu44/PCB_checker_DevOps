import { Icon } from './Visuals';

export default function ProfilesView({ profiles = [], activeProfileId, onSelectProfile }) {
  const defaultProfiles = [
    {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Standard 2-Layer Fabrication',
      description: 'General-purpose limits for standard two-layer PCB manufacturing.',
      minTraceWidth: 0.20,
      minClearance: 0.20,
      minAnnularRing: 0.15,
      isDefault: true,
      tag: 'STANDARD',
    },
    {
      id: '00000000-0000-4000-8000-000000000002',
      name: 'Fine-Pitch 4-Layer HDI',
      description: 'Tight tolerance limits for multi-layer dense BGA and QFN routing.',
      minTraceWidth: 0.15,
      minClearance: 0.15,
      minAnnularRing: 0.12,
      isDefault: false,
      tag: 'HIGH DENSITY',
    },
    {
      id: '00000000-0000-4000-8000-000000000003',
      name: 'High-Power & RF Copper',
      description: 'Wide spacing rules for high voltage creepage and thermal heavy copper.',
      minTraceWidth: 0.35,
      minClearance: 0.30,
      minAnnularRing: 0.20,
      isDefault: false,
      tag: 'POWER / RF',
    },
  ];

  const displayProfiles = profiles.length ? profiles : defaultProfiles;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#070e1e]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">
          Manufacturing Rule Profiles
        </h1>
        <p className="text-xs text-[#7c9cd2] mt-0.5">
          Configure copper clearance, trace width, and annular ring geometric constraints.
        </p>
      </div>

      {/* Grid of Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayProfiles.map((p) => {
          const isSelected = activeProfileId === p.id || (p.isDefault && !activeProfileId);

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0f214a] border-blue-400 shadow-lg ring-1 ring-blue-400/30'
                  : 'bg-[#0b1736] border-[#172c5c] hover:bg-[#0e1d44]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    {p.tag || (p.isDefault ? 'DEFAULT' : 'PROFILE')}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <Icon name="check" className="w-3.5 h-3.5" />
                      Active Ruleset
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1">{p.name}</h3>
                <p className="text-xs text-[#cbd5e1] leading-relaxed mb-4">
                  {p.description || 'Standard manufacturing tolerance constraints.'}
                </p>

                {/* Specs list */}
                <div className="space-y-2 bg-[#071126] p-3 rounded-xl border border-[#14264e] mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7c9cd2]">Min Copper Clearance:</span>
                    <strong className="text-white font-mono">{Number(p.minClearance).toFixed(2)} mm</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7c9cd2]">Min Trace Width:</span>
                    <strong className="text-white font-mono">{Number(p.minTraceWidth).toFixed(2)} mm</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#7c9cd2]">Min Annular Ring:</span>
                    <strong className="text-white font-mono">{Number(p.minAnnularRing).toFixed(2)} mm</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectProfile(p.id)}
                className={`w-full py-2 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-[#1e40af] text-white cursor-default'
                    : 'bg-[#142650] hover:bg-[#1b3570] text-[#cbd5e1] hover:text-white'
                }`}
              >
                {isSelected ? 'Currently Selected' : 'Apply to Next Check'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Visual Rule Explanations (Cadence Allegro Style) */}
      <div className="bg-[#0b1736] p-5 rounded-2xl border border-[#172c5c]">
        <h3 className="text-sm font-bold text-white mb-3">
          IPC-2221 Geometric Verification Parameters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#081228] p-3.5 rounded-xl border border-[#14264e]">
            <span className="font-semibold text-blue-300 block mb-1">
              1. Trace Clearance (Air-gap)
            </span>
            <p className="text-[#a1b8e0] leading-relaxed">
              Minimum separation between any two adjacent copper polygons, tracks, or SMD pads. Prevents solder bridging and etching shorts.
            </p>
          </div>
          <div className="bg-[#081228] p-3.5 rounded-xl border border-[#14264e]">
            <span className="font-semibold text-blue-300 block mb-1">
              2. Minimum Trace Width
            </span>
            <p className="text-[#a1b8e0] leading-relaxed">
              Minimum cross-sectional thickness of signal, clock, and power lines. Ensures current capacity and prevents etch-out open circuits.
            </p>
          </div>
          <div className="bg-[#081228] p-3.5 rounded-xl border border-[#14264e]">
            <span className="font-semibold text-blue-300 block mb-1">
              3. Annular Ring Margin
            </span>
            <p className="text-[#a1b8e0] leading-relaxed">
              Radial copper width encircling via drill hits: (Pad Diameter − Drill Diameter) / 2. Protects against drill wander breakout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
