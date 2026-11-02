import { useEffect, useRef, useState } from 'react';
import { drcApi } from '../api';
import AnalysisDashboard from './AnalysisDashboard';
import HistoryDrawer from './HistoryDrawer';
import PCBViewer from './PCBViewer';
import { Icon, Mark } from './Visuals';
import { DEMO_JOB } from './demoBoardData';
import './ModernPCBWorkbench.css';

export default function Dashboard({ user, onLogout }) {
  const fileInputRef = useRef(null);

  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(DEMO_JOB);
  const [selectedErrorIndex, setSelectedErrorIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const selectedProfile = profiles.find((p) => p.id === profileId);
  const userName = user?.name || user?.email?.split('@')[0] || 'Engineer';
  const initials = userName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  // Load profiles and jobs on mount
  useEffect(() => {
    let active = true;
    Promise.all([drcApi.profiles().catch(() => []), drcApi.jobs().catch(() => [])])
      .then(([availableProfiles, recentJobs]) => {
        if (!active) return;
        setProfiles(availableProfiles);
        const defaultProfile =
          availableProfiles.find((p) => p.isDefault)?.id || availableProfiles[0]?.id || '';
        setProfileId(defaultProfile);
        setJobs(recentJobs);

        if (recentJobs.length > 0) {
          // Load the latest job details
          drcApi
            .job(recentJobs[0].id)
            .then((fullJob) => {
              if (active) {
                setSelectedJob(fullJob);
                setIsDemoMode(false);
                setSelectedErrorIndex(0);
              }
            })
            .catch(() => {
              if (active) {
                setSelectedJob(recentJobs[0]);
                setIsDemoMode(false);
              }
            });
        } else {
          // No jobs yet, start with the rich demo board!
          setSelectedJob(DEMO_JOB);
          setIsDemoMode(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Refresh job list
  async function handleRefreshJobs() {
    setRefreshing(true);
    try {
      const recentJobs = await drcApi.jobs();
      setJobs(recentJobs);
      showNotice('Job history refreshed.', 'info');
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setRefreshing(false);
    }
  }

  // Open a specific job
  async function handleOpenJob(jobSummary) {
    setBusy(true);
    try {
      const fullJob = await drcApi.job(jobSummary.id);
      setSelectedJob(fullJob);
      setIsDemoMode(false);
      setSelectedErrorIndex(0);
      showNotice(`Loaded ${fullJob.filename}`, 'success');
    } catch (err) {
      setSelectedJob(jobSummary);
      setIsDemoMode(false);
      showNotice(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  // Handle file upload
  async function handleUploadFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      showNotice('Please upload a ZIP archive containing Gerber fabrication files.', 'error');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showNotice('The archive exceeds the 25 MB size limit.', 'error');
      return;
    }

    const targetProfileId = profileId || profiles[0]?.id;
    if (!targetProfileId) {
      showNotice('Select a manufacturing rule profile first.', 'error');
      return;
    }

    setBusy(true);
    showNotice(`Uploading and inspecting ${file.name}...`, 'info');

    try {
      const newJob = await drcApi.validate(file, targetProfileId);
      setSelectedJob(newJob);
      setIsDemoMode(false);
      setSelectedErrorIndex(0);
      setJobs((prev) => [newJob, ...prev.filter((j) => j.id !== newJob.id)].slice(0, 50));
      showNotice(
        `Check complete: ${newJob.status === 'PASS' ? '0 violations (Pass)' : `${newJob.total_errors ?? newJob.errors?.length ?? 0} findings`}`,
        newJob.status === 'PASS' ? 'success' : 'warning'
      );
    } catch (err) {
      if (err.data?.id) {
        setSelectedJob(err.data);
        setIsDemoMode(false);
        setJobs((prev) => [err.data, ...prev.filter((j) => j.id !== err.data.id)].slice(0, 50));
      }
      showNotice(err.message || 'DRC processing failed for this archive.', 'error');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // Load sample demo board
  function handleLoadDemo() {
    setSelectedJob(DEMO_JOB);
    setIsDemoMode(true);
    setSelectedErrorIndex(0);
    showNotice('Loaded SmartSensor-X12 sample demo board.', 'info');
  }

  // Export inspection report as JSON
  function handleExportReport() {
    if (!selectedJob) return;
    const reportData = {
      project: selectedJob.filename,
      date: new Date().toISOString(),
      status: selectedJob.status,
      profile: selectedJob.profile_name,
      total_findings: selectedJob.errors?.length || 0,
      board_dimensions: `${selectedJob.board?.width} x ${selectedJob.board?.height} mm`,
      findings: selectedJob.errors || [],
      warnings: selectedJob.warnings || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DRC_Report_${selectedJob.filename.replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Exported inspection findings report.', 'success');
  }

  // Temporary toast notice
  function showNotice(text, type = 'info') {
    setStatusNotice({ text, type });
    window.setTimeout(() => {
      setStatusNotice((curr) => (curr?.text === text ? null : curr));
    }, 4500);
  }

  return (
    <div className="workbench-container">
      {/* Top Main Navigation Header */}
      <header className="workbench-navbar flex items-center justify-between px-4 py-2.5 bg-[#0a120e] border-b border-[#1b2b20] z-30 select-none">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Mark light className="w-8 h-8 rounded-lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white tracking-tight">
                  CircuitGuard
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DRC v2.4
                </span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#718779] block">
                PCB Review Workbench
              </span>
            </div>
          </div>
        </div>

        {/* Center: Active File Pill & Upload Action Button */}
        <div className="flex items-center gap-2">
          {/* Active File Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#111e17] border border-[#203628] text-xs font-mono text-[#cbd5e1]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[200px]" title={selectedJob?.filename}>
              {selectedJob?.filename || 'No board loaded'}
            </span>
            {isDemoMode && (
              <span className="px-1 text-[9px] rounded bg-amber-500/20 text-amber-300">
                DEMO
              </span>
            )}
          </div>

          {/* Quick Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-[#183624] hover:bg-[#204a32] text-white border border-[#2d5c3d] text-xs font-mono font-medium flex items-center gap-1.5 transition shadow-sm"
          >
            <Icon name="upload" className="w-3.5 h-3.5 text-emerald-400" />
            <span>{busy ? 'Inspecting...' : 'Upload Gerber (.zip)'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleUploadFile(e.target.files[0]);
            }}
          />

          {/* Rule Profile Dropdown */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-[#1a2d20]">
            <span className="text-[11px] font-mono text-[#718779]">Rule:</span>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="bg-[#101b15] border border-[#203628] rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            >
              {profiles.length ? (
                profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.minClearance}mm)
                  </option>
                ))
              ) : (
                <option value="">Standard fab (0.20 mm)</option>
              )}
            </select>
          </div>
        </div>

        {/* Right Tools: Demo Loader, History Toggle & User Tools */}
        <div className="flex items-center gap-2">
          {/* Load Sample Demo Button */}
          <button
            type="button"
            onClick={handleLoadDemo}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-[#8ca395] hover:text-emerald-300 hover:bg-[#122018] rounded-lg border border-transparent hover:border-[#1e3325] transition"
            title="Load sample sensor board"
          >
            <Icon name="sparkles" className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sample Demo</span>
          </button>

          {/* History Drawer Trigger */}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="px-2.5 py-1 text-xs font-mono bg-[#111e17] hover:bg-[#182c21] text-[#a1b8ab] hover:text-white rounded-lg border border-[#203628] flex items-center gap-1.5 transition"
            title="Open review history drawer"
          >
            <Icon name="board" className="w-3.5 h-3.5 text-emerald-400" />
            <span>History ({jobs.length})</span>
          </button>

          {/* User initials & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#1a2d20]">
            <div
              className="w-7 h-7 rounded-full bg-[#1b3324] border border-[#2d583c] flex items-center justify-center text-xs font-mono font-bold text-white"
              title={`${userName} (${user?.email})`}
            >
              {initials}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-[#718779] hover:text-rose-400 hover:bg-[#1b221d] rounded-lg transition"
              title="Sign out of CircuitGuard"
            >
              <Icon name="logout" className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dual-Pane Split Layout (Side-by-side PCB Viewer + Analysis) */}
      <main className="workbench-main flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden bg-[#070e0a]">
        {/* Left / Center: Interactive PCB Vector Viewer (7 of 12 cols on desktop) */}
        <div className="lg:col-span-7 h-full flex flex-col min-h-[400px]">
          <PCBViewer
            board={selectedJob?.board}
            errors={selectedJob?.errors || []}
            selectedErrorIndex={selectedErrorIndex}
            onSelectError={setSelectedErrorIndex}
            onUploadFile={handleUploadFile}
            isLoading={busy}
            isDemo={isDemoMode}
            onLoadDemo={handleLoadDemo}
          />
        </div>

        {/* Right: Modern Analysis Dashboard (5 of 12 cols on desktop) */}
        <div className="lg:col-span-5 h-full flex flex-col min-h-[400px]">
          <AnalysisDashboard
            job={selectedJob}
            selectedErrorIndex={selectedErrorIndex}
            onSelectError={setSelectedErrorIndex}
            onExportReport={handleExportReport}
            profile={selectedProfile}
          />
        </div>
      </main>

      {/* Slide-out Job History Drawer */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        jobs={jobs}
        selectedJobId={selectedJob?.id}
        onSelectJob={handleOpenJob}
        onRefresh={handleRefreshJobs}
        isRefreshing={refreshing}
      />

      {/* Floating Status Notification Toast */}
      {statusNotice && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl backdrop-blur-md shadow-2xl text-xs font-mono font-medium border ${
              statusNotice.type === 'error'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                : statusNotice.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                : statusNotice.type === 'warning'
                ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                : 'bg-[#102218]/90 text-white border-[#274733]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                statusNotice.type === 'error'
                  ? 'bg-rose-400'
                  : statusNotice.type === 'success'
                  ? 'bg-emerald-400'
                  : 'bg-amber-400'
              }`}
            />
            <span>{statusNotice.text}</span>
            <button
              type="button"
              onClick={() => setStatusNotice(null)}
              className="ml-2 text-white/60 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
