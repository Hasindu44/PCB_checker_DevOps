import { useRef, useState } from 'react';
import { Icon, Mark } from './Visuals';

const recentBoards = [
  { name: 'Motor controller', revision: 'Rev 3', updated: '2 days ago', status: 'In review' },
  { name: 'Environmental sensor', revision: 'Rev 1', updated: '7 days ago', status: 'Draft' },
  { name: 'Power distribution', revision: 'Rev B', updated: '12 days ago', status: 'Ready' },
];

const statusClasses = {
  'In review': 'border-[#d9c98e] bg-[#faf7e8] text-[#78651e]',
  Draft: 'border-[#d9dbd4] bg-[#f5f5f1] text-[#626a64]',
  Ready: 'border-[#bcd1bd] bg-[#edf5ed] text-[#315f3c]',
};

export default function Dashboard({ user, onLogout }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  const currentDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

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
      setMessage('The archive must be smaller than 25 MB.');
      return;
    }
    setFile(candidate);
  }

  return (
    <div className="min-h-screen bg-[#f5f6f2] text-[#17201b] lg:grid lg:grid-cols-[244px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col bg-[#14231c] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-[#2b3c34] px-6"><Mark light className="h-9 w-9" /><div><p className="text-sm font-semibold tracking-[-0.01em]">CircuitGuard</p><p className="mt-0.5 text-[9px] uppercase tracking-[0.17em] text-[#83958a]">Hardware review</p></div></div>
        <nav className="px-3 py-6" aria-label="Workspace navigation">
          <NavLink href="#overview" icon="overview" active>Overview</NavLink>
          <NavLink href="#new-review" icon="upload">New review</NavLink>
          <NavLink href="#boards" icon="board">Boards</NavLink>
          <NavLink href="#rule-profile" icon="rules">Rule profiles</NavLink>
          <div className="mx-3 my-5 border-t border-[#2b3c34]" />
          <NavLink href="#archive" icon="archive">Archive</NavLink>
        </nav>
        <div className="mt-auto border-t border-[#2b3c34] p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#2b3c34] text-[11px] font-semibold text-[#d6e3da]">{initials}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{user.name}</p><p className="mt-0.5 truncate text-[10px] text-[#85968c]">{user.email}</p></div></div>
          <button type="button" onClick={onLogout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#9caaa1] transition hover:bg-[#203129] hover:text-white"><Icon name="logout" className="h-4 w-4" />Sign out</button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-[#dedfd9] bg-white px-5 lg:hidden"><div className="flex items-center gap-3"><Mark /><span className="text-sm font-semibold">CircuitGuard</span></div><button type="button" onClick={onLogout} className="secondary-button px-3 py-2">Sign out</button></header>
        <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10" id="overview">
          <header className="flex flex-col gap-5 border-b border-[#dcddd7] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7b837d]">{currentDate}</p><h1 className="mt-2 text-[30px] font-semibold tracking-[-0.035em] sm:text-[34px]">Hardware workspace</h1><p className="mt-2 text-sm text-[#6f7771]">Review fabrication files and keep board revisions organized.</p></div>
            <a href="#new-review" className="primary-button w-auto px-5 py-2.5"><Icon name="upload" className="h-4 w-4" /><span>New review</span></a>
          </header>

          <section className="mt-7 grid divide-y divide-[#e0e1dc] overflow-hidden rounded-xl border border-[#dcded8] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-label="Workspace summary">
            <Summary label="Active boards" value="3" detail="Across two projects" />
            <Summary label="Awaiting review" value="1" detail="Motor controller · Rev 3" />
            <Summary label="Default profile" value="Standard" detail="0.20 mm clearance" compact />
          </section>

          <div className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section id="new-review">
              <SectionHeading eyebrow="Fabrication package" title="Start a new review" detail="Upload a ZIP containing Gerber and drill files." />
              <div className="mt-4 rounded-xl border border-[#d8dad4] bg-white p-4 sm:p-6">
                <button type="button" onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); selectFile(event.dataTransfer.files[0]); }} className={`group flex min-h-[230px] w-full flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center transition ${dragging ? 'border-[#657d45] bg-[#f6f9ec]' : 'border-[#c6c9c1] bg-[#fafbf8] hover:border-[#788178] hover:bg-[#f7f8f4]'}`}>
                  <span className="grid h-12 w-12 place-items-center rounded-lg border border-[#d9dbd5] bg-white text-[#405247] shadow-[0_1px_2px_rgba(23,32,27,0.06)] transition group-hover:border-[#b8bdb5]"><Icon name="upload" /></span>
                  <span className="mt-5 text-sm font-semibold">{file ? file.name : 'Drop your fabrication package here'}</span>
                  <span className="mt-2 text-xs text-[#7b827c]">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB selected` : 'ZIP archive · maximum 25 MB'}</span>
                  {!file && <span className="mt-4 rounded-md border border-[#d6d8d2] bg-white px-3 py-2 text-xs font-semibold text-[#3c4941]">Choose file</span>}
                </button>
                <input ref={inputRef} className="hidden" type="file" accept=".zip,application/zip" onChange={(event) => selectFile(event.target.files[0])} />
                {message && <p role="alert" className="mt-4 border-l-2 border-[#b94b32] bg-[#fff8f5] px-3 py-2 text-xs text-[#8d3b29]">{message}</p>}
                {file && !message && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#d8dfcd] bg-[#f7faef] px-4 py-3"><div className="flex items-center gap-3"><span className="text-[#58723c]"><Icon name="check" className="h-4 w-4" /></span><p className="text-xs text-[#4d5d45]">Package ready. PCB processing will be connected in the next backend phase.</p></div><button type="button" onClick={() => setFile(null)} className="flex items-center gap-1.5 text-xs font-semibold text-[#58625b] hover:text-[#17201b]"><Icon name="close" className="h-3.5 w-3.5" />Remove</button></div>}
              </div>
            </section>

            <aside id="rule-profile">
              <SectionHeading eyebrow="Applied rules" title="Review profile" />
              <div className="mt-4 overflow-hidden rounded-xl border border-[#d8dad4] bg-white">
                <div className="border-b border-[#e1e2dd] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Standard fabrication</p><p className="mt-1.5 text-xs leading-5 text-[#757d77]">General-purpose two-layer board.</p></div><span className="rounded-full border border-[#c5d3b0] bg-[#f4f8e9] px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-[#536837]">Default</span></div></div>
                <dl className="divide-y divide-[#ecece8] px-5">
                  <Rule label="Minimum trace" value="0.20 mm" /><Rule label="Copper clearance" value="0.20 mm" /><Rule label="Annular ring" value="0.15 mm" />
                </dl>
                <div className="bg-[#fafaf7] p-4"><button type="button" disabled title="Profile management will be added in a later phase" className="secondary-button w-full cursor-not-allowed justify-center opacity-60">Manage profiles · Coming soon</button></div>
              </div>
            </aside>
          </div>

          <section className="mt-10" id="boards">
            <div className="flex items-end justify-between"><SectionHeading eyebrow="Latest activity" title="Recent boards" /><span className="hidden text-xs text-[#858b86] sm:block">Showing 3 boards</span></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#d8dad4] bg-white">
              <div className="hidden grid-cols-[minmax(0,1.5fr)_110px_130px_100px] border-b border-[#e2e3de] bg-[#fafaf7] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#858b86] sm:grid"><span>Board</span><span>Revision</span><span>Last updated</span><span>Status</span></div>
              {recentBoards.map((board, index) => <BoardRow key={board.name} board={board} bordered={index > 0} />)}
            </div>
          </section>

          <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-[#a0a59f]">Sample workspace data · authentication connected</p>
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, children, active = false }) {
  return <a href={href} className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs transition ${active ? 'bg-[#26382f] font-semibold text-white' : 'text-[#98a79e] hover:bg-[#1d2e26] hover:text-white'}`}><Icon name={icon} className="h-4 w-4" />{children}</a>;
}

