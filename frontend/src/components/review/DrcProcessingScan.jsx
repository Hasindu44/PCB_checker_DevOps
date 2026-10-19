import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';
import circuitguardLogo from '../../assets/circuitguard-logo.png';

export default function DrcProcessingScan({ projectName, fileCount, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Parsing Gerber layer format & aperture macros...',
    'Aligning multi-layer stackup & copper weights...',
    'Executing IPC-2221 clearance & annular ring checks...',
    'Validating drill hole aspect ratios & thermal spokes...',
    'Finalizing Design Rule Check report...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 800);
          return prev;
        }
      });
    }, 900);

    return () => clearInterval(timer);
  }, [steps.length, onComplete]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
      }}
    >
      {/* Animated Circuit Scanner Box */}
      <div
        style={{
          position: 'relative',
          width: '240px',
          height: '160px',
          backgroundColor: '#0A0E14',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '28px',
          boxShadow: '0 0 30px var(--brand-glow)',
        }}
      >
        {/* Circuit SVG with animated traces and nodes */}
        <svg
          viewBox="0 0 240 160"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {/* Subtle PCB Grid Lines */}
          <line x1="20" y1="40" x2="220" y2="40" stroke="#1A222D" strokeWidth="1" />
          <line x1="20" y1="80" x2="220" y2="80" stroke="#1A222D" strokeWidth="1" />
          <line x1="20" y1="120" x2="220" y2="120" stroke="#1A222D" strokeWidth="1" />
          <line x1="60" y1="10" x2="60" y2="150" stroke="#1A222D" strokeWidth="1" />
          <line x1="120" y1="10" x2="120" y2="150" stroke="#1A222D" strokeWidth="1" />
          <line x1="180" y1="10" x2="180" y2="150" stroke="#1A222D" strokeWidth="1" />

          {/* Animated Circuit Path 1 */}
          <path
            d="M 20 50 L 70 50 L 100 80 L 170 80 L 200 110 L 220 110"
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pcb-animated-line"
          />

          {/* Animated Circuit Path 2 */}
          <path
            d="M 220 30 L 160 30 L 130 60 L 80 60 L 50 90 L 20 90"
            fill="none"
            stroke="#05D38A"
            strokeWidth="2"
            strokeLinecap="round"
            className="pcb-animated-line"
            style={{ animationDirection: 'reverse', animationDuration: '3.2s' }}
          />

          {/* Connection Nodes */}
          <circle cx="70" cy="50" r="4" fill="var(--brand-primary)" className="pcb-pulse-dot" />
          <circle cx="100" cy="80" r="5" fill="#FFFFFF" />
          <circle cx="170" cy="80" r="4" fill="var(--brand-primary)" />
          <circle cx="130" cy="60" r="4" fill="#05D38A" />
        </svg>

        {/* Center Logo Shield Badge */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '10px 14px',
            backgroundColor: 'rgba(21, 27, 35, 0.92)',
            border: '1px solid var(--brand-primary)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 0 20px var(--brand-glow)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Cpu size={20} color="var(--brand-primary)" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.04em' }}>
            SCANNING
          </span>
        </div>
      </div>

      <h3 style={{ fontSize: '1.25rem', marginBottom: '6px', color: 'var(--text-primary)' }}>
        Analyzing {projectName || 'Manufacturing Files'}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        Checking {fileCount || 1} manufacturing file(s) across 124 design rules
      </p>

      {/* Progress Steps List */}
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          textAlign: 'left',
        }}
      >
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isCurrent ? 'var(--brand-tint)' : 'transparent',
                border: isCurrent ? '1px solid var(--brand-glow)' : '1px solid transparent',
                fontSize: '12.5px',
                color: isDone ? 'var(--text-muted)' : isCurrent ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontWeight: isCurrent ? 600 : 400,
                transition: 'all 200ms ease',
              }}
            >
              {isDone ? (
                <CheckCircle2 size={15} color="var(--pass)" />
              ) : isCurrent ? (
                <span className="pcb-pulse-dot" style={{ width: '8px', height: '8px' }} />
              ) : (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--border-hover)', margin: '4px' }} />
              )}
              <span style={{ flex: 1 }}>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
