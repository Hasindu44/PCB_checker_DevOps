import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import NewReviewModal from '../review/NewReviewModal';
import { useToast } from '../common/Toast';

export default function AppLayout({ user, projects = [], onRefreshData }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleReviewSuccess = (newDrcResult) => {
    if (onRefreshData) onRefreshData();
    if (newDrcResult && newDrcResult.id) {
      navigate(`/drc-results/${newDrcResult.id}`);
    } else {
      navigate('/drc-results');
    }
  };

  return (
    <div className="app-shell pcb-grid-bg">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewReview={() => setReviewModalOpen(true)}
        user={user}
      />

      <div className="app-main">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNewReview={() => setReviewModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() && window.location.pathname !== '/projects') {
              navigate(`/projects?search=${encodeURIComponent(q)}`);
            }
          }}
        />

        <main className="app-content">
          <Outlet context={{ searchQuery, onNewReview: () => setReviewModalOpen(true), onRefreshData }} />
        </main>
      </div>

      <NewReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSuccess={handleReviewSuccess}
        projects={projects}
      />
    </div>
  );
}
