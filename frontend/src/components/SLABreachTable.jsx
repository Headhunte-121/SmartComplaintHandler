/**
 * SmartComplaintHandler - SLA Breach Alert Table
 * Blueprint Reference: V1/M5/frontend/04_sla_breach_table.md
 * Role: High-visibility escalation panel listing overdue and at-risk tickets.
 */
import React from 'react';

export default function SLABreachTable({ breaches = [] }) {
  if (breaches.length === 0) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="text-sm font-bold text-red-800 mb-2">Active SLA Breach Escalations ({breaches.length})</div>
      <table className="w-full text-xs text-left">
        <thead>
          <tr className="text-red-700 font-semibold border-b border-red-200">
            <th className="py-1">Ticket</th>
            <th className="py-1">Title</th>
            <th className="py-1">Priority</th>
            <th className="py-1">Overdue By</th>
          </tr>
        </thead>
        <tbody>
          {breaches.map(b => (
            <tr key={b.ticket_id} className="border-b border-red-100">
              <td className="py-1 font-mono font-bold">{b.tracking_code}</td>
              <td className="py-1">{b.title}</td>
              <td className="py-1 font-bold">{b.priority}</td>
              <td className="py-1 text-red-600 font-bold">{b.hours_overdue}h</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
