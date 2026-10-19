import React, { useState, useEffect } from 'react';
import { Activity as ActivityIcon, Filter, RefreshCw } from 'lucide-react';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import { api } from '../services/api';

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await api.getActivities();
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filtered = activities.filter((act) => {
    if (filterType === 'ALL') return true;
    return act.type === filterType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Manufacturing Activity
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Audit log of PCB revisions, file ingests, and design rule checks.
          </p>
        </div>

        <button onClick={fetchActivities} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        className="cg-card"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '6px' }}>
          Filter Activity:
        </span>
        {[
          { id: 'ALL', label: 'All Events' },
          { id: 'DRC_COMPLETED', label: 'DRC Completed' },
          { id: 'FILES_UPLOADED', label: 'Files Uploaded' },
          { id: 'PROJECT_CREATED', label: 'Project Created' },
          { id: 'REVIEW_FAILED', label: 'Review Failed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={filterType === tab.id ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            style={{ fontSize: '12px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline Card */}
      <div className="cg-card animate-enter" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }}></div>
            <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }}></div>
            <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }}></div>
          </div>
        ) : (
          <ActivityTimeline activities={filtered} />
        )}
      </div>
    </div>
  );
}
