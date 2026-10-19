import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
        }}
      >
        {toasts.map((toast) => {
          let bg = 'var(--card-bg)';
          let borderColor = 'var(--border-default)';
          let icon = <Info size={18} color="var(--info)" />;

          if (toast.type === 'success') {
            borderColor = 'var(--pass-border)';
            icon = <CheckCircle2 size={18} color="var(--pass)" />;
          } else if (toast.type === 'error') {
            borderColor = 'var(--fail-border)';
            icon = <AlertCircle size={18} color="var(--fail)" />;
          } else if (toast.type === 'warning') {
            borderColor = 'var(--error-border)';
            icon = <AlertTriangle size={18} color="var(--error)" />;
          }

          return (
            <div
              key={toast.id}
              className="animate-enter"
              style={{
                backgroundColor: bg,
                border: `1px solid ${borderColor}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                boxShadow: 'var(--shadow-lg)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                color: 'var(--text-primary)',
                fontSize: '13.5px',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '1px' }}>{icon}</div>
              <div style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
