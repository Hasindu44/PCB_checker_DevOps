import React from 'react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  change,
  description,
  accentColor,
  trendPositive,
  onClick
}) {
  return (
    <div
      onClick={onClick}
      className="cg-card cg-card-elevated animate-enter"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: '18px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        {Icon && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: accentColor ? `${accentColor}18` : 'var(--bg-secondary)',
              color: accentColor || 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${accentColor ? `${accentColor}33` : 'var(--border-default)'}`
            }}
          >
            <Icon size={16} strokeWidth={2.2} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </span>
        {change && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: trendPositive === true ? 'var(--pass)' : trendPositive === false ? 'var(--fail)' : 'var(--brand-primary)',
              backgroundColor: trendPositive === true ? 'var(--pass-bg)' : trendPositive === false ? 'var(--fail-bg)' : 'var(--brand-tint)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {change}
          </span>
        )}
      </div>

      {description && (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
          {description}
        </p>
      )}
    </div>
  );
}
