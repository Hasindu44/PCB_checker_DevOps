import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Layers,
  FileCode,
  ShieldCheck,
  Activity,
  Plus,
  Clock,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileArchive
} from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { DetailSkeleton } from '../components/common/LoadingSkeleton';
import DrcResultCard from '../components/dashboard/DrcResultCard';
import { api } from '../services/api';
import NewReviewModal from '../components/review/NewReviewModal';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await api.getProjectById(id);
      setProject(data);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 0' }}>
        <DetailSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--fail)' }}>Project Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          The requested PCB project with ID #{id} does not exist.
        </p>
        <button onClick={() => navigate('/projects')} className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Return to Projects</span>
        </button>
      </div>
    );
  }

  const isPass = project.status === 'PASS';
  const isFail = project.status === 'FAIL';
  const isError = project.status === 'ERROR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Breadcrumb & Return Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
          to="/projects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '13px',
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Projects</span>
        </Link>

        <button
          onClick={() => setReviewModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Review New Revision</span>
        </button>
      </div>

      {/* Project Header Banner */}
      <div
        className="cg-card animate-enter"
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(180deg, #151B23 0%, #11161D 100%)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
              }}
            >
              <Layers size={24} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '1.65rem', margin: 0 }}>{project.name}</h1>
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
                  {project.revision}
                </code>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {project.category || 'Hardware Assembly'} • Created on {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <StatusBadge status={project.status} size="lg" />
        </div>
      </div>

      {/* Large Status Area Banner */}
      <div
        className="cg-card animate-enter stagger-1"
        style={{
          padding: '16px 20px',
          backgroundColor: isPass ? 'var(--pass-bg)' : isFail ? 'var(--fail-bg)' : 'var(--error-bg)',
          borderColor: isPass ? 'var(--pass-border)' : isFail ? 'var(--fail-border)' : 'var(--error-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        {isPass && <CheckCircle2 size={24} color="var(--pass)" />}
        {isFail && <AlertTriangle size={24} color="var(--fail)" />}
        {isError && <XCircle size={24} color="var(--error)" />}

        <div>
          <div style={{ fontWeight: 700, fontSize: '14.5px', color: isPass ? 'var(--pass)' : isFail ? 'var(--fail)' : 'var(--error)' }}>
            {isPass && 'PASS — No manufacturing rule violations detected'}
            {isFail && `FAIL — ${project.issuesCount || 7} manufacturing rule violations detected`}
            {isError && 'ERROR — Aperture definition or parser exceptions encountered'}
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            {isPass && 'PCB geometry complies with standard IPC-2221 Class 2 fabrication tolerances.'}
            {isFail && 'Clearance or trace width tolerances are out of manufacturing specification.'}
            {isError && 'Manufacturing files contain syntax or aperture macro faults.'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-default)',
          gap: '24px',
        }}
      >
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'files', label: `Manufacturing Files (${project.manufacturingFiles?.length || 0})` },
          { id: 'drc', label: `DRC Results (${project.drcResults?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Engineering Specifications Card */}
          <div className="cg-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '16px', color: 'var(--text-primary)' }}>
              Board Stackup & Specifications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Layer Count</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {project.layerCount || 4} Layers
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Board Thickness</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {project.boardThickness || '1.6mm'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Copper Weight</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {project.copperWeight || '1oz / 35um'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dimensions</span>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {project.dimensions || '120mm x 85mm'}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Review Info */}
          <div className="cg-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Engineering Notes
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
              {project.description || 'No engineering description provided for this PCB assembly.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Clock size={14} />
              <span>Last reviewed: {new Date(project.lastReviewedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manufacturing Files */}
      {activeTab === 'files' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {project.manufacturingFiles && project.manufacturingFiles.length > 0 ? (
            project.manufacturingFiles.map((file) => (
              <div
                key={file.id}
                className="cg-card"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--brand-primary)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <FileCode size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {file.fileName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                      <span>Type: {file.fileType}</span>
                      <span>•</span>
                      <span>Layer: {file.layer || 'Universal'}</span>
                      <span>•</span>
                      <span>Size: {file.formattedSize || '500 KB'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--pass)',
                      backgroundColor: 'var(--pass-bg)',
                      border: '1px solid var(--pass-border)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {file.validationStatus || 'VALIDATED'}
                  </span>
                  <button className="btn-secondary btn-sm" title="Download file artifact">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="cg-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No manufacturing files uploaded for this project yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: DRC Results */}
      {activeTab === 'drc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {project.drcResults && project.drcResults.length > 0 ? (
            project.drcResults.map((drc) => (
              <DrcResultCard key={drc.id} result={drc} />
            ))
          ) : (
            <div className="cg-card" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No historical DRC runs recorded for this project yet.
            </div>
          )}
        </div>
      )}

      <NewReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        onSuccess={() => fetchProject()}
        projects={[project]}
      />
    </div>
  );
}
