import { useState } from 'react';
import { Icon, Mark } from './Visuals';
import './TracelabWorkbench.css';
import './Login.css';

const highlights = [
  { label: 'KiCad native DRC', detail: 'Connectivity, shorts, clearances and board rules' },
  { label: 'Fabrication review', detail: 'Trace width, copper spacing and annular ring' },
  { label: 'Saved history', detail: 'Every report kept with the profile that produced it' },
];

export default function Login({ onAuthenticate, onBackToHome, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (mode === 'register' && name.trim().length < 2) return setError('Enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return setError('Enter a valid email address.');
    if (password.length < 8) return setError('Password must contain at least 8 characters.');

    setSubmitting(true);
    setError('');
    try {
      await onAuthenticate({ mode, name: name.trim(), email: cleanEmail, password });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  return (
    <div className="tl-workspace">
      <header className="tl-topbar tl-auth-topbar">
        <span className="tl-brand"><Mark className="tl-brand-mark" /><span>Tracelab</span></span>
        {onBackToHome && <button type="button" className="tl-button tl-button-outline" onClick={onBackToHome}>← Back to homepage</button>}
      </header>

      <main className="tl-main">
        <div className="tl-content tl-auth-layout">
          <section className="tl-auth-intro">
            <p className="tl-eyebrow">TRACELAB WORKSPACE <i>·</i> SECURE ACCESS</p>
            <h1>Review boards <em>before</em> they ship.</h1>
            <p className="tl-lede">Keep design packages, fabrication rules and review results together in one focused workspace.</p>
            <ul className="tl-auth-highlights">
              {highlights.map((item) => (
                <li key={item.label}><span className="tl-auth-dot" /><div><strong>{item.label}</strong><small>{item.detail}</small></div></li>
              ))}
            </ul>
          </section>

          <section className="tl-panel tl-auth-card" aria-label={mode === 'login' ? 'Sign in' : 'Create account'}>
            <p className="tl-panel-label">{mode === 'login' ? 'WELCOME BACK' : 'NEW ACCOUNT'}</p>
            <h2>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</h2>
            <p className="tl-muted">{mode === 'login' ? 'Continue to your hardware review workspace.' : 'Set up your account to start organizing board reviews.'}</p>

            <div className="tl-auth-tabs" role="tablist" aria-label="Authentication mode">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-selected' : ''} onClick={() => switchMode('login')}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-selected' : ''} onClick={() => switchMode('register')}>Create account</button>
            </div>

            <form className="tl-auth-form" onSubmit={submit} noValidate>
              {mode === 'register' && <Field id="name" label="Full name" value={name} onChange={(value) => { setName(value); setError(''); }} autoComplete="name" placeholder="Alex Morgan" />}
              <Field id="email" label="Work email" type="email" value={email} onChange={(value) => { setEmail(value); setError(''); }} autoComplete="email" placeholder="alex@company.com" />
              <div className="tl-auth-field">
                <label htmlFor="password">Password</label>
                <div className="tl-auth-password">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}><Icon name={showPassword ? 'eyeOff' : 'eye'} /></button>
                </div>
              </div>

              {error && <div role="alert" className="tl-auth-error"><i />{error}</div>}

              <button type="submit" disabled={submitting} className="tl-button tl-button-orange tl-auth-submit">
                {submitting && <span className="tl-spinner" />}
                <span>{submitting ? 'Please wait' : mode === 'login' ? 'Sign in to workspace' : 'Create account'}</span>
                {!submitting && <Icon name="chevron" />}
              </button>
            </form>

            <p className="tl-auth-footnote">By continuing, you agree to keep account credentials private and follow your organization&apos;s data policy.</p>
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({ id, label, type = 'text', value, onChange, autoComplete, placeholder }) {
  return (
    <div className="tl-auth-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} />
    </div>
  );
}
