import React from 'react';

export function CardSkeleton() {
  return (
    <div className="cg-card" style={{ height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton" style={{ width: '80px', height: '14px' }}></div>
        <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '6px' }}></div>
      </div>
      <div>
        <div className="skeleton" style={{ width: '60px', height: '26px', marginBottom: '8px' }}></div>
        <div className="skeleton" style={{ width: '120px', height: '12px' }}></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="cg-table-container">
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="skeleton" style={{ width: '100%', height: '24px' }}></div>
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '16px' }}>
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={cIdx}
                className="skeleton"
                style={{
                  flex: cIdx === 0 ? 2 : 1,
                  height: '18px',
                }}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="skeleton" style={{ width: '240px', height: '32px' }}></div>
      <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '12px' }}></div>
      <div className="skeleton" style={{ width: '100%', height: '300px', borderRadius: '12px' }}></div>
    </div>
  );
}
