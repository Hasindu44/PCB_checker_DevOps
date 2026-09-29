import { useState } from 'react';
import { BoardSchematic, Icon, Mark } from './Visuals';

export default function Login({ onAuthenticate }) {
  const [mode, setMode] = useState('login');
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
    <main className="min-h-screen bg-[#f7f7f3] text-[#17201b] lg:grid lg:grid-cols-[minmax(440px,0.9fr)_1.1fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#14231c] lg:flex lg:flex-col" aria-label="CircuitGuard introduction">
        <div className="relative z-10 flex items-center gap-3 px-10 py-9 xl:px-14">
          <Mark light />
          <div className="text-white"><p className="text-[15px] font-semibold tracking-[-0.015em]">CircuitGuard</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[#85978c]">Hardware review</p></div>
        </div>
        <div className="relative z-10 px-10 pt-12 xl:px-14 xl:pt-16">
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.19em] text-[#a8c471]">Design confidence, before fabrication</p>
          <h1 className="max-w-[520px] text-[42px] font-semibold leading-[1.08] tracking-[-0.04em] text-white xl:text-[50px]">A clearer way to review PCB manufacturing files.</h1>
          <p className="mt-6 max-w-md text-[15px] leading-7 text-[#aab7af]">Keep design packages, fabrication rules, and review results together in one focused workspace.</p>
        </div>
        <div className="relative mt-auto h-[42vh] min-h-[300px] border-t border-[#2b3d34]"><BoardSchematic /></div>
      </section>

      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between border-b border-[#e2e3dd] px-6 py-5 lg:hidden">
          <div className="flex items-center gap-3"><Mark /><span className="text-sm font-semibold">CircuitGuard</span></div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7d837e]">Secure access</span>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-9">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-[#71805f]">CircuitGuard workspace</p>
              <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.035em]">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="mt-3 text-sm leading-6 text-[#68706a]">{mode === 'login' ? 'Sign in to continue to your hardware review workspace.' : 'Set up your account to start organizing board reviews.'}</p>
            </div>

            <div className="mb-7 grid grid-cols-2 border-b border-[#d9dbd4]" role="tablist" aria-label="Authentication mode">
              <button type="button" role="tab" aria-selected={mode === 'login'} onClick={() => switchMode('login')} className={`auth-tab ${mode === 'login' ? 'auth-tab-active' : ''}`}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} onClick={() => switchMode('register')} className={`auth-tab ${mode === 'register' ? 'auth-tab-active' : ''}`}>Create account</button>
            </div>

            <form className="space-y-5" onSubmit={submit} noValidate>
              {mode === 'register' && <Field id="name" label="Full name" value={name} onChange={(value) => { setName(value); setError(''); }} autoComplete="name" placeholder="Alex Morgan" />}
              <Field id="email" label="Work email" type="email" value={email} onChange={(value) => { setEmail(value); setError(''); }} autoComplete="email" placeholder="alex@company.com" />
              <div>
                <label htmlFor="password" className="field-label">Password</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => { setPassword(event.target.value); setError(''); }} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" className="field-input pr-12" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#7d837e] hover:text-[#17201b]" aria-label={showPassword ? 'Hide password' : 'Show password'}><Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-[18px] w-[18px]" /></button>
                </div>
              </div>

              {error && <div role="alert" className="flex gap-3 border border-[#e4c4ba] bg-[#fff8f5] px-4 py-3 text-[13px] leading-5 text-[#923d2a]"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#b94b32]" />{error}</div>}

              <button type="submit" disabled={submitting} className="primary-button w-full">
                <span>{submitting ? 'Please wait' : mode === 'login' ? 'Sign in to workspace' : 'Create account'}</span>
                {!submitting && <Icon name="chevron" className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-7 text-center text-xs leading-5 text-[#7b827c]">By continuing, you agree to keep account credentials private and follow your organization&apos;s data policy.</p>
          </div>
        </div>
        <footer className="flex justify-between border-t border-[#e2e3dd] px-6 py-4 font-mono text-[9px] uppercase tracking-[0.16em] text-[#929791] sm:px-10"><span>Encrypted session</span><span>CG / Access 01</span></footer>
      </section>
    </main>
  );
}

function Field({ id, label, type = 'text', value, onChange, autoComplete, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} placeholder={placeholder} className="field-input" />
    </div>
  );
}
