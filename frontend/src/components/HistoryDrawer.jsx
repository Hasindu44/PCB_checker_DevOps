import { useMemo, useState } from 'react';
import { Icon } from './Visuals';

export default function HistoryDrawer({
  isOpen,
  onClose,
  jobs = [],
  selectedJobId,
  onSelectJob,
  onRefresh,
  isRefreshing,
}) {
  const [filter, setFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'FAIL' && job.status === 'FAIL') ||
        (filter === 'PASS' && job.status === 'PASS');
      const text = `${job.filename} ${job.profile_name}`.toLowerCase();
      const matchesQuery = text.includes(query.trim().toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [jobs, filter, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="relative w-full max-w-md bg-[#0d1611] border-l border-[#1f3326] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1b2b20] flex items-center justify-between bg-[#0a120e]">
          <div className="flex items-center gap-2">
            <Icon name="board" className="w-5 h-5 text-emerald-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              DRC Job History ({jobs.length})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg text-[#7e9485] hover:text-white hover:bg-[#16271e] transition"
              title="Refresh History"
            >
              <Icon name="refresh" className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7e9485] hover:text-white hover:bg-[#16271e] transition"
              title="Close Panel"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="p-3 border-b border-[#1b2b20] space-y-2 bg-[#0c1510]">
          <div className="grid grid-cols-3 gap-1 bg-[#101c15] p-1 rounded-lg border border-[#1b2b20] text-xs font-mono">
            {['ALL', 'FAIL', 'PASS'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`py-1 rounded text-center transition ${
                  filter === f
                    ? 'bg-[#1c3525] text-white font-bold shadow-sm'
                    : 'text-[#6e8275] hover:text-[#a0b5a8]'
                }`}
              >
                {f === 'ALL' ? 'All Runs' : f === 'FAIL' ? 'Flagged' : 'Passed'}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search filename or profile..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#101b15] border border-[#1f3526] rounded-lg px-8 py-1.5 text-xs text-white placeholder-[#5a6f62] focus:outline-none focus:border-emerald-500"
            />
            <span className="absolute left-2.5 top-2 text-[#5a6f62]">
              <Icon name="search" className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              const createdDate = job.created_at
                ? new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  }).format(new Date(job.created_at))
                : 'Recent';

              return (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => {
                    onSelectJob(job);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#15291e] border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-[#101c15] border-[#1d3324] hover:bg-[#13231a] hover:border-[#274431]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-white truncate max-w-[240px]">
                      {job.filename}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        job.status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {job.status === 'PASS' ? 'PASS' : `${job.total_errors ?? 0} FINDINGS`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#718779] font-mono">
                    <span className="truncate max-w-[180px]">{job.profile_name}</span>
                    <span>{createdDate}</span>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-[#6e8275]">
              No past review runs found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1b2b20] bg-[#0a120e] text-[11px] font-mono text-[#6e8275] flex items-center justify-between">
          <span>Showing {filteredJobs.length} of {jobs.length} jobs</span>
          <button
            type="button"
            onClick={onClose}
            className="text-emerald-400 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