function Summary({ label, value, detail, compact = false }) {
  return <div className="px-5 py-5 sm:px-6"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#89908a]">{label}</p><p className={`mt-2 font-semibold tracking-[-0.025em] ${compact ? 'text-lg' : 'text-2xl'}`}>{value}</p><p className="mt-1 text-[11px] text-[#858c86]">{detail}</p></div>;
}

function SectionHeading({ eyebrow, title, detail }) {
  return <div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#89908a]">{eyebrow}</p><h2 className="mt-1.5 text-[17px] font-semibold tracking-[-0.02em]">{title}</h2>{detail && <p className="mt-1 text-xs text-[#7a817b]">{detail}</p>}</div>;
}

function Rule({ label, value }) {
  return <div className="flex items-center justify-between py-4 text-xs"><dt className="text-[#737b75]">{label}</dt><dd className="font-mono text-[11px] font-medium text-[#28332d]">{value}</dd></div>;
}

function BoardRow({ board, bordered }) {
  return <a href="#new-review" className={`group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition hover:bg-[#fafbf8] sm:grid-cols-[minmax(0,1.5fr)_110px_130px_100px] sm:px-5 ${bordered ? 'border-t border-[#ecece8]' : ''}`}><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#eef1eb] text-[#45584c]"><Icon name="board" className="h-[18px] w-[18px]" /></span><span className="truncate text-[13px] font-semibold">{board.name}</span></div><span className="hidden font-mono text-[10px] text-[#6f7771] sm:block">{board.revision}</span><span className="hidden text-[11px] text-[#858c86] sm:block">{board.updated}</span><span className={`justify-self-end rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide ${statusClasses[board.status]}`}>{board.status}</span></a>;
}
