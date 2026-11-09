import { useState } from 'react';
import { BoardSchematic, Icon, Mark } from './Visuals';
import './Home.css';

const steps = [
  { number: '01', title: 'Upload your fabrication files', detail: 'Add a Gerber ZIP package from your PCB design workflow. The checker looks for copper and drill layers.' },
  { number: '02', title: 'Choose manufacturing limits', detail: 'Apply a rule profile with the trace, clearance, and annular-ring constraints you want to review.' },
  { number: '03', title: 'Review the findings', detail: 'See the check status, reported rule findings, and coordinates in one saved inspection report.' },
];

export default function Home({ onGetStarted, onSignIn }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function navigateTo(id) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="public-home">
      <header className="public-header">
        <a className="public-brand" href="#top" onClick={(event) => { event.preventDefault(); navigateTo('top'); }}><Mark className="public-brand-mark" /><span><strong>Tracelab</strong><small>PCB review workspace</small></span></a>
        <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}><span /><span /></button>
        <nav className={`public-nav ${menuOpen ? 'public-nav-open' : ''}`} aria-label="Main navigation">
          <button type="button" onClick={() => navigateTo('product')}>Product</button>
          <button type="button" onClick={() => navigateTo('workflow')}>How it works</button>
          <button type="button" onClick={() => navigateTo('faq')}>FAQ</button>
          <span className="public-nav-actions"><button type="button" onClick={onSignIn} className="sign-in-link">Sign in</button><button type="button" onClick={() => onGetStarted('register')} className="header-cta">Get started <Icon name="chevron" className="h-3.5 w-3.5" /></button></span>
        </nav>
      </header>

      <main id="top">
        <section className="public-hero">
          <div className="hero-copy">
            <div className="eyebrow-pill"><span />PCB MANUFACTURING REVIEW</div>
            <h1>Know what needs attention <em>before</em> the board leaves your desk.</h1>
            <p className="hero-lede">A focused workspace for checking fabrication files against manufacturing rules—and keeping every result easy to review.</p>
            <div className="hero-actions"><button type="button" onClick={() => onGetStarted('register')} className="hero-primary">Start a design check <Icon name="chevron" className="h-4 w-4" /></button><button type="button" onClick={() => navigateTo('workflow')} className="hero-secondary">See how it works <span aria-hidden="true">↓</span></button></div>
            <div className="hero-note"><Icon name="check" className="h-4 w-4" /><span>Upload a Gerber ZIP · review the findings · keep the report</span></div>
          </div>
          <div className="hero-visual" role="img" aria-label="Illustration of a sample Tracelab DRC report">
            <div className="visual-topline"><span><i />SAMPLE INSPECTION</span><span>CG—DRC / 001</span></div>
            <div className="visual-board"><BoardSchematic patternId="hero-pcb-grid" /></div>
            <div className="visual-report-card">
              <div className="visual-report-heading"><span><small>INSPECTION STATUS</small><strong>Review findings</strong></span><span className="visual-fail-badge"><i />2 findings</span></div>
              <div className="visual-rule"><span className="visual-rule-icon">01</span><span><strong>TRACE_CLEARANCE</strong><small>Below selected profile minimum</small></span><span className="visual-coordinate">X 12.45 · Y 45.21</span></div>
              <div className="visual-rule"><span className="visual-rule-icon">02</span><span><strong>MIN_TRACE_WIDTH</strong><small>Review the reported geometry</small></span><span className="visual-coordinate">X 18.02 · Y 32.77</span></div>
              <div className="visual-card-footer"><span>STANDARD FABRICATION</span><span>VIEW REPORT <Icon name="chevron" className="h-3 w-3" /></span></div>
            </div>
            <span className="visual-side-label">COPPER / TOP LAYER / MM</span>
          </div>
          <div className="hero-baseline"><span>FOR HARDWARE TEAMS & INDEPENDENT DESIGNERS</span><span>DESIGN REVIEW / 01</span></div>
        </section>

        <section id="product" className="product-strip">
          <p>A calmer way to close the gap between a board export and a manufacturing review.</p>
          <div><span><Icon name="upload" />Gerber ZIP upload</span><span><Icon name="rules" />Rule profiles</span><span><Icon name="board" />Saved DRC reports</span></div>
        </section>

        <section id="workflow" className="workflow-section">
          <div className="section-intro"><p className="home-eyebrow">A CLEAR, REPEATABLE PROCESS</p><h2>From package to useful findings.</h2><p>Keep the review steps simple, and keep the result close to the design files that produced it.</p></div>
          <div className="step-grid">{steps.map((step) => <article className="step-card" key={step.number}><span className="step-number">{step.number}</span><div className="step-line" /><h3>{step.title}</h3><p>{step.detail}</p></article>)}</div>
        </section>

        <section className="product-detail">
          <div className="detail-visual"><div className="detail-top"><span>RULE PROFILE / STANDARD</span><span>ACTIVE</span></div><div className="detail-board"><BoardSchematic patternId="detail-pcb-grid" /></div><div className="detail-rules"><span><small>MIN TRACE</small><strong>0.20 <i>mm</i></strong></span><span><small>CLEARANCE</small><strong>0.20 <i>mm</i></strong></span><span><small>ANNULAR RING</small><strong>0.15 <i>mm</i></strong></span></div></div>
          <div className="detail-copy"><p className="home-eyebrow">A PRACTICAL REVIEW DESK</p><h2>Set the limits.<br /><em>See what falls short.</em></h2><p>Choose the available manufacturing profile for each upload. When the check finishes, inspect the saved status, rule messages, and reported coordinates without losing the context of the job.</p><ul><li><Icon name="check" />Results are saved to your account</li><li><Icon name="check" />Review the profile used for each job</li><li><Icon name="check" />Filter and revisit recent inspections</li></ul><button type="button" onClick={() => onGetStarted('register')} className="detail-link">Open your review workspace <Icon name="chevron" className="h-4 w-4" /></button></div>
        </section>

        <section id="faq" className="faq-section">
          <div className="section-intro"><p className="home-eyebrow">GOOD TO KNOW</p><h2>Before you upload.</h2><p>A few details about what this first version does—and what it doesn’t.</p></div>
          <div className="faq-list">
            <details><summary>Which files can I upload?<span>+</span></summary><p>Upload a ZIP archive containing supported Gerber copper layers. Excellon drill files can be included for the current annular-ring checks. The archive limit is 25 MB.</p></details>
            <details><summary>What does the checker review?<span>+</span></summary><p>The initial geometry-based service checks supported copper geometry for trace width and clearance, and checks annular ring for supported circular pads. The report calls out analysis limitations where applicable.</p></details>
            <details><summary>Does this replace my PCB CAD DRC?<span>+</span></summary><p>No. Treat Tracelab as an additional review aid, not a replacement for your PCB design tool’s checks or your fabricator’s requirements. Verify critical findings before ordering boards.</p></details>
          </div>
        </section>

        <section className="closing-cta"><div><p className="home-eyebrow">CIRCUITGUARD WORKSPACE</p><h2>Make the next review easier.</h2><p>Bring your fabrication package and selected rules into one place.</p></div><button type="button" onClick={() => onGetStarted('register')} className="hero-primary">Create your account <Icon name="chevron" className="h-4 w-4" /></button></section>
      </main>

      <footer className="public-footer"><a className="public-brand" href="#top" onClick={(event) => { event.preventDefault(); navigateTo('top'); }}><Mark className="public-brand-mark" /><span><strong>Tracelab</strong><small>PCB review workspace</small></span></a><p>Geometry-based review aid · Verify critical results before fabrication.</p><button type="button" onClick={onSignIn}>Sign in <Icon name="chevron" className="h-3 w-3" /></button></footer>
    </div>
  );
}
