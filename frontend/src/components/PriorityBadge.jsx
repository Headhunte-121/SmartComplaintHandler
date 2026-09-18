/**
 * SmartComplaintHandler - Atomic Priority Badge
 * Blueprint Reference: V1/M3/frontend/02_priority_badge.md
 * Role: Color-coded status badge chip (CRITICAL pulsing red, HIGH amber, MEDIUM yellow, LOW green).
 */
import React from 'react';

export default function PriorityBadge({ priority = 'MEDIUM' }) {
  const normalized = (priority || 'MEDIUM').toUpperCase();
  const styles = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[normalized] || styles.MEDIUM}`}>
      {normalized}
    </span>
  );
}
