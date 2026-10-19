import React from 'react';
import { Menu, Search, Bell, Plus, CheckCircle, Shield } from 'lucide-react';

export default function Topbar({
  onToggleSidebar,
  onNewReview,
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  showSearch = true,
}) {
  return (
    <header className="app-topbar">
      {/* Left: Mobile Toggle & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn-ghost"
          style={{
            display: 'none',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            cursor: 'pointer',
          }}
          aria-label="Toggle navigation menu"
          id="mobile-nav-toggle"
        >
          <Menu size={20} />
        </button>

        <div>
          {title && (
            <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Search, Notifications, New Review CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showSearch && (
          <div style={{ position: 'relative', width: '240px' }} className="topbar-search">
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search projects, files, rules..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              className="cg-input"
              style={{
                paddingLeft: '32px',
                paddingRight: '36px',
                height: '34px',
                fontSize: '12.5px',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-default)',
                borderRadius: '3px',
                padding: '1px 4px',
              }}
            >
              /
            </span>
          </div>
        )}

        {/* Notifications Button */}
        <button
          className="btn-secondary btn-sm"
          style={{
            position: 'relative',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Notifications"
          id="notifications-button"
        >
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-primary)',
              boxShadow: '0 0 6px var(--brand-primary)',
            }}
          />
        </button>

        {/* New Review Primary Action */}
        <button
          onClick={onNewReview}
          className="btn btn-primary"
          id="new-review-button"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>New Review</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-nav-toggle {
            display: flex !important;
          }
          .topbar-search {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
