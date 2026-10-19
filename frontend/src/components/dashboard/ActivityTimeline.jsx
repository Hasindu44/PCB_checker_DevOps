import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  PlusCircle,
  FileCode,
  Clock,
  AlertOctagon
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ActivityTimeline({ activities = [], limit }) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  if (displayActivities.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No recent activities recorded.
      </div>
    );
  }

  const getActivityIcon = (type, status) => {
    switch (type) {
      case 'DRC_COMPLETED':
        return <CheckCircle2 size={16} color="var(--pass)" />;
      case 'REVIEW_FAILED':
        return status === 'ERROR' ? (
          <AlertOctagon size={16} color="var(--error)" />
        ) : (
          <AlertTriangle size={16} color="var(--fail)" />
        );
      case 'FILES_UPLOADED':
        return <UploadCloud size={16} color="var(--brand-primary)" />;
      case 'PROJECT_CREATED':
        return <PlusCircle size={16} color="var(--info)" />;
      default:
        return <FileCode size={16} color="var(--text-secondary)" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
      {/* Vertical timeline connecting line */}
      <div
        style={{
          position: 'absolute',
          left: '17px',
          top: '12px',
          bottom: '12px',
          width: '2px',
          backgroundColor: 'var(--border-subtle)',
          zIndex: 1,
        }}
      />

      {displayActivities.map((act) => (
        <div
          key={act.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* Icon bubble */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
            }}
          >
            {getActivityIcon(act.type, act.status)}
          </div>

          {/* Activity content */}
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {act.title}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} />
                {act.timeAgo || 'Recently'}
              </span>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
              {act.description}
            </p>

            {act.projectName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--brand-primary)',
                    backgroundColor: 'var(--brand-tint)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--brand-glow)',
                  }}
                >
                  {act.projectName}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
