import { Icon, Mark } from './Visuals';

export default function Sidebar({
  activePage,
  onNavigate,
  user,
  onLogout,
  onTriggerUpload,
  jobCount = 0,
}) {
  const userName = user?.name || user?.email?.split('@')[0] || 'Michael Johnson';
  const initials = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const navItems = [
    { id: 'dashboard', label: 'DRC Workbench', icon: 'board', badge: null },
    { id: 'history', label: 'Job History', icon: 'clock', badge: jobCount > 0 ? jobCount : null },
    { id: 'analytics', label: 'Yield Analytics', icon: 'chart', badge: null },
    { id: 'profiles', label: 'Rule Profiles', icon: 'rules', badge: null },
    { id: 'profile', label: 'Operator Profile', icon: 'user', badge: null },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#09142b] border-r border-[#162952] flex flex-col justify-between select-none z-30">
      {/* Top Brand Lockup (Cadence Image 4 style) */}
      <div>
        <div className="p-4 border-b border-[#162952] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mark light className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <span className="font-sans text-sm font-bold tracking-tight text-white block">
                CircuitGuard
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7392c7] block">
                PCB Design & Analysis
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action: Upload Gerber Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="w-full py-2 px-3 rounded-lg bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-xs font-medium flex items-center justify-center gap-2 transition shadow-md shadow-blue-900/30 border border-blue-400/20"
          >
            <Icon name="upload" className="w-4 h-4 text-blue-200" />
            <span>Upload Gerber (.zip)</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 py-2 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#14264e] text-white font-semibold border-l-4 border-[#3b82f6] shadow-sm'
                    : 'text-[#8da7d6] hover:text-white hover:bg-[#0e1d3e]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    name={item.icon}
                    className={`w-4 h-4 ${isActive ? 'text-[#60a5fa]' : 'text-[#6281b8]'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#162c5b] text-[#93c5fd]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Operator Profile Card (SmartSensor-X Image 1 style) */}
      <div className="p-3 border-t border-[#162952] bg-[#071024]">
        <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c1836] border border-[#182c59]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#1d4ed8] to-[#60a5fa] text-white flex items-center justify-center font-bold text-xs shadow">
              {initials}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-white block truncate">
                {userName}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-[#7392c7]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Operator · Shift A</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-[#6c86b8] hover:text-rose-400 hover:bg-[#162852] rounded-lg transition"
            title="Sign out"
          >
            <Icon name="logout" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
