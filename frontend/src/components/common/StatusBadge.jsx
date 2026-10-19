import React from 'react';
import { Check, AlertTriangle, XCircle, Info } from 'lucide-react';

export default function StatusBadge({ status, size = 'md', showIcon = true, className = '' }) {
  const normStatus = (status || 'PASS').toUpperCase();

  let badgeClass = 'status-badge pass';
  let IconComponent = Check;
  let label = 'PASS';

  if (normStatus === 'FAIL') {
    badgeClass = 'status-badge fail';
    IconComponent = AlertTriangle;
    label = 'FAIL';
  } else if (normStatus === 'ERROR') {
    badgeClass = 'status-badge error';
    IconComponent = XCircle;
    label = 'ERROR';
  } else if (normStatus === 'INFO' || normStatus === 'PROCESSING') {
    badgeClass = 'status-badge info';
    IconComponent = Info;
    label = normStatus === 'PROCESSING' ? 'PROCESSING' : 'INFO';
  }

  const iconSizes = {
    sm: 11,
    md: 13,
    lg: 15,
  };

  return (
    <span className={`${badgeClass} ${className}`} style={{ fontSize: size === 'sm' ? '11px' : size === 'lg' ? '13px' : '11.5px' }}>
      {showIcon && <IconComponent size={iconSizes[size] || 13} strokeWidth={2.5} />}
      <span>{label}</span>
    </span>
  );
}
