/**
 * SmartComplaintHandler - Atomic Priority Badge Component (Dark Emerald Theme)
 */
import React from 'react';

const PRIORITY_CONFIG = {
  CRITICAL: {
    classes: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-black',
    sla: '2 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-rose-400 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.316.492-.63 1.056-.99 1.693C8.01 6.67 6.442 9.24 5.38 12.062a8.03 8.03 0 00-.38 2.438c0 4.142 3.358 7.5 7.5 7.5s7.5-3.358 7.5-7.5c0-1.89-.705-3.626-1.875-4.945-.482-.544-.925-1.043-1.34-1.503-.974-1.077-1.782-1.97-2.39-2.999a8.966 8.966 0 01-.9-2.5zM12 16a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ),
  },
  HIGH: {
    classes: 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold',
    sla: '8 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-orange-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  MEDIUM: {
    classes: 'bg-[#fedf47]/15 text-[#fedf47] border-[#fedf47]/35 font-semibold',
    sla: '24 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-[#fedf47] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
      </svg>
    ),
  },
  LOW: {
    classes: 'bg-[#588157]/20 text-[#a3b18a] border-[#588157]/40 font-medium',
    sla: '72 Hours',
    icon: (
      <svg className="w-3.5 h-3.5 mr-1 text-[#7aa778] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export default function PriorityBadge({
  priority = 'MEDIUM',
  size = 'md',
  showIcon = true,
  showSlaTooltip = false,
}) {
  const normalized = (priority || 'MEDIUM').toString().trim().toUpperCase();
  const config = PRIORITY_CONFIG[normalized] || PRIORITY_CONFIG.MEDIUM;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const tooltipText = showSlaTooltip ? `Target SLA: ${config.sla}` : undefined;

  return (
    <span
      role="status"
      aria-label={`Priority: ${normalized}`}
      title={tooltipText}
      className={`inline-flex items-center rounded-full border tracking-wide transition-colors ${sizeClass} ${config.classes}`}
    >
      {showIcon && config.icon}
      <span>{normalized}</span>
    </span>
  );
}
