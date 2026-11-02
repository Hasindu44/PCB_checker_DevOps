import { useEffect, useMemo, useRef, useState } from 'react';
import { drcApi } from '../api';
import PCBViewer from './PCBViewer';
import { Icon, Mark } from './Visuals';
import './TracelabWorkbench.css';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'board', label: 'Board' },
  { id: 'review', label: 'Review' },
  { id: 'history', label: 'History' },
  { id: 'library', label: 'Library' },
];

export default function TracelabDashboard({ user, onLogout }) {
  const fileInputRef = useRef(null);
  const [profiles, setProfiles] = useState([]);
  const [profileId, setProfileId] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedErrorIndex, setSelectedErrorIndex] = useState(0);
  const [activePage, setActivePage] = useState('scan');
  const [pendingFile, setPendingFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedProfile = profiles.find((profile) => profile.id === profileId);
  const userName = user?.name || user?.email?.split('@')[0] || 'Engineer';
  const initials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const errors = Array.isArray(selectedJob?.errors) ? selectedJob.errors : [];
  const warnings = Array.isArray(selectedJob?.warnings) ? selectedJob.warnings : [];
  const orderedErrors = useMemo(() => rankFindings(errors), [errors]);
  const passCount = jobs.filter((job) => job.status === 'PASS').length;
  const flaggedCount = jobs.filter((job) => job.status === 'FAIL').length;
  const pageNames = { scan: 'New analysis', overview: 'Overview', board: 'Board', review: 'Review', history: 'History', library: 'Library' };

  useEffect(() => {
    let active = true;
    Promise.all([drcApi.profiles().catch(() => []), drcApi.jobs().catch(() => [])])
      .then(async ([availableProfiles, recentJobs]) => {
        if (!active) return;
        setProfiles(availableProfiles);
        setProfileId(availableProfiles.find((profile) => profile.isDefault)?.id || availableProfiles[0]?.id || '');
        setJobs(recentJobs);
        if (!recentJobs.length) {
          setActivePage('scan');
          return;
        }
        try {
          const latestJob = await drcApi.job(recentJobs[0].id);
          if (active) setSelectedJob(latestJob);
        } catch {
          if (active) setSelectedJob(recentJobs[0]);
        }
        if (active) setActivePage('overview');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function showNotice(text, type = 'info') {
    setNotice({ text, type });
    window.setTimeout(() => setNotice((current) => current?.text === text ? null : current), 4500);
  }

  function queueFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      showNotice('Choose a ZIP archive containing Gerber fabrication files.', 'error');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showNotice('This archive is larger than the 25 MB upload limit.', 'error');
      return;
    }
    setPendingFile(file);
    setNotice(null);
  }

  async function startAnalysis() {
    if (!pendingFile) {
      fileInputRef.current?.click();
      return;
    }
    if (!profileId) {
      showNotice('Choose a manufacturing profile before starting the analysis.', 'error');
      return;
    }
    const file = pendingFile;
    setBusy(true);
    showNotice(`Analysing ${file.name}…`, 'info');
    try {
      const newJob = await drcApi.validate(file, profileId);
      setSelectedJob(newJob);
      setSelectedErrorIndex(0);
      setJobs((current) => [newJob, ...current.filter((job) => job.id !== newJob.id)].slice(0, 50));
      setActivePage('overview');
      showNotice(newJob.status === 'PASS' ? 'Analysis complete. No rule violations found.' : `Analysis complete. ${newJob.total_errors ?? newJob.errors?.length ?? 0} finding(s) to review.`, newJob.status === 'PASS' ? 'success' : 'warning');
    } catch (error) {
      if (error.data?.id) {
        setSelectedJob(error.data);
        setSelectedErrorIndex(0);
        setJobs((current) => [error.data, ...current.filter((job) => job.id !== error.data.id)].slice(0, 50));
        setActivePage('overview');
      }
      showNotice(error.message || 'The Gerber archive could not be analysed.', 'error');
    } finally {
      setBusy(false);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function openJob(job) {
    setBusy(true);
    try {
      const fullJob = await drcApi.job(job.id);
      setSelectedJob(fullJob);
      setSelectedErrorIndex(0);
      setActivePage('overview');
    } catch (error) {
      showNotice(error.message || 'This report could not be opened.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function refreshHistory() {
    setRefreshing(true);
    try {
      setJobs(await drcApi.jobs());
    } catch (error) {
      showNotice(error.message || 'History could not be refreshed.', 'error');
    } finally {
      setRefreshing(false);
    }
  }

  function exportReport() {
    if (!selectedJob) return;
    const report = {
      filename: selectedJob.filename,
      created_at: selectedJob.created_at,
      status: selectedJob.status,
      profile: selectedJob.profile_name,
      board_dimensions_mm: selectedJob.board ? { width: selectedJob.board.width, height: selectedJob.board.height } : null,
      findings: errors,
      warnings,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `Tracelab_${(selectedJob.filename || 'review').replace(/[^a-z0-9-_]+/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function selectFinding(index, page = 'board') {
    setSelectedErrorIndex(index);
    setActivePage(page);
  }

  const navigation = (
    <header className="tl-topbar">
      <a className="tl-brand" href="#workspace" onClick={(event) => { event.preventDefault(); setActivePage(selectedJob ? 'overview' : 'scan'); }} aria-label="Tracelab workspace">
        <Mark className="tl-brand-mark" />
        <span>Tracelab</span>
      </a>
      <nav className="tl-navigation" aria-label="Workspace navigation">
        {sections.map((section) => (
          <button key={section.id} type="button" aria-current={activePage === section.id ? 'page' : undefined} className={activePage === section.id ? 'tl-nav-link is-active' : 'tl-nav-link'} onClick={() => setActivePage(section.id)}>
            {section.label}
          </button>
        ))}
      </nav>
      <div className="tl-top-actions">
        <div className="tl-user" title={user?.email || userName}>
          <span className="tl-user-avatar">{initials}</span>
          <span className="tl-user-name">{userName}</span>
        </div>
        <button type="button" className="tl-signout" onClick={onLogout} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button>
        <button type="button" className="tl-scan-button" onClick={() => { setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; setActivePage('scan'); }}>
          Scan a board
        </button>
      </div>
    </header>
  );

  return (
    <div className="tl-workspace">
      {navigation}
      <main className={`tl-main tl-page-${activePage}`} id="workspace">
        {loading ? <WorkspaceLoading /> : (
          <>
            {activePage === 'scan' && (
              <ScanPage
                fileInputRef={fileInputRef}
                pendingFile={pendingFile}
                setPendingFile={setPendingFile}
                queueFile={queueFile}
                dragActive={dragActive}
                setDragActive={setDragActive}
                busy={busy}
                profiles={profiles}
                selectedProfile={selectedProfile}
                profileId={profileId}
                setProfileId={setProfileId}
                onStart={startAnalysis}
              />
            )}
            {activePage === 'overview' && selectedJob && (
              <OverviewPage job={selectedJob} errors={orderedErrors} warnings={warnings} selectedErrorIndex={selectedErrorIndex} onSelectFinding={selectFinding} onOpenReview={() => setActivePage('review')} onExport={exportReport} onUpload={() => setActivePage('scan')} busy={busy} />
            )}
            {activePage === 'board' && selectedJob && (
              <BoardPage job={selectedJob} errors={errors} warnings={warnings} selectedErrorIndex={selectedErrorIndex} onSelectError={setSelectedErrorIndex} onExport={exportReport} />
            )}
            {activePage === 'review' && selectedJob && (
              <ReviewPage job={selectedJob} errors={orderedErrors} warnings={warnings} onSelectFinding={selectFinding} onExport={exportReport} />
            )}
            {activePage === 'history' && (
              <HistoryPage jobs={jobs} selectedJobId={selectedJob?.id} onOpenJob={openJob} onRefresh={refreshHistory} refreshing={refreshing} />
            )}
            {activePage === 'library' && (
              <LibraryPage profiles={profiles} selectedProfileId={profileId} onSelectProfile={setProfileId} onScan={() => setActivePage('scan')} />
            )}
            {['overview', 'board', 'review'].includes(activePage) && !selectedJob && (
              <EmptyReportPage onScan={() => setActivePage('scan')} />
            )}
          </>
        )}
      </main>
      <footer className="tl-footer">
        <span>Tracelab <i>·</i> PCB design review</span>
        <span>Geometry-based checks are a review aid. Verify critical results with your CAD tool and fabricator.</span>
      </footer>
      {notice && <div className={`tl-toast is-${notice.type}`} role="status"><span className="tl-toast-dot" />{notice.text}<button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div>}
    </div>
  );
}

function ScanPage({ fileInputRef, pendingFile, setPendingFile, queueFile, dragActive, setDragActive, busy, profiles, selectedProfile, profileId, setProfileId, onStart }) {
  return (
    <section className="tl-content">
      <div className="tl-page-heading tl-scan-heading">
        <div><p className="tl-eyebrow">NEW ANALYSIS</p><h1>Drop a board in.</h1><p className="tl-lede">Upload a Gerber package and check it against the manufacturing limits you choose.</p></div>
      </div>
      <div className="tl-scan-grid">
        <div
          className={`tl-dropzone ${dragActive ? 'is-dragging' : ''} ${pendingFile ? 'has-file' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false); }}
          onDrop={(event) => { event.preventDefault(); setDragActive(false); queueFile(event.dataTransfer.files?.[0]); }}
        >
          <input ref={fileInputRef} type="file" accept=".zip,application/zip" className="tl-hidden-input" onChange={(event) => queueFile(event.target.files?.[0])} />
          <div className="tl-upload-illustration"><span className="tl-upload-board"><i /><i /><i /><b><Icon name="upload" /></b></span></div>
          {pendingFile ? (
            <>
              <p className="tl-drop-title">Ready to analyse</p>
              <div className="tl-file-chip"><Icon name="file" /><span title={pendingFile.name}>{pendingFile.name}</span><small>{formatBytes(pendingFile.size)}</small><button type="button" onClick={() => { setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} aria-label="Remove file">×</button></div>
            </>
          ) : (
            <><p className="tl-drop-title">Drag a Gerber ZIP here</p><p className="tl-drop-hint">or choose an archive from your computer</p></>
          )}
          <button type="button" className="tl-button tl-button-dark tl-choose-file" disabled={busy} onClick={() => fileInputRef.current?.click()}>
            {pendingFile ? 'Choose a different file' : 'Choose a ZIP file'}
          </button>
          <div className="tl-file-types"><span>Gerber ZIP</span><span>Excellon drill files supported</span><span>25 MB max</span></div>
        </div>
        <aside className="tl-check-panel">
          <div className="tl-panel-label">WHAT SHOULD WE CHECK?</div>
          <label className="tl-profile-label" htmlFor="profile-select">Manufacturing profile</label>
          <select id="profile-select" className="tl-profile-select" value={profileId} onChange={(event) => setProfileId(event.target.value)} disabled={!profiles.length}>
            {profiles.length ? profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}{profile.isDefault ? ' · Default' : ''}</option>) : <option value="">No profiles available</option>}
          </select>
          {selectedProfile ? (
            <div className="tl-rule-list">
              <RuleRow label="Minimum trace width" value={selectedProfile.minTraceWidth} />
              <RuleRow label="Copper clearance" value={selectedProfile.minClearance} />
              <RuleRow label="Annular ring" value={selectedProfile.minAnnularRing} />
            </div>
          ) : <p className="tl-empty-note">A manufacturing profile is needed before an analysis can start.</p>}
          <div className="tl-panel-bottom">
            <span className="tl-muted">Checks use the selected profile’s limits.</span>
            <button type="button" className="tl-button tl-button-orange" onClick={onStart} disabled={busy || !profiles.length}>
              {busy ? <><span className="tl-spinner" />Analysing…</> : 'Start analysis'}
            </button>
          </div>
        </aside>
      </div>
      <p className="tl-process-note"><span>1&nbsp; Upload</span><i>→</i><span>2&nbsp; Analyse</span><i>→</i><span>3&nbsp; Review findings on the board</span></p>
    </section>
  );
}

function OverviewPage({ job, errors, warnings, selectedErrorIndex, onSelectFinding, onOpenReview, onExport, onUpload, busy }) {
  const count = job.total_errors ?? job.errors?.length ?? 0;
  const pass = job.status === 'PASS';
  const isError = job.status === 'ERROR';
  return (
    <section className="tl-content">
      <div className="tl-overview-meta"><p className="tl-eyebrow">{job.profile_name || 'MANUFACTURING REVIEW'} <i>·</i> {job.filename || 'CURRENT BOARD'}</p><span className={`tl-status-label is-${job.status?.toLowerCase() || 'error'}`}><i />{statusLabel(job.status)}</span></div>
      <div className="tl-result-heading">
        <div><h1>{pass ? <>Passes selected checks.<br /><em>Ready for review.</em></> : <>{isError ? 'Analysis needs attention.' : 'Fails inspection.'} <em>{count} {count === 1 ? 'finding' : 'findings'}.</em></>}</h1><p className="tl-lede">{pass ? 'No violations were returned for the selected manufacturing profile.' : isError ? 'The archive could not be fully analysed. Review the processing message below.' : 'Start with the highest-priority finding, then use its marker to locate the geometry.'}</p></div>
        <div className="tl-heading-actions"><button type="button" className="tl-button tl-button-outline" onClick={onExport}>Export report</button><button type="button" className="tl-button tl-button-dark" onClick={onUpload}>Scan another board</button></div>
      </div>
      <div className="tl-overview-grid">
        <div className="tl-board-card">
          <div className="tl-card-topline"><span>BOARD PREVIEW</span><span>{job.board?.width && job.board?.height ? `${Number(job.board.width).toFixed(2)} × ${Number(job.board.height).toFixed(2)} mm copper extents` : 'GERBER COPPER LAYERS'}</span></div>
          <PCBViewer board={job.board} errors={job.errors || []} selectedErrorIndex={selectedErrorIndex} onSelectError={(index) => onSelectFinding(index, 'board')} isLoading={busy} />
        </div>
        <div className="tl-overview-side">
          <section className="tl-panel tl-priority-panel">
            <div className="tl-panel-label">{pass ? 'CHECK SUMMARY' : 'REVIEW IN THIS ORDER'}</div>
            {errors.length ? <div className="tl-priority-list">{errors.slice(0, 4).map(({ error, index }, order) => <button type="button" className={`tl-priority-row ${selectedErrorIndex === index ? 'is-selected' : ''}`} key={`${index}-${error.rule}`} onClick={() => onSelectFinding(index, 'board')}><span className={`tl-priority-number ${findingTone(error.rule)}`}>{order + 1}</span><span className="tl-priority-copy"><strong>{ruleTitle(error.rule)}</strong><small>{error.message}</small><em>{coordinateLabel(error.coordinates)}</em></span></button>)}</div> : <div className={`tl-clean-state ${isError ? 'is-error' : ''}`}><span className="tl-clean-mark"><Icon name={isError ? 'alert' : 'check'} /></span><strong>{isError ? 'Could not complete this check' : 'No rule violations found'}</strong><p>{isError ? errors[0]?.error?.message || job.errors?.[0]?.message : 'The board meets the selected profile limits for the checks performed.'}</p></div>}
            {errors.length > 4 && <button type="button" className="tl-text-link" onClick={onOpenReview}>See all {errors.length} findings <Icon name="chevron" /></button>}
            {errors.length > 0 && errors.length <= 4 && <button type="button" className="tl-text-link" onClick={onOpenReview}>Open full review <Icon name="chevron" /></button>}
          </section>
          <div className="tl-stat-pair">
            <article className="tl-stat-card"><strong>{count}</strong><span>Findings</span></article>
            <article className="tl-stat-card"><strong>{warnings.length}</strong><span>Analysis notes</span></article>
            <article className="tl-stat-card tl-stat-profile"><strong>{job.profile_name || '—'}</strong><span>Profile used</span></article>
          </div>
          {warnings.length > 0 && <div className="tl-warning-inline"><Icon name="info" /><span>{warnings[0]}{warnings.length > 1 ? ` +${warnings.length - 1} more analysis notes` : ''}</span></div>}
        </div>
      </div>
    </section>
  );
}

function BoardPage({ job, errors, warnings, selectedErrorIndex, onSelectError, onExport }) {
  const selected = errors[selectedErrorIndex];
  return (
    <section className="tl-content tl-board-page-content">
      <div className="tl-page-heading tl-board-heading"><div><p className="tl-eyebrow">BOARD VIEW <i>·</i> {job.filename}</p><h1>Inspect the geometry.</h1><p className="tl-lede">Select a layer to isolate it. Drag to pan, scroll to zoom, or choose a finding to focus its marker.</p></div><button type="button" className="tl-button tl-button-outline" onClick={onExport}>Export report</button></div>
      <div className="tl-board-page-grid">
        <div className="tl-board-card tl-board-card-large"><div className="tl-card-topline"><span>LAYER STACK</span><span>{job.board?.layers?.length || 0} COPPER LAYER(S)</span></div><PCBViewer board={job.board} errors={errors} selectedErrorIndex={selectedErrorIndex} onSelectError={onSelectError} /></div>
        <aside className="tl-board-context">
          <section className="tl-panel tl-board-finding">
            {selected ? <><div className="tl-finding-kicker"><span className={`tl-priority-number ${findingTone(selected.rule)}`}>{selectedErrorIndex + 1}</span><span>{ruleTitle(selected.rule)} <i>·</i> {job.profile_name || 'PROFILE'}</span></div><h2>{selected.message}</h2><div className="tl-coordinate-block"><small>REPORTED LOCATION</small><strong>{coordinateLabel(selected.coordinates)}</strong></div><button type="button" className="tl-button tl-button-dark tl-full-button" onClick={() => { const next = (selectedErrorIndex + 1) % Math.max(errors.length, 1); onSelectError(next); }} disabled={errors.length < 2}>Next finding <Icon name="chevron" /></button></> : <><p className="tl-panel-label">CURRENT REVIEW</p><h2>{job.status === 'PASS' ? 'No findings to locate.' : 'Select a finding to inspect.'}</h2><p className="tl-muted">The selected item will be highlighted on the board when coordinates are available.</p></>}
          </section>
          <section className="tl-panel tl-layer-key"><p className="tl-panel-label">VISIBLE LAYERS</p>{job.board?.layers?.length ? job.board.layers.map((layer) => <div className="tl-layer-key-row" key={layer.name}><span style={{ backgroundColor: layer.color || '#168565' }} /><strong>{layer.name}</strong><small>{layer.paths?.length || 0} shapes</small></div>) : <p className="tl-muted">No saved layer preview is available for this scan.</p>}</section>
          {warnings.length > 0 && <section className="tl-panel tl-layer-note"><p className="tl-panel-label">ANALYSIS NOTES</p><p>{warnings[0]}</p></section>}
        </aside>
      </div>
    </section>
  );
}

function ReviewPage({ job, errors, warnings, onSelectFinding, onExport }) {
  return (
    <section className="tl-content">
      <div className="tl-page-heading"><div><p className="tl-eyebrow">DESIGN REVIEW <i>·</i> BEFORE FABRICATION</p><h1>{errors.length ? <>{errors.length} {errors.length === 1 ? 'finding needs' : 'findings need'}<br /><em>your attention.</em></> : 'No findings in this review.'}</h1><p className="tl-lede">{job.filename} <i>·</i> Profile: {job.profile_name || 'Not recorded'}</p></div><button type="button" className="tl-button tl-button-outline" onClick={onExport}>Export report</button></div>
      <div className="tl-review-grid">
        <div className="tl-review-list">
          {errors.length ? errors.map(({ error, index }, position) => <article className="tl-review-card" key={`${index}-${error.rule}`}><div className="tl-review-title"><span className={`tl-priority-number ${findingTone(error.rule)}`}>{position + 1}</span><div><p className="tl-panel-label">{ruleTitle(error.rule)}</p><h2>{error.message}</h2></div></div><div className="tl-review-card-footer"><span className="tl-coordinate-pill"><Icon name="target" />{coordinateLabel(error.coordinates)}</span><button type="button" className="tl-inline-button" onClick={() => onSelectFinding(index, 'board')}>Locate on board <Icon name="chevron" /></button></div></article>) : <div className="tl-panel tl-no-findings"><span className="tl-clean-mark"><Icon name="check" /></span><div><h2>Nothing to fix in this pass.</h2><p>The uploaded geometry passed the checks included in this report.</p></div></div>}
        </div>
        <aside className="tl-review-aside">
          <section className="tl-panel"><p className="tl-panel-label">ANALYSIS NOTES <span>{warnings.length}</span></p>{warnings.length ? <ul className="tl-warning-list">{warnings.map((warning, index) => <li key={`${warning}-${index}`}><i /><span>{warning}</span></li>)}</ul> : <p className="tl-muted">No additional analysis notes were returned.</p>}</section>
          <section className="tl-panel tl-profile-summary"><p className="tl-panel-label">PROFILE USED</p><h2>{job.profile_name || 'Manufacturing profile'}</h2><p className="tl-muted">This report records the profile selected when the archive was analysed.</p></section>
        </aside>
      </div>
    </section>
  );
}

function HistoryPage({ jobs, selectedJobId, onOpenJob, onRefresh, refreshing }) {
  const passed = jobs.filter((job) => job.status === 'PASS').length;
  return (
    <section className="tl-content">
      <div className="tl-page-heading tl-history-heading"><div><p className="tl-eyebrow">SAVED REVIEWS <i>·</i> YOUR WORKSPACE</p><h1>{jobs.length} {jobs.length === 1 ? 'scan' : 'scans'}. <em>{passed} passed.</em></h1></div><button type="button" className="tl-button tl-button-outline" onClick={onRefresh} disabled={refreshing}><Icon name="refresh" className={refreshing ? 'is-spinning' : ''} />{refreshing ? 'Refreshing…' : 'Refresh history'}</button></div>
      {jobs.length > 0 && <section className="tl-panel tl-history-strip"><div className="tl-history-strip-heading"><span>RECENT SCANS, NEWEST FIRST</span><div><i className="is-pass" /> Pass <i className="is-fail" /> Needs review <i className="is-error" /> Error</div></div><div className="tl-history-tiles">{jobs.slice(0, 42).map((job, index) => <button type="button" key={job.id} title={`${job.filename} · ${statusLabel(job.status)}`} aria-label={`Open ${job.filename}, ${statusLabel(job.status)}`} className={`tl-history-tile is-${job.status?.toLowerCase()} ${selectedJobId === job.id ? 'is-current' : ''}`} onClick={() => onOpenJob(job)}><span>{index + 1}</span></button>)}</div></section>}
      <div className="tl-history-grid">
        <section className="tl-panel tl-recent-scans"><p className="tl-panel-label">RECENT SCANS</p>{jobs.length ? <div className="tl-scan-list">{jobs.map((job) => <article className="tl-scan-row" key={job.id}><span className={`tl-scan-thumb is-${job.status?.toLowerCase()}`}><Icon name="board" /></span><div className="tl-scan-file"><strong title={job.filename}>{job.filename}</strong><small>{formatDate(job.created_at)} <i>·</i> {job.profile_name || 'Profile not recorded'}</small></div><div className={`tl-scan-status is-${job.status?.toLowerCase()}`}>{statusLabel(job.status)}{job.status !== 'PASS' && <small>{job.total_errors ?? 0} findings</small>}</div><button type="button" className="tl-button tl-button-outline tl-row-action" onClick={() => onOpenJob(job)}>Open report</button></article>)}</div> : <div className="tl-empty-history"><p>No saved scans yet.</p><small>New analyses will appear here.</small></div>}</section>
        <aside className="tl-history-aside"><section className="tl-panel"><p className="tl-panel-label">THIS WORKSPACE</p><div className="tl-history-counts"><span><strong>{jobs.length}</strong> scans</span><span><strong>{jobs.filter((job) => job.status === 'FAIL').length}</strong> flagged</span><span><strong>{jobs.filter((job) => job.status === 'ERROR').length}</strong> errors</span></div><p className="tl-muted">Counts reflect the saved scan history shown here.</p></section></aside>
      </div>
    </section>
  );
}

function LibraryPage({ profiles, selectedProfileId, onSelectProfile, onScan }) {
  return (
    <section className="tl-content">
      <div className="tl-page-heading"><div><p className="tl-eyebrow">MANUFACTURING LIBRARY <i>·</i> RULE PROFILES</p><h1>Choose your limits.</h1><p className="tl-lede">Profiles define the minimum trace width, copper clearance, and annular ring used for a new analysis.</p></div><button type="button" className="tl-button tl-button-dark" onClick={onScan}>Scan a board</button></div>
      {profiles.length ? <div className="tl-profile-grid">{profiles.map((profile) => <article className={`tl-profile-card ${profile.id === selectedProfileId ? 'is-selected' : ''}`} key={profile.id}><div className="tl-profile-card-top"><span className="tl-profile-icon"><Icon name="rules" /></span>{profile.isDefault && <span className="tl-default-tag">DEFAULT</span>}</div><p className="tl-panel-label">MANUFACTURING PROFILE</p><h2>{profile.name}</h2><p className="tl-profile-description">{profile.description || 'Rule limits used when validating a Gerber archive.'}</p><div className="tl-profile-limits"><RuleRow label="Minimum trace width" value={profile.minTraceWidth} /><RuleRow label="Copper clearance" value={profile.minClearance} /><RuleRow label="Annular ring" value={profile.minAnnularRing} /></div><button type="button" className={profile.id === selectedProfileId ? 'tl-button tl-button-selected' : 'tl-button tl-button-outline tl-full-button'} onClick={() => onSelectProfile(profile.id)}>{profile.id === selectedProfileId ? 'Selected for next scan' : 'Use this profile'}</button></article>)}</div> : <div className="tl-panel tl-empty-library"><Icon name="rules" /><h2>No profiles available.</h2><p>Manufacturing profiles will appear here when they are configured for your workspace.</p></div>}
    </section>
  );
}

function RuleRow({ label, value }) {
  const amount = Number(value);
  return <div className="tl-rule-row"><span><i />{label}</span><strong>{Number.isFinite(amount) ? amount.toFixed(3) : '—'} <small>mm</small></strong></div>;
}

function EmptyReportPage({ onScan }) {
  return <section className="tl-content tl-empty-report"><p className="tl-eyebrow">NO BOARD SELECTED</p><h1>Start with a Gerber package.</h1><p className="tl-lede">Upload a board to view its copper layers and analysis report.</p><button type="button" className="tl-button tl-button-dark" onClick={onScan}>Scan a board</button></section>;
}

function WorkspaceLoading() {
  return <section className="tl-content tl-loading"><span className="tl-spinner" /><p className="tl-eyebrow">OPENING YOUR WORKSPACE</p></section>;
}

function rankFindings(errors) {
  const priority = { TRACE_CLEARANCE: 0, MIN_TRACE_WIDTH: 1, ANNULAR_RING: 2 };
  return errors.map((error, index) => ({ error, index })).sort((a, b) => (priority[a.error.rule] ?? 3) - (priority[b.error.rule] ?? 3) || a.index - b.index);
}

function findingTone(rule) {
  return rule === 'TRACE_CLEARANCE' ? 'is-critical' : 'is-warning';
}

function ruleTitle(rule) {
  return ({ TRACE_CLEARANCE: 'Copper clearance', MIN_TRACE_WIDTH: 'Trace width', ANNULAR_RING: 'Annular ring', PROCESSING_ERROR: 'Processing issue' })[rule] || String(rule || 'Finding').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusLabel(status) {
  return ({ PASS: 'Pass', FAIL: 'Needs review', ERROR: 'Analysis error' })[status] || 'Not analysed';
}

function coordinateLabel(coordinates) {
  const x = Number(coordinates?.x);
  const y = Number(coordinates?.y);
  return Number.isFinite(x) && Number.isFinite(y) ? `X ${x.toFixed(2)} mm · Y ${y.toFixed(2)} mm` : 'Location not available';
}

function formatDate(value) {
  if (!value) return 'Date not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date not available';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function formatBytes(value) {
  return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}
