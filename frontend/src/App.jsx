import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import DrcResultsPage from './pages/DrcResultsPage';
import DrcResultDetailPage from './pages/DrcResultDetailPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { api } from './services/api';

export default function App() {
  const [user, setUser] = useState({
    id: 1,
    fullName: 'Vidu Jayasundara',
    role: 'Lead Hardware Engineer',
    email: 'engineer@circuitguard.io',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&crop=faces',
  });

  const [projects, setProjects] = useState([]);

  const refreshGlobalData = async () => {
    try {
      const projList = await api.getProjects();
      setProjects(projList || []);
      const currentUser = await api.getCurrentUser();
      if (currentUser) setUser(currentUser);
    } catch (err) {
      console.warn('Initial global data sync notice:', err.message);
    }
  };

  useEffect(() => {
    refreshGlobalData();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Authentication Route */}
          <Route
            path="/login"
            element={<LoginPage onLoginSuccess={(u) => setUser(u)} />}
          />

          {/* Core Application Shell Routes */}
          <Route
            path="/"
            element={
              <AppLayout
                user={user}
                projects={projects}
                onRefreshData={refreshGlobalData}
              />
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="drc-results" element={<DrcResultsPage />} />
            <Route path="drc-results/:id" element={<DrcResultDetailPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="settings" element={<SettingsPage user={user} />} />
          </Route>

          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
