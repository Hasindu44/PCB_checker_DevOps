import React from 'react';
import { Cpu, Plus } from 'lucide-react';

export default function EmptyState({
  title = 'No items found',
  description = 'Start your first review by uploading your manufacturing files.',
  actionLabel = 'New Review',
  onAction,
}) {
  return (
    <div
      className="cg-card animate-enter"
      style={{
        padding: '56px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--card-bg)',
        border: '1px dashed var(--border-default)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--brand-tint)',
          border: '1px solid var(--brand-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          color: 'var(--brand-primary)',
          boxShadow: '0 0 20px var(--brand-glow)',
        }}
      >
        <Cpu size={30} strokeWidth={1.8} />
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p style={{ maxWidth: '420px', color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '13.5px' }}>
        {description}
      </p>

      {onAction && (
        <button onClick={onAction} className="btn btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
