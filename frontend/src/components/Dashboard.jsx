import { useEffect, useMemo, useRef, useState } from 'react';
import { drcApi } from '../api';
import { Icon, Mark } from './Visuals';

const statusClasses = {
  PASS: 'border-[#c9d8c8] bg-[#f0f6ee] text-[#3d6342]',
  FAIL: 'border-[#e5c5bc] bg-[#fff4f0] text-[#963f30]',
  ERROR: 'border-[#e2d4ae] bg-[#fff9e9] text-[#806921]',
};

const navigation = [
  { id: 'overview', label: 'Overview', icon: 'overview' },
  { id: 'new-review', label: 'New DRC check', icon: 'upload' },
  { id: 'jobs', label: 'Job history', icon: 'board' },
  { id: 'rule-profile', label: 'Rule profiles', icon: 'rules' },
];

export default function Dashboard({ user, onLogout }) {
  const inputRef = useRef(null);
  const profileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [jobSearch, setJobSearch] = useState('');

  const selectedProfile = profiles.find((profile) => profile.id === profileId);
  const failedJobs = jobs.filter((job) => job.status === 'FAIL').length;
  const initials = (user.name || user.email || 'U').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const currentDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const matchesFilter = jobFilter === 'ALL'
      || (jobFilter === 'ISSUES' && (job.status === 'FAIL' || job.status === 'ERROR'))
      || job.status === jobFilter;
    const matchesSearch = `${job.filename} ${job.profile_name}`.toLowerCase().includes(jobSearch.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  }), [jobs, jobFilter, jobSearch]);

  useEffect(() => {
    let active = true;
    Promise.all([drcApi.profiles(), drcApi.jobs()])
      .then(([availableProfiles, recentJobs]) => {
        if (!active) return;
        setProfiles(availableProfiles);
        setProfileId(availableProfiles.find((profile) => profile.isDefault)?.id || availableProfiles[0]?.id || '');
        setJobs(recentJobs);
        setSelectedJob(recentJobs[0] || null);
        setLoadError('');
      })
      .catch((error) => { if (active) setLoadError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const elements = navigation.map(({ id }) => document.getElementById(id)).filter(Boolean);
    if (!elements.length || !('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.15, 0.4] });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  function navigateTo(id) {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
    if (id === 'rule-profile') window.setTimeout(() => profileRef.current?.focus(), 350);
  }

  function selectFile(candidate) {
    setMessage('');
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.zip')) {
      setFile(null);
      setMessage('Select a ZIP archive containing your Gerber fabrication files.');
      return;
    }
    if (candidate.size > 25 * 1024 * 1024) {
      setFile(null);
      setMessage('The archive must be 25 MB or smaller.');
      return;
    }
    setFile(candidate);
  }

  async function refreshJobs() {
    setRefreshing(true);
    try {
      const recentJobs = await drcApi.jobs();
      setJobs(recentJobs);
      setSelectedJob((current) => recentJobs.find((job) => job.id === current?.id) || recentJobs[0] || null);
      setLoadError('');
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setRefreshing(false);
    }
  }

  async function submitJob(event) {
    event.preventDefault();
    if (!file || !profileId || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const job = await drcApi.validate(file, profileId);
      setSelectedJob(job);
      setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)].slice(0, 50));
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      if (error.data?.id) {
        setSelectedJob(error.data);
        setJobs((current) => [error.data, ...current.filter((item) => item.id !== error.data.id)].slice(0, 50));
      }
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f5f1] text-[#202923] lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-30 hidden h-screen flex-col border-r border-[#29392f] bg-[#17251e] text-white lg:flex">
        <div className="flex h-[78px] shrink-0 items-center gap-3 border-b border-white/[0.08] px-6">
          <Mark light className="h-9 w-9" />
          <div><p className="text-sm font-semibold tracking-[-0.01em]">CircuitGuard</p><p className="mt-0.5 text-[9px] uppercase tracking-[0.17em] text-[#94a297]">Hardware review</p></div>
        </div>
        <div className="px-4 pt-6">
          <p className="px-3 font-mono text-[9px] uppercase tracking-[0.17em] text-[#849388]">Workspace</p>
          <nav className="mt-3" aria-label="Workspace navigation"><NavigationItems activeSection={activeSection} onNavigate={navigateTo} /></nav>
        </div>
        <div className="mx-6 mt-5 border-t border-white/[0.08]" />
        <div className="px-4 pt-5">
          <p className="px-3 font-mono text-[9px] uppercase tracking-[0.17em] text-[#849388]">Current profile</p>
          <button type="button" onClick={() => navigateTo('rule-profile')} className="mt-3 w-full rounded-lg border border-white/[0.09] bg-white/[0.035] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.07]">
            <span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-[#e7ece7]">{selectedProfile?.name || (loading ? 'Loading profiles…' : 'No profile')}</span><Icon name="chevron" className="h-3.5 w-3.5 shrink-0 text-[#8e9c92]" /></span>
            <span className="mt-2 block text-[10px] text-[#9ba89e]">{selectedProfile ? `${selectedProfile.minClearance} mm clearance` : 'Choose a rule set'}</span>
          </button>
        </div>
        <div className="mt-auto border-t border-white/[0.08] p-4">
          <div className="flex items-center gap-3 px-2 py-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#2e4035] text-[11px] font-semibold text-[#e1e9dc]">{initials}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{user.name || 'Account'}</p><p className="mt-0.5 truncate text-[10px] text-[#99a69d]">{user.email}</p></div></div>
          <button type="button" onClick={onLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#a9b4ac] transition hover:bg-white/[0.07] hover:text-white"><Icon name="logout" className="h-4 w-4" />Sign out</button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-[#e0e3dd] bg-white/95 backdrop-blur lg:static">
          <div className="flex h-[62px] items-center justify-between px-4 sm:px-7 lg:h-[70px] lg:px-10">
            <div className="flex items-center gap-3 lg:hidden"><Mark className="h-8 w-8" /><div><p className="text-sm font-semibold">CircuitGuard</p><p className="text-[9px] uppercase tracking-[0.14em] text-[#8b928c]">Hardware review</p></div></div>
            <div className="hidden text-xs text-[#7b847d] lg:block">Workspace <span className="mx-2 text-[#c4c9c2]">/</span> Design rule checks</div>
            <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-semibold">{user.name || 'Account'}</span><span className="mt-0.5 block text-[10px] text-[#858d87]">{user.email}</span></span><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e9eee6] text-[10px] font-semibold text-[#435448] sm:hidden">{initials}</span><button type="button" onClick={onLogout} className="secondary-button px-3 py-2"><Icon name="logout" className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sign out</span></button></div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-[#eef0ec] px-3 py-2 lg:hidden" aria-label="Workspace navigation"><NavigationItems activeSection={activeSection} onNavigate={navigateTo} compact /></nav>
        </header>

        <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
          <section id="overview" className="scroll-mt-32 lg:scroll-mt-8">
            <div className="flex flex-col gap-5 border-b border-[#dfe3dc] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#808981]">{currentDate}</p><h1 className="mt-2 text-[28px] font-semibold tracking-[-0.04em] sm:text-[34px]">Hardware workspace</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#6f7871]">Run fabrication checks, review violations, and keep your board packages together.</p></div>
              <button type="button" onClick={() => navigateTo('new-review')} className="primary-button w-auto justify-center px-4 py-2.5"><Icon name="upload" className="h-4 w-4" />Start a DRC check</button>
            </div>

            {loadError && <div role="alert" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ead3c9] bg-[#fff8f5] px-4 py-3 text-xs text-[#874635]"><span>{loadError}</span><button type="button" onClick={refreshJobs} className="font-semibold underline underline-offset-2">Try again</button></div>}

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Summary label="Recent DRC jobs" value={loading ? '—' : String(jobs.length)} detail="Your latest 50 checks" icon="board" />
              <Summary label="Checks with violations" value={loading ? '—' : String(failedJobs)} detail="Across recent jobs" icon="rules" />
              <Summary label="Active rule profile" value={selectedProfile?.name || (loading ? 'Loading' : 'Unavailable')} detail={selectedProfile ? `${selectedProfile.minClearance} mm minimum clearance` : 'Select a manufacturing profile'} compact icon="check" />
            </div>
          </section>

          <div className="mt-8 grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <section id="new-review" className="scroll-mt-32 lg:scroll-mt-8">
              <SectionHeading eyebrow="Fabrication package" title="New DRC check" detail="Upload a ZIP archive of Gerber copper layers and, optionally, Excellon drill files." />
              <form onSubmit={submitJob} className="mt-4 rounded-xl border border-[#dfe3dc] bg-white p-4 shadow-[0_2px_12px_rgba(23,37,30,0.025)] sm:p-6">
                <button type="button" onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }} className={`group flex min-h-[210px] w-full flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center transition ${dragging ? 'border-[#667c4b] bg-[#f5f8ee]' : 'border-[#cbd1c9] bg-[#fafbf9] hover:border-[#84947f] hover:bg-[#f7f9f5]'}`}>
                  <span className="grid h-11 w-11 place-items-center rounded-lg border border-[#e0e4de] bg-white text-[#405247] shadow-sm transition group-hover:border-[#bdc8b9]"><Icon name="upload" /></span>
                  <span className="mt-4 max-w-full truncate text-sm font-semibold">{file ? file.name : 'Drop your fabrication package here'}</span>
                  <span className="mt-1.5 text-xs text-[#7f8881]">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB selected` : 'ZIP archive · maximum 25 MB'}</span>
                  {!file && <span className="mt-4 rounded-md border border-[#d8ddd6] bg-white px-3 py-2 text-xs font-semibold text-[#3d4a41]">Browse files</span>}
                </button>
                <input ref={inputRef} className="hidden" type="file" accept=".zip,application/zip" onChange={(event) => selectFile(event.target.files[0])} />
                {message && <p role="alert" className="mt-4 rounded-md border border-[#ead3c9] bg-[#fff8f5] px-3 py-2.5 text-xs leading-5 text-[#8d3b29]">{message}</p>}
                {file && <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-[#f5f7f3] px-3 py-2.5"><span className="flex min-w-0 items-center gap-2 text-xs text-[#526157]"><Icon name="file" className="h-4 w-4 shrink-0" /><span className="truncate">Package ready to inspect</span></span><button type="button" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }} className="shrink-0 text-xs font-semibold text-[#69736b] hover:text-[#28342c]">Remove</button></div>}
                <div className="mt-5 flex flex-col gap-3 border-t border-[#edf0eb] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[#7b847d]">{selectedProfile ? <>Using <span className="font-semibold text-[#47564b]">{selectedProfile.name}</span></> : 'Choose a rule profile before submitting.'}</p><button type="submit" disabled={!file || !profileId || busy || loading} className="primary-button w-full justify-center px-5 py-2.5 sm:w-auto">{busy ? 'Processing archive…' : 'Run DRC check'}</button></div>
              </form>
              <p className="mt-3 px-1 text-[11px] leading-5 text-[#848c85]">Processing is geometry-based. Review the report and verify critical results in your PCB design software before fabrication.</p>
            </section>

            <aside id="rule-profile" className="scroll-mt-32 lg:scroll-mt-8">
              <SectionHeading eyebrow="Manufacturing constraints" title="Rule profile" detail="Rules applied to the next submitted package." />
              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe3dc] bg-white shadow-[0_2px_12px_rgba(23,37,30,0.025)]">
                <div className="border-b border-[#edf0eb] p-5"><label htmlFor="profile" className="text-xs font-semibold text-[#303b33]">Select profile</label><select ref={profileRef} id="profile" value={profileId} onChange={(event) => setProfileId(event.target.value)} disabled={loading || !profiles.length} className="mt-2.5 w-full rounded-md border border-[#d5dbd3] bg-white px-3 py-2.5 text-xs text-[#28332d] outline-none transition focus:border-[#70815d] focus:ring-2 focus:ring-[#70815d]/10 disabled:bg-[#f6f7f5]">{profiles.length ? profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}{profile.isDefault ? ' · default' : ''}</option>) : <option value="">{loading ? 'Loading profiles…' : 'No profiles available'}</option>}</select><p className="mt-2.5 text-xs leading-5 text-[#7d857f]">{selectedProfile?.description || 'Profiles are configured by the application.'}</p></div>
                {selectedProfile ? <dl className="divide-y divide-[#eef0ec] px-5"><Rule label="Minimum trace width" value={`${formatRule(selectedProfile.minTraceWidth)} mm`} /><Rule label="Copper clearance" value={`${formatRule(selectedProfile.minClearance)} mm`} /><Rule label="Annular ring" value={`${formatRule(selectedProfile.minAnnularRing)} mm`} /></dl> : <p className="px-5 py-5 text-xs text-[#808981]">No profile rules to display.</p>}
                <button type="button" onClick={() => navigateTo('rule-profile')} className="flex w-full items-center justify-between border-t border-[#edf0eb] bg-[#fafbf9] px-5 py-3 text-left text-[11px] font-semibold text-[#59665c] transition hover:bg-[#f5f7f3]"><span>Change applied profile</span><Icon name="chevron" className="h-3.5 w-3.5" /></button>
              </div>
            </aside>
          </div>

          <section id="jobs" className="mt-10 scroll-mt-32 lg:scroll-mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Workspace activity" title="Job history" detail="Select a job to open its inspection report." /><button type="button" onClick={refreshJobs} disabled={refreshing || loading} className="secondary-button w-fit px-3 py-2 disabled:cursor-wait disabled:opacity-60"><Icon name="refresh" className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing' : 'Refresh history'}</button></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe3dc] bg-white shadow-[0_2px_12px_rgba(23,37,30,0.025)]">
              <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex gap-1 overflow-x-auto" aria-label="Filter jobs by status">{[['ALL', 'All jobs'], ['ISSUES', 'Needs review'], ['PASS', 'Passed'], ['ERROR', 'Errors']].map(([value, label]) => <button key={value} type="button" onClick={() => setJobFilter(value)} aria-pressed={jobFilter === value} className={`shrink-0 rounded-md px-3 py-2 text-[11px] font-semibold transition ${jobFilter === value ? 'bg-[#23372b] text-white' : 'text-[#69736b] hover:bg-[#f2f4f0] hover:text-[#26342b]'}`}>{label}</button>)}</div>
                <label className="relative block sm:w-56"><span className="sr-only">Search job history</span><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8a928c]" /><input value={jobSearch} onChange={(event) => setJobSearch(event.target.value)} placeholder="Search archives" className="w-full rounded-md border border-[#dfe3dc] bg-[#fbfcfa] py-2 pl-9 pr-3 text-xs outline-none transition placeholder:text-[#9ba29c] focus:border-[#86977c] focus:bg-white" /></label>
              </div>
              <div className="hidden grid-cols-[minmax(0,1.5fr)_160px_150px_95px] border-b border-[#edf0eb] bg-[#fafbf9] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#89918a] sm:grid"><span>Archive</span><span>Profile</span><span>Created</span><span className="text-right">Status</span></div>
              {loading ? <div className="px-5 py-10 text-center text-xs text-[#858c86]">Loading job history…</div> : filteredJobs.length ? filteredJobs.map((job, index) => <JobRow key={job.id} job={job} selected={selectedJob?.id === job.id} onClick={() => { setSelectedJob(job); document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} bordered={index > 0} />) : <div className="px-5 py-10 text-center"><p className="text-sm font-medium text-[#556158]">{jobs.length ? 'No jobs match these filters.' : 'No checks yet'}</p><p className="mt-1 text-xs text-[#89918a]">{jobs.length ? 'Try another status or search term.' : 'Your completed checks will appear here.'}</p>{jobs.length > 0 && <button type="button" onClick={() => { setJobFilter('ALL'); setJobSearch(''); }} className="mt-3 text-xs font-semibold text-[#4c634e] underline underline-offset-2">Clear filters</button>}</div>}
              <div className="flex items-center justify-between border-t border-[#edf0eb] bg-[#fafbf9] px-5 py-3 text-[10px] text-[#89918a]"><span>Showing {filteredJobs.length} of {jobs.length} recent jobs</span><button type="button" onClick={() => navigateTo('new-review')} className="font-semibold text-[#53624f] hover:text-[#26342b]">New check <span aria-hidden="true">→</span></button></div>
            </div>
          </section>

          <section id="report" className="mt-8 scroll-mt-32 lg:scroll-mt-8" aria-live="polite">
            {selectedJob ? <>
              <div className="flex flex-wrap items-end justify-between gap-3"><SectionHeading eyebrow="Inspection report" title={selectedJob.filename} detail={`${selectedJob.total_errors ?? selectedJob.errors?.length ?? 0} reported violation(s) · ${selectedJob.profile_name}`} /><StatusBadge status={selectedJob.status} /></div>
              {selectedJob.warnings?.length > 0 && <div className="mt-4 rounded-lg border border-[#e6d8b2] bg-[#fffbee] px-4 py-3 text-xs leading-5 text-[#766226]"><p className="font-semibold">Analysis limitations</p><ul className="mt-1 list-disc pl-4">{selectedJob.warnings.map((warning, index) => <li key={index}>{typeof warning === 'string' ? warning : warning.message}</li>)}</ul></div>}
              <div className="mt-4 overflow-hidden rounded-xl border border-[#dfe3dc] bg-white">
                {selectedJob.errors?.length ? <><div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 border-b border-[#edf0eb] bg-[#fafbf9] px-4 py-3 font-mono text-[9px] uppercase tracking-[0.13em] text-[#89918a] sm:grid-cols-[150px_minmax(0,1fr)_160px] sm:px-5"><span>Rule</span><span>Finding</span><span className="hidden sm:block">Coordinates</span></div><div className="divide-y divide-[#edf0eb]">{selectedJob.errors.map((error, index) => <div key={`${error.rule}-${index}`} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 px-4 py-4 sm:grid-cols-[150px_minmax(0,1fr)_160px] sm:px-5"><span className="font-mono text-[10px] font-semibold tracking-wide text-[#914432]">{error.rule}</span><span className="text-xs leading-5 text-[#465148]">{error.message}</span><span className="col-start-2 font-mono text-[10px] text-[#7e8780] sm:col-start-auto">{error.coordinates ? `X ${error.coordinates.x}, Y ${error.coordinates.y}` : '—'}</span></div>)}</div></> : <div className="px-5 py-8 text-center"><span className={`mx-auto grid h-9 w-9 place-items-center rounded-full ${selectedJob.status === 'PASS' ? 'bg-[#edf5ed] text-[#456849]' : 'bg-[#f5f6f3] text-[#687269]'}`}><Icon name={selectedJob.status === 'PASS' ? 'check' : 'file'} className="h-4 w-4" /></span><p className="mt-3 text-sm font-semibold text-[#455349]">{selectedJob.status === 'PASS' ? 'No violations reported' : 'No rule findings available'}</p><p className="mt-1 text-xs text-[#858d87]">{selectedJob.status === 'PASS' ? 'This package passed the configured checks.' : 'The job did not return a violation list.'}</p></div>}
              </div>
            </> : <div className="rounded-xl border border-dashed border-[#d4dad2] bg-white/70 px-5 py-9 text-center"><p className="text-sm font-semibold text-[#546057]">Your inspection report will appear here</p><p className="mt-1 text-xs text-[#858d87]">Run a DRC check or select a job from your history.</p></div>}
          </section>
          <footer className="mt-9 border-t border-[#dfe3dc] pt-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-[#9aa19b]">CircuitGuard · Geometry-based checks · Verify critical results before fabrication</footer>
        </div>
      </main>
    </div>
  );
}

function NavigationItems({ activeSection, onNavigate, compact = false }) {
  return navigation.map((item) => <button key={item.id} type="button" onClick={() => onNavigate(item.id)} aria-current={activeSection === item.id ? 'page' : undefined} className={compact ? `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-[11px] font-semibold transition ${activeSection === item.id ? 'bg-[#23372b] text-white' : 'text-[#68736b] hover:bg-[#f1f3ef] hover:text-[#26342b]'}` : `mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-xs transition ${activeSection === item.id ? 'bg-[#2a3c31] font-semibold text-white shadow-[inset_2px_0_0_#c6df81]' : 'text-[#a2aea5] hover:bg-white/[0.055] hover:text-white'}`}><Icon name={item.icon} className="h-4 w-4 shrink-0" />{item.label}{!compact && activeSection === item.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c8e38b]" />}</button>);
}

function Summary({ label, value, detail, compact = false, icon }) {
  return <div className="flex min-h-[112px] items-start justify-between gap-3 rounded-xl border border-[#dfe3dc] bg-white px-4 py-4 shadow-[0_2px_12px_rgba(23,37,30,0.025)] sm:px-5"><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.13em] text-[#89918a]">{label}</p><p className={`mt-2 truncate font-semibold tracking-[-0.025em] ${compact ? 'text-base' : 'text-2xl'}`}>{value}</p><p className="mt-1 text-[10px] leading-4 text-[#858d87]">{detail}</p></div><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#f1f4ef] text-[#52634f]"><Icon name={icon} className="h-4 w-4" /></span></div>;
}

function SectionHeading({ eyebrow, title, detail }) {
  return <div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#89918a]">{eyebrow}</p><h2 className="mt-1.5 text-[17px] font-semibold tracking-[-0.025em] text-[#27332b]">{title}</h2>{detail && <p className="mt-1 max-w-2xl text-xs leading-5 text-[#79827b]">{detail}</p>}</div>;
}

function Rule({ label, value }) {
  return <div className="flex items-center justify-between gap-3 py-3.5 text-xs"><dt className="text-[#778079]">{label}</dt><dd className="shrink-0 font-mono text-[10px] font-medium text-[#354239]">{value}</dd></div>;
}

function JobRow({ job, bordered, selected, onClick }) {
  const created = job.created_at ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(job.created_at)) : '—';
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3.5 text-left transition sm:grid-cols-[minmax(0,1.5fr)_160px_150px_95px] sm:gap-4 sm:px-5 ${bordered ? 'border-t border-[#edf0eb]' : ''} ${selected ? 'bg-[#f5f8f2]' : 'hover:bg-[#fafbf9]'}`}><span className="flex min-w-0 items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#eff3ed] text-[#52634f]"><Icon name="board" className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-[#344037]">{job.filename}</span><span className="mt-1 block truncate text-[10px] text-[#848c86] sm:hidden">{job.profile_name} · {created}</span></span></span><span className="hidden truncate text-[10px] text-[#6f7971] sm:block">{job.profile_name}</span><span className="hidden text-[10px] text-[#858d87] sm:block">{created}</span><span className="justify-self-end sm:justify-self-end"><StatusBadge status={job.status} /></span></button>;
}

function StatusBadge({ status }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] ${statusClasses[status] || statusClasses.ERROR}`}>{status || 'UNKNOWN'}</span>;
}

function formatRule(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : value;
}
