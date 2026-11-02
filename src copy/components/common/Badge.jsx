import React from 'react';

const statusConfig = {
  active: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  available: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  recovering: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500 animate-pulse',
  },
  'in-progress': {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  urgent: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500 animate-ping',
  },
  critical: {
    bg: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    dot: 'bg-rose-600',
  },
  completed: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
  pending: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  assigned: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
};

export default function Badge({
  status = 'active',
  children,
  showDot = true,
  className = '',
  size = 'md',
}) {
  const normalizedStatus = String(status).toLowerCase();
  const config = statusConfig[normalizedStatus] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${sizes[size] || sizes.md} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      {children || status}
    </span>
  );
}

