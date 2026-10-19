import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ChevronRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function ProjectTable({ projects = [], isLoading = false, onRowClick }) {
  const navigate = useNavigate();

  if (projects.length === 0 && !isLoading) {
    return (
      <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No matching PCB projects found.
      </div>
    );
  }

  const handleRowClick = (project) => {
    if (onRowClick) {
      onRowClick(project);
    } else {
      navigate(`/projects/${project.id}`);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.round((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="cg-table-container">
      <table className="cg-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Revision</th>
            <th>Last Review</th>
            <th>DRC Status</th>
            <th>Issues</th>
            <th>Updated</th>
            <th style={{ width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((proj) => (
            <tr key={proj.id} onClick={() => handleRowClick(proj)}>
              {/* Project Name + Icon */}
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-primary)',
                      flexShrink: 0,
                    }}
                  >
                    <Layers size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                      {proj.name}
                    </div>
                    {proj.category && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {proj.category}
                      </div>
                    )}
                  </div>
                </div>
              </td>

              {/* Revision */}
              <td>
                <code
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {proj.revision || 'Rev 1.0'}
                </code>
              </td>

              {/* Last Review */}
              <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {formatRelativeTime(proj.lastReviewedAt)}
              </td>

              {/* DRC Status Badge */}
              <td>
                <StatusBadge status={proj.status} />
              </td>

              {/* Issues Count */}
              <td>
                {proj.issuesCount > 0 ? (
                  <span
                    style={{
                      color: 'var(--fail)',
                      fontWeight: 600,
                      backgroundColor: 'var(--fail-bg)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                    }}
                  >
                    {proj.issuesCount} {proj.issuesCount === 1 ? 'violation' : 'violations'}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    0 issues
                  </span>
                )}
              </td>

              {/* Updated */}
              <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                {formatRelativeTime(proj.updatedAt || proj.createdAt)}
              </td>

              {/* Chevron Link */}
              <td style={{ textAlign: 'right' }}>
                <ChevronRight size={16} color="var(--text-muted)" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
