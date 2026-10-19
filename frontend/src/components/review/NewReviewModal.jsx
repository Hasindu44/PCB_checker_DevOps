import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  FileArchive
} from 'lucide-react';
import DrcProcessingScan from './DrcProcessingScan';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';

export default function NewReviewModal({ isOpen, onClose, onSuccess, projects = [] }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [revision, setRevision] = useState('Rev 1.0');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(e.target.files);
    }
  };

  const processSelectedFiles = (newFilesList) => {
    const fileArray = Array.from(newFilesList).map((f) => {
      const ext = f.name.split('.').pop().toUpperCase();
      let type = 'Gerber';
      if (['ZIP', 'TGZ', 'TAR'].includes(ext)) type = 'ZIP';
      else if (['DRL', 'TXT', 'NC'].includes(ext)) type = 'Drill';
      else if (['CSV', 'XLSX'].includes(ext)) type = 'BOM';
      else if (['POS', 'XY'].includes(ext)) type = 'Pick & Place';
      else if (f.name.toLowerCase().includes('odb')) type = 'ODB++';

      const formatted =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`;

      return {
        name: f.name,
        type,
        size: f.size,
        formattedSize: formatted,
        status: 'VALIDATED',
        rawFile: f,
      };
    });

    setFiles((prev) => [...prev, ...fileArray]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunReview = async () => {
    if (files.length === 0) {
      addToast('Please upload at least one manufacturing file to run DRC.', 'warning');
      return;
    }

    try {
      setIsProcessing(true);

      const reviewPayload = {
        projectId: selectedProjectId ? Number(selectedProjectId) : null,
        projectName: selectedProjectId
          ? undefined
          : newProjectName.trim() || 'New PCB Assembly',
        revision: revision.trim() || 'Rev 1.0',
        notes: notes.trim(),
        files: files.map((f) => ({
          fileName: f.name,
          fileType: f.type,
          fileSize: f.size,
          formattedSize: f.formattedSize,
          layer: f.type === 'Gerber' ? 'Top Copper' : 'Assembly',
        })),
      };

      const result = await api.createReview(reviewPayload);
      setCreatedResult(result);
    } catch (err) {
      setIsProcessing(false);
      addToast(err.message || 'Error processing review', 'error');
    }
  };

  const handleScanAnimationComplete = () => {
    setIsProcessing(false);
    addToast('DRC analysis completed successfully!', 'success');
    if (onSuccess) {
      onSuccess(createdResult);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 11, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="cg-card animate-enter"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-secondary)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
              Start a new PCB review
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Upload your manufacturing files and run a design rule check.
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {isProcessing ? (
            <DrcProcessingScan
              projectName={
                selectedProjectId
                  ? projects.find((p) => p.id === Number(selectedProjectId))?.name
                  : newProjectName || 'PCB Assembly'
              }
              fileCount={files.length}
              onComplete={handleScanAnimationComplete}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Project Target Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="cg-label">Target PCB Project</label>
                  <select
                    className="cg-input"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">+ Create new project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.revision})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedProjectId ? (
                  <div>
                    <label className="cg-label">New Project Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Telemetry Controller"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="cg-input"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="cg-label">Target Revision</label>
                    <input
                      type="text"
                      placeholder="e.g. Rev 2.5"
                      value={revision}
                      onChange={(e) => setRevision(e.target.value)}
                      className="cg-input"
                    />
                  </div>
                )}
              </div>

              {/* Drag & Drop Zone */}
              <div>
                <label className="cg-label">Manufacturing Files</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: isDragging ? '2px dashed var(--brand-primary)' : '2px dashed var(--border-default)',
                    backgroundColor: isDragging ? 'var(--brand-tint)' : 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '36px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    multiple
                    style={{ display: 'none' }}
                  />
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px auto',
                      color: 'var(--brand-primary)',
                    }}
                  >
                    <UploadCloud size={24} />
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Drop your PCB manufacturing files here
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--brand-primary)', fontWeight: 500, marginBottom: '12px' }}>
                    or browse files
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    {['Gerber', 'ODB++', 'Drill', 'Pick & Place', 'ZIP'].map((fmt) => (
                      <span
                        key={fmt}
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--card-bg)',
                          border: '1px solid var(--border-subtle)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Uploaded File List */}
              {files.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Selected Files ({files.length})
                    </span>
                    <button
                      onClick={() => setFiles([])}
                      className="btn-ghost btn-sm"
                      style={{ padding: '0 4px', fontSize: '11.5px', color: 'var(--fail)' }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-secondary)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                          <FileCode size={18} color="var(--brand-primary)" />
                          <div style={{ overflow: 'hidden' }}>
                            <div
                              style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                              }}
                            >
                              {file.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                              <span>{file.type}</span>
                              <span>•</span>
                              <span>{file.formattedSize}</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              color: 'var(--pass)',
                              backgroundColor: 'var(--pass-bg)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            Ready
                          </span>
                          <button
                            onClick={() => removeFile(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="cg-label">Review Notes / Engineering Context (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Design Rule Check for prototype production run"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="cg-input"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!isProcessing && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleRunReview}
              disabled={files.length === 0}
              className="btn btn-primary"
              id="run-drc-review-button"
            >
              <Play size={15} fill="currentColor" />
              <span>Run DRC Review</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
