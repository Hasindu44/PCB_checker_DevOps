import React, { useState } from 'react';
import { User, Sliders, Bell, Shield, Save, Check } from 'lucide-react';
import { useToast } from '../components/common/Toast';

export default function SettingsPage({ user }) {
  const { addToast } = useToast();

  const [fullName, setFullName] = useState(user?.fullName || 'Vidu Jayasundara');
  const [email, setEmail] = useState(user?.email || 'engineer@circuitguard.io');
  const [role, setRole] = useState(user?.role || 'Lead Hardware Engineer');

  const [clearanceMin, setClearanceMin] = useState('0.15');
  const [annularMin, setAnnularMin] = useState('0.125');
  const [drillAspect, setDrillAspect] = useState('10:1');
  const [notifyOnFail, setNotifyOnFail] = useState(true);
  const [notifyOnPass, setNotifyOnPass] = useState(false);

  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    addToast('Engineering configuration saved successfully.', 'success');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '840px', margin: '0 auto' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Platform Settings
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
          Configure engineer credentials, default DRC rule tolerances, and notifications.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile Section */}
        <div className="cg-card animate-enter">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <User size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Engineer Profile</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="cg-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="cg-input"
              />
            </div>
            <div>
              <label className="cg-label">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cg-input"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="cg-label">Engineering Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="cg-input"
              />
            </div>
          </div>
        </div>

        {/* DRC Rule Tolerances Section */}
        <div className="cg-card animate-enter stagger-1">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Shield size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>DRC Rule Engine Tolerances (IPC-2221)</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label className="cg-label">Minimum Trace Clearance (mm)</label>
              <input
                type="number"
                step="0.01"
                value={clearanceMin}
                onChange={(e) => setClearanceMin(e.target.value)}
                className="cg-input"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Class 2 default: 0.15mm</span>
            </div>

            <div>
              <label className="cg-label">Minimum Annular Ring (mm)</label>
              <input
                type="number"
                step="0.005"
                value={annularMin}
                onChange={(e) => setAnnularMin(e.target.value)}
                className="cg-input"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard via pad: 0.125mm</span>
            </div>

            <div>
              <label className="cg-label">Drill Aspect Ratio</label>
              <input
                type="text"
                value={drillAspect}
                onChange={(e) => setDrillAspect(e.target.value)}
                className="cg-input"
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max hole depth to diameter</span>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="cg-card animate-enter stagger-2">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <Bell size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Review Notifications</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyOnFail}
                onChange={(e) => setNotifyOnFail(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
              />
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Email alert when DRC check fails
                </span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Immediate notification with violation coordinates and error breakdown.
                </p>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifyOnPass}
                onChange={(e) => setNotifyOnPass(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
              />
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                  Notify upon manufacturing file sign-off
                </span>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  Send fabrication dispatch receipt when all checks pass.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" id="save-settings-button">
            {saved ? <Check size={18} /> : <Save size={18} />}
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
