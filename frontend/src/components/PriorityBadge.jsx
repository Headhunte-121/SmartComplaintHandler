/**
 * SmartComplaintHandler - Atomic Priority Badge
 * Blueprint Reference: V1/M3/frontend/02_priority_badge.md
 * Role: Color-coded status badge chip (CRITICAL pulsing red, HIGH amber, MEDIUM yellow, LOW green).
 */
import React from 'react';

export default function PriorityBadge({ priority = 'MEDIUM' }) {
  const styles = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    LOW: 'bg-green-100 text-green-800 border-green-200'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[priority] || styles.MEDIUM}`}>
      {priority}
    </span>
  );
}
