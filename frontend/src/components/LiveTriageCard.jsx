/**
 * SmartComplaintHandler - Live Triage Card
 * Blueprint Reference: V1/M3/frontend/03_live_triage_card.md
 * Role: 500ms debounced live feedback card displaying real-time detected priority & department.
 */
import React from 'react';
import PriorityBadge from './PriorityBadge';

export default function LiveTriageCard({ detectedDepartment, priority, confidence }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
      <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Live Triage Analysis</div>
      <div className="flex justify-between items-center">
        <div>
          <span className="text-sm text-slate-700 font-medium">Detected Domain: </span>
          <span className="text-sm text-slate-900 font-bold">{detectedDepartment || 'Analyzing...'}</span>
        </div>
        <PriorityBadge priority={priority} />
      </div>
    </div>
  );
}
