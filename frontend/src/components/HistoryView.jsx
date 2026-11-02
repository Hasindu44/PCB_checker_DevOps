import { useMemo, useState } from 'react';
import { Icon } from './Visuals';

export default function HistoryView({ jobs = [], onOpenJob, onRefresh, isRefreshing }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesFilter =
        filter === 'ALL' ||
        (filter === 'FAIL' && job.status === 'FAIL') ||
        (filter === 'PASS' && job.status === 'PASS');
      const text = `${job.filename} ${job.profile_name} ${job.serial_number || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.trim().toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [jobs, filter, search]);

  const passedCount = jobs.filter((j) => j.status === 'PASS').length;
  const failedCount = jobs.filter((j) => j.status === 'FAIL').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#070e1e]">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Fabrication Job History</h1>
          <p className="text-xs text-[#7c9cd2] mt-0.5">
            Audit log of all Gerber packages checked against manufacturing DRC constraints.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1.5 rounded-lg bg-[#0e1d3e] hover:bg-[#142958] text-white text-xs font-medium border border-[#1a3570] flex items-center gap-1.5 transition"
        >
          <Icon name="refresh" className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh List'}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs font-medium text-[#7c9cd2] block">Total Runs</span>
          <span className="text-2xl font-bold text-white mt-1 block">{jobs.length}</span>
          <span className="text-[11px] text-[#5d7cb4]">Archive packages</span>
        </div>
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs font-medium text-[#7c9cd2] block">Passed Checks</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">{passedCount}</span>
          <span className="text-[11px] text-[#5d7cb4]">Zero violations</span>
        </div>
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs font-medium text-[#7c9cd2] block">Flagged Runs</span>
          <span className="text-2xl font-bold text-rose-400 mt-1 block">{failedCount}</span>
          <span className="text-[11px] text-[#5d7cb4]">Required review</span>
        </div>
        <div className="bg-[#0b1736] p-4 rounded-xl border border-[#172c5c]">
          <span className="text-xs font-medium text-[#7c9cd2] block">First-Pass Yield</span>
          <span className="text-2xl font-bold text-blue-400 mt-1 block">
            {jobs.length ? Math.round((passedCount / jobs.length) * 100) : 100}%
          </span>
          <span className="text-[11px] text-[#5d7cb4]">Overall yield</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b1736] p-3 rounded-xl border border-[#172c5c]">
        <div className="flex items-center gap-1.5">
          {['ALL', 'FAIL', 'PASS'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? 'bg-[#1e40af] text-white shadow-sm'
                  : 'text-[#7c9cd2] hover:text-white hover:bg-[#102047]'
              }`}
            >
              {f === 'ALL'
                ? `All Runs (${jobs.length})`
                : f === 'FAIL'
                ? `Flagged (${failedCount})`
                : `Passed (${passedCount})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search package name or profile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#081228] border border-[#1a3366] rounded-lg px-8 py-1.5 text-xs text-white placeholder-[#5a76ab] focus:outline-none focus:border-blue-400"
          />
          <span className="absolute left-2.5 top-2 text-[#5a76ab]">
            <Icon name="search" className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Table of Jobs */}
      <div className="bg-[#0b1736] rounded-xl border border-[#172c5c] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#081228] border-b border-[#172c5c] text-[#7c9cd2] font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Gerber Package</th>
                <th className="py-3 px-4">Rule Profile</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Defects</th>
                <th className="py-3 px-4">Inspection Result</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#13254d]">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => {
                  const dateStr = job.created_at
                    ? new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(job.created_at))
                    : 'Recent';

                  return (
                    <tr key={job.id} className="hover:bg-[#0e1d44] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#142650] flex items-center justify-center text-blue-300">
                            <Icon name="board" className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-semibold text-white block">{job.filename}</span>
                            <span className="text-[10px] text-[#6d8bbf]">
                              {job.serial_number || 'Rev C'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#cbd5e1]">{job.profile_name}</td>
                      <td className="py-3.5 px-4 text-[#7c9cd2]">{dateStr}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {job.total_errors ?? job.errors?.length ?? 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            job.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              job.status === 'PASS' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          {job.status === 'PASS' ? 'PASSED' : 'FLAGGED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenJob(job)}
                          className="px-3 py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-medium transition shadow-sm"
                        >
                          Open in Workbench
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6d8bbf]">
                    No matching Gerber packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
