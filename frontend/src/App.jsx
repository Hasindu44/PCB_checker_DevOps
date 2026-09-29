import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import { Mark } from './components/Visuals';
import { authApi } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

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
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
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

  if (!user) return <Login onAuthenticate={authenticate} />;

  return (
    <Dashboard user={user} onLogout={logout} />
  );
}
