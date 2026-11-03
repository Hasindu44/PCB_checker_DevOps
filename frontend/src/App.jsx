import { useEffect, useState } from 'react';
import Dashboard from './components/TracelabDashboard';
import Home from './components/Home';
import Login from './components/Login';
import { Mark } from './components/Visuals';
import { authApi } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    authApi.currentUser()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  async function authenticate({ mode, ...details }) {
    const response = mode === 'register'
      ? await authApi.register(details)
      : await authApi.login(details);
    setUser(response.user);
    setShowAuth(false);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setShowAuth(false);
      setAuthMode('login');
    }
  }

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f6f2] text-[#687068]">
        <div className="flex flex-col items-center gap-4">
          <Mark className="h-10 w-10" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em]">Opening workspace</p>
        </div>
      </main>
    );
  }

  if (!user && !showAuth) {
    return (
      <Home
        onGetStarted={(mode) => { setAuthMode(mode); setShowAuth(true); }}
        onSignIn={() => { setAuthMode('login'); setShowAuth(true); }}
      />
    );
  }

  if (!user) return <Login initialMode={authMode} onAuthenticate={authenticate} onBackToHome={() => setShowAuth(false)} />;

  return (
    <Dashboard user={user} onLogout={logout} />
  );
}
