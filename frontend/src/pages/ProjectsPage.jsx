import React, { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext, Link } from 'react-router-dom';
import { Plus, Search, Filter, Layers, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import ProjectTable from '../components/dashboard/ProjectTable';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { api } from '../services/api';

export default function ProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { onNewReview } = useOutletContext() || {};

  const statusParam = searchParams.get('status') || 'ALL';
  const queryParam = searchParams.get('search') || '';

  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.getProjects(statusFilter, searchQuery);
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter(statusParam);
    setSearchQuery(queryParam);
  }, [statusParam, queryParam]);

  useEffect(() => {
    fetchProjects();
  }, [statusFilter, searchQuery]);

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status === 'ALL') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    setSearchParams(newParams);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (!val) {
      newParams.delete('search');
    } else {
      newParams.set('search', val);
    }
    setSearchParams(newParams);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            PCB Projects
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Manage and review your manufacturing projects.
          </p>
        </div>

        <button onClick={onNewReview} className="btn btn-primary" id="projects-new-review-btn">
          <Plus size={16} strokeWidth={2.5} />
          <span>New Review</span>
        </button>
      </div>

      {/* Controls Bar: Filters & Search */}
      <div
        className="cg-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Projects' },
            { id: 'PASS', label: 'PASS', icon: CheckCircle2, color: 'var(--pass)' },
            { id: 'FAIL', label: 'FAIL', icon: AlertTriangle, color: 'var(--fail)' },
            { id: 'ERROR', label: 'ERROR', icon: XCircle, color: 'var(--error)' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleStatusChange(tab.id)}
                className={isActive ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                style={{
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {Icon && <Icon size={13} color={isActive ? 'var(--text-inverse)' : tab.color} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Local Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Filter projects by name or revision..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="cg-input"
            style={{ paddingLeft: '32px', height: '34px', fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* Projects Table Card */}
      <div className="cg-card animate-enter" style={{ padding: 0 }}>
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : projects.length > 0 ? (
          <ProjectTable projects={projects} />
        ) : (
          <EmptyState
            title="No PCB projects found"
            description={
              searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search criteria or status filters.'
                : 'Start your first review by uploading your manufacturing files.'
            }
            actionLabel="New Review"
            onAction={onNewReview}
          />
        )}
      </div>
    </div>
  );
}
