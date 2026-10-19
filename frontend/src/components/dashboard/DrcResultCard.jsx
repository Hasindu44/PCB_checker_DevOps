import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronRight, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function DrcResultCard({ result, compact = false }) {
  const navigate = useNavigate();

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Recently';
    const date = new Date(timeStr);
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div
      onClick={() => navigate(`/drc-results/${result.id}`)}
      className="cg-card cg-card-elevated"
      style={{
        padding: compact ? '12px 14px' : '16px 18px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 200ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
            {result.projectName}
          </span>
          <code
            style={{
              fontSize: '11px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '1px 5px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            {result.projectRevision}
          </code>
        </div>
        <StatusBadge status={result.status} size="sm" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
        <div style={{ color: result.violationCount > 0 ? 'var(--fail)' : 'var(--text-muted)', fontWeight: result.violationCount > 0 ? 500 : 400 }}>
          {result.status === 'ERROR'
            ? `${result.errorCount || 2} processing errors`
            : `${result.violationCount || 0} violations (${result.totalChecks || 124} checks)`}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <Clock size={12} />
          <span>{formatTime(result.completedAt)}</span>
          <ChevronRight size={13} style={{ marginLeft: '4px' }} />
        </div>
      </div>
    </div>
  );
}
