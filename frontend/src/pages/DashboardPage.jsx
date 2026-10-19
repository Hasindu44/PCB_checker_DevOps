import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import {
  Layers,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  RefreshCw,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import ProjectTable from '../components/dashboard/ProjectTable';
import DrcResultCard from '../components/dashboard/DrcResultCard';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { api } from '../services/api';
import { useToast } from '../components/common/Toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { onNewReview } = useOutletContext() || {};
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Unable to load dashboard data from backend server.');
      addToast('Backend connection error: Ensure Spring Boot is running on port 8080.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner & Action Area */}
      <section
        className="cg-card animate-enter stagger-1"
        style={{
          background: 'linear-gradient(135deg, rgba(21, 27, 35, 0.95) 0%, rgba(13, 17, 23, 0.98) 100%)',
          border: '1px solid var(--border-default)',
          position: 'relative',
          padding: '24px 28px',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative circuit lines in background */}
        <div
          style={{
            position: 'absolute',
            right: '-10px',
            top: '-20px',
            bottom: '-20px',
            width: '320px',
            opacity: 0.12,
            pointerEvents: 'none',
          }}
        >
          <svg viewBox="0 0 320 180" style={{ width: '100%', height: '100%' }}>
            <path
              d="M 50 20 L 150 20 L 190 60 L 290 60"
              fill="none"
              stroke="var(--brand-primary)"
              strokeWidth="2"
            />
            <path
              d="M 20 80 L 100 80 L 140 120 L 260 120"
              fill="none"
              stroke="#05D38A"
              strokeWidth="2"
            />
            <circle cx="150" cy="20" r="4" fill="var(--brand-primary)" />
            <circle cx="190" cy="60" r="5" fill="#FFFFFF" />
            <circle cx="100" cy="80" r="4" fill="var(--brand-primary)" />
            <circle cx="140" cy="120" r="4" fill="#05D38A" />
          </svg>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="pcb-pulse-dot" />
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                PCB Manufacturing Intelligence
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {getGreeting()}, Engineer.
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Review your PCB manufacturing files with clarity and confidence.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={fetchDashboardData}
              className="btn btn-secondary btn-sm"
              title="Refresh metrics from backend"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Sync</span>
            </button>
            <button
              onClick={onNewReview}
              className="btn btn-primary"
              id="dashboard-new-review-btn"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Review</span>
            </button>
          </div>
        </div>
      </section>

      {/* Activity Summary Metric Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
              icon={Layers}
              label="Total Projects"
              value={data?.totalProjects ?? 12}
              change={data?.projectsChange || '+3 this month'}
              trendPositive={true}
              description="Active circuit boards under review"
              accentColor="var(--brand-primary)"
              onClick={() => navigate('/projects')}
            />
            <StatCard
              icon={FileCheck2}
              label="Reviews Completed"
              value={data?.reviewsCompleted ?? 28}
              change={data?.reviewsChange || '+12% this month'}
              trendPositive={true}
              description="Full design rule check runs"
              accentColor="#38BDF8"
              onClick={() => navigate('/drc-results')}
            />
            <StatCard
              icon={CheckCircle2}
              label="Passed"
              value={data?.passedCount ?? 21}
              change={data?.passRate || '75% pass rate'}
              trendPositive={true}
              description="Zero manufacturing violations"
              accentColor="var(--pass)"
              onClick={() => navigate('/projects?status=PASS')}
            />
            <StatCard
              icon={AlertTriangle}
              label="Issues Found"
              value={data?.issuesFound ?? 7}
              change={data?.issuesDescription || 'Requires attention'}
              trendPositive={false}
              description="Violations requiring engineering fixes"
              accentColor="var(--fail)"
              onClick={() => navigate('/projects?status=FAIL')}
            />
          </>
        )}
      </section>

      {/* Recent PCB Projects Table */}
      <section className="cg-card animate-enter stagger-2" style={{ padding: 0 }}>
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', margin: 0 }}>
              Recent PCB Projects
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Latest manufacturing revisions submitted for fabrication verification
            </p>
          </div>

          <Link
            to="/projects"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--brand-primary)',
            }}
          >
            <span>View all projects</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
          <ProjectTable projects={data?.recentProjects || []} />
        )}
      </section>

      {/* Two Column Section: Latest DRC Results + Recent Activity Summary */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Latest DRC Results */}
        <div className="cg-card animate-enter stagger-3">
          <div className="cg-card-header">
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                Latest DRC Results
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Automated rule check outcomes
              </p>
            </div>
            <Link
              to="/drc-results"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'var(--brand-primary)',
              }}
            >
              <span>View all results</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton" style={{ height: '70px', borderRadius: '8px' }}></div>
              <div className="skeleton" style={{ height: '70px', borderRadius: '8px' }}></div>
              <div className="skeleton" style={{ height: '70px', borderRadius: '8px' }}></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data?.latestDrcResults && data.latestDrcResults.length > 0 ? (
                data.latestDrcResults.map((result) => (
                  <DrcResultCard key={result.id} result={result} />
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                  No DRC results yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Recent Activity Timeline */}
        <div className="cg-card animate-enter stagger-4">
          <div className="cg-card-header">
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                Activity Summary
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Real-time manufacturing pipeline events
              </p>
            </div>
            <Link
              to="/activity"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12.5px',
                fontWeight: 500,
                color: 'var(--brand-primary)',
              }}
            >
              <span>Full timeline</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton" style={{ height: '54px', borderRadius: '8px' }}></div>
              <div className="skeleton" style={{ height: '54px', borderRadius: '8px' }}></div>
              <div className="skeleton" style={{ height: '54px', borderRadius: '8px' }}></div>
            </div>
          ) : (
            <ActivityTimeline activities={data?.recentActivities || []} limit={5} />
          )}
        </div>
      </section>
    </div>
  );
}
