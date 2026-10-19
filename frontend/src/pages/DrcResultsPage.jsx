import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Plus,
  Layers,
  ArrowRight
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import StatCard from '../components/common/StatCard';
import { TableSkeleton, CardSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import { api } from '../services/api';

export default function DrcResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { onNewReview } = useOutletContext() || {};

  const statusParam = searchParams.get('status') || 'ALL';
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await api.getDrcResults(statusFilter);
      setResults(data || []);
    } catch (err) {
      console.error('Failed to load DRC results:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter(statusParam);
  }, [statusParam]);

  useEffect(() => {
    fetchResults();
  }, [statusFilter]);

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

  // Metrics calculation
  const totalChecksCount = results.reduce((acc, r) => acc + (r.totalChecks || 124), 0);
  const passedCount = results.filter((r) => r.status === 'PASS').length;
  const failedCount = results.filter((r) => r.status === 'FAIL').length;
  const errorCount = results.filter((r) => r.status === 'ERROR').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Design Rule Check (DRC) Results
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Comprehensive verification against IPC-2221 manufacturing clearance guidelines.
          </p>
        </div>

        <button onClick={onNewReview} className="btn btn-primary" id="drc-new-review-btn">
          <Plus size={16} strokeWidth={2.5} />
          <span>New Review</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={ShieldCheck}
              label="Total Checks Run"
              value={totalChecksCount.toLocaleString()}
              description="IPC manufacturing rules checked"
              accentColor="var(--brand-primary)"
            />
            <StatCard
              icon={CheckCircle2}
              label="Passed Runs"
              value={passedCount}
              trendPositive={true}
              description="Ready for tooling & fab"
              accentColor="var(--pass)"
            />
            <StatCard
              icon={AlertTriangle}
              label="Failed Runs"
              value={failedCount}
              trendPositive={false}
              description="Rule clearance violations"
              accentColor="var(--fail)"
            />
            <StatCard
              icon={XCircle}
              label="Processing Errors"
              value={errorCount}
              trendPositive={false}
              description="Syntax or geometry issues"
              accentColor="var(--error)"
            />
          </>
        )}
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
          Filter Status:
        </span>
        {[
          { id: 'ALL', label: 'All Results' },
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

      {/* DRC Results Table */}
      <div className="cg-card animate-enter" style={{ padding: 0 }}>
        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : results.length > 0 ? (
          <div className="cg-table-container">
            <table className="cg-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Revision</th>
                  <th>Total Checks</th>
                  <th>Violations</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/drc-results/${r.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--brand-primary)',
                          }}
                        >
                          <Layers size={15} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {r.projectName}
                        </span>
                      </div>
                    </td>

                    <td>
                      <code
                        style={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {r.projectRevision || 'Rev 1.0'}
                      </code>
                    </td>

                    <td style={{ color: 'var(--text-secondary)' }}>
                      {r.totalChecks || 124} checks
                    </td>

                    <td>
                      {r.violationCount > 0 ? (
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
                          {r.violationCount} violations
                        </span>
                      ) : (
                        <span style={{ color: 'var(--pass)', fontSize: '12px', fontWeight: 500 }}>
                          0 violations
                        </span>
                      )}
                    </td>

                    <td>
                      <StatusBadge status={r.status} />
                    </td>

                    <td style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      {new Date(r.completedAt || r.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="btn-ghost btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--brand-primary)',
                        }}
                      >
                        <span>View</span>
                        <ArrowRight size={13} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No DRC results found"
            description="Run a new design rule check to inspect clearance, annular ring, and trace geometry."
            actionLabel="New Review"
            onAction={onNewReview}
          />
        )}
      </div>
    </div>
  );
}
