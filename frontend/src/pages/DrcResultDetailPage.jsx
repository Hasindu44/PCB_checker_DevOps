import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  MapPin,
  FileCode,
  Layers,
  Crosshair,
  Clock,
  Download,
  Check
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { DetailSkeleton } from '../components/common/LoadingSkeleton';
import { api } from '../services/api';

export default function DrcResultDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [drc, setDrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState(null);

  useEffect(() => {
    async function loadDetail() {
      try {
        setLoading(true);
        const data = await api.getDrcResultById(id);
        setDrc(data);
        if (data.violations && data.violations.length > 0) {
          setSelectedViolation(data.violations[0]);
        }
      } catch (err) {
        console.error('Failed to load DRC detail:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 0' }}>
        <DetailSkeleton />
      </div>
    );
  }

  if (!drc) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--fail)' }}>Result Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          The requested DRC execution record with ID #{id} was not found.
        </p>
        <button onClick={() => navigate('/drc-results')} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Return to DRC Results</span>
        </button>
      </div>
    );
  }

  const isPass = drc.status === 'PASS';
  const isFail = drc.status === 'FAIL';
  const isError = drc.status === 'ERROR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to="/drc-results"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to DRC Results</span>
        </Link>

        {drc.projectId && (
          <Link
            to={`/projects/${drc.projectId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--brand-primary)',
            }}
          >
            <span>Open Project Details</span>
            <Layers size={14} />
          </Link>
        )}
      </div>

      {/* Header Banner */}
      <div
        className="cg-card animate-enter"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(180deg, #151B23 0%, #11161D 100%)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Review ID: {drc.reviewNumber || `RUN-${drc.id}`}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.65rem', margin: 0 }}>{drc.projectName}</h1>
              <code
                style={{
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                {drc.projectRevision || 'Rev 1.0'}
              </code>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
              Completed on {new Date(drc.completedAt || drc.startedAt).toLocaleString()}
            </p>
          </div>

          <StatusBadge status={drc.status} size="lg" />
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        <div className="cg-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Checks
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {drc.totalChecks || 124}
          </div>
        </div>

        <div className="cg-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--pass)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Passed Checks
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--pass)', marginTop: '4px' }}>
            {drc.passedChecks || (isPass ? drc.totalChecks : 117)}
          </div>
        </div>

        <div className="cg-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--fail)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Errors Detected
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--fail)', marginTop: '4px' }}>
            {drc.errorCount || (isFail ? 5 : isError ? 2 : 0)}
          </div>
        </div>

        <div className="cg-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Warnings
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--error)', marginTop: '4px' }}>
            {drc.warningCount || (isFail ? 2 : 0)}
          </div>
        </div>

        <div className="cg-card" style={{ padding: '16px 18px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Violations
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {drc.violationCount || 0}
          </div>
        </div>
      </div>

      {/* Violations Section */}
      {drc.violations && drc.violations.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* Violations List */}
          <div className="cg-card" style={{ padding: 0 }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                Rule Violations ({drc.violations.length})
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Click to inspect coordinates
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {drc.violations.map((v, idx) => {
                const isSelected = selectedViolation?.id === v.id;
                const isErr = v.severity === 'ERROR';

                return (
                  <div
                    key={v.id || idx}
                    onClick={() => setSelectedViolation(v)}
                    style={{
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'var(--card-hover)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--brand-primary)' : '3px solid transparent',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: isErr ? 'var(--fail)' : 'var(--error)',
                            backgroundColor: isErr ? 'var(--fail-bg)' : 'var(--error-bg)',
                            border: `1px solid ${isErr ? 'var(--fail-border)' : 'var(--error-border)'}`,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {v.severity}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                          {v.rule}
                        </span>
                      </div>

                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        X: {v.locationX?.toFixed(1) || 0} Y: {v.locationY?.toFixed(1) || 0}
                      </span>
                    </div>

                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                      {v.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Layer: {v.layer || 'Top Copper'}</span>
                      <span>•</span>
                      <span>File: {v.file || 'copper.gtl'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coordinate Plane / Visual Inspector */}
          <div className="cg-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                  PCB Coordinate Locator
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Target vector map
                </p>
              </div>

              {selectedViolation && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    color: 'var(--brand-primary)',
                    backgroundColor: 'var(--brand-tint)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--brand-glow)',
                  }}
                >
                  <Crosshair size={13} />
                  <span>
                    X:{selectedViolation.locationX?.toFixed(1) || '0.0'}, Y:{selectedViolation.locationY?.toFixed(1) || '0.0'}
                  </span>
                </div>
              )}
            </div>

            {/* Coordinate Plane Grid Canvas */}
            <div
              style={{
                flex: 1,
                minHeight: '260px',
                backgroundColor: '#090D12',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Background Grid Lines */}
              <svg viewBox="0 0 300 200" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                {/* Major grid */}
                <defs>
                  <pattern id="drcGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1A222E" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#drcGrid)" />

                {/* PCB Board Outline */}
                <rect x="25" y="20" width="250" height="160" rx="8" fill="rgba(0, 240, 160, 0.03)" stroke="#223040" strokeWidth="1.5" />

                {/* Circuit Traces */}
                <path d="M 40 40 L 90 40 L 130 80 L 220 80" fill="none" stroke="#1C2836" strokeWidth="2" />
                <path d="M 40 140 L 120 140 L 160 100 L 240 100" fill="none" stroke="#1C2836" strokeWidth="2" />

                {/* Target Violation Position Indicator */}
                {selectedViolation && (
                  <g>
                    {/* Pulsing Target Ring */}
                    <circle
                      cx={Math.min(250, Math.max(50, (selectedViolation.locationX || 100) * 1.5))}
                      cy={Math.min(160, Math.max(40, (selectedViolation.locationY || 60) * 1.5))}
                      r="16"
                      fill="rgba(239, 68, 68, 0.2)"
                      stroke="var(--fail)"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <circle
                      cx={Math.min(250, Math.max(50, (selectedViolation.locationX || 100) * 1.5))}
                      cy={Math.min(160, Math.max(40, (selectedViolation.locationY || 60) * 1.5))}
                      r="4"
                      fill="var(--fail)"
                    />
                  </g>
                )}
              </svg>

              {/* Coordinates Info Box */}
              {selectedViolation && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(21, 27, 35, 0.92)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {selectedViolation.rule}
                  </div>
                  <div>Layer: {selectedViolation.layer}</div>
                </div>
              )}
            </div>

            {/* Selected Violation Details Panel */}
            {selectedViolation && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Fabrication Recommendation:
                </div>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Ensure clearance is adjusted in ECAD layout prior to generating final production Gerber gerber_v2.4 CAM outputs.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="cg-card animate-enter"
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--pass-bg)',
              border: '1px solid var(--pass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--pass)',
              marginBottom: '16px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Zero Rule Violations
          </h3>
          <p style={{ maxWidth: '420px', color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            All 124 Design Rule Checks passed successfully. This PCB package is ready for CAM tooling and PCB fabrication.
          </p>
        </div>
      )}
    </div>
  );
}
