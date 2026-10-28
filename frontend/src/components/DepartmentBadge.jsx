/**
 * SmartComplaintHandler - Unified Department Badge Component
 * Distinct color-coding and icons for the 6 campus maintenance trades.
 */
import React from 'react';

const DEPT_CONFIG = {
  ELECTRICAL: {
    label: 'Electrical',
    icon: '⚡',
    border: 'border-amber-500/35',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
  },
  PLUMBING: {
    label: 'Plumbing',
    icon: '💧',
    border: 'border-sky-500/35',
    bg: 'bg-sky-500/10',
    text: 'text-sky-300',
  },
  SANITATION: {
    label: 'Sanitation',
    icon: '🧹',
    border: 'border-emerald-500/35',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
  },
  CARPENTRY: {
    label: 'Carpentry',
    icon: '🪚',
    border: 'border-orange-500/35',
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
  },
  IT: {
    label: 'IT Support',
    icon: '📶',
    border: 'border-indigo-500/35',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300',
  },
  'IT SUPPORT': {
    label: 'IT Support',
    icon: '📶',
    border: 'border-indigo-500/35',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-300',
  },
  FACILITIES: {
    label: 'Facilities',
    icon: '🏢',
    border: 'border-purple-500/35',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
  },
};

export default function DepartmentBadge({
  name = '',
  size = 'sm',
  className = '',
}) {
  const clean = (name || '').trim();
  const upper = clean.toUpperCase();

  let key = 'FACILITIES';
  if (upper.includes('ELECT')) key = 'ELECTRICAL';
  else if (upper.includes('PLUMB')) key = 'PLUMBING';
  else if (upper.includes('SANIT')) key = 'SANITATION';
  else if (upper.includes('CARP')) key = 'CARPENTRY';
  else if (upper.includes('IT') || upper.includes('NETWORK') || upper.includes('WIFI')) key = 'IT';
  else if (upper.includes('FACIL') || upper.includes('CIVIL')) key = 'FACILITIES';

  const cfg = DEPT_CONFIG[key] || DEPT_CONFIG.FACILITIES;
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border font-mono font-medium ${cfg.border} ${cfg.bg} ${cfg.text} ${
        isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs font-semibold'
      } ${className}`}
    >
      <span className="text-[11px] leading-none">{cfg.icon}</span>
      <span className="truncate">{clean || cfg.label}</span>
    </span>
  );
}
