/**
 * SmartComplaintHandler - Team Workload Panel
 * Blueprint Reference: V1/M4/frontend/03_team_workload_panel.md
 * Role: 4-column responsive grid displaying maintenance squad queue counts and progress bars.
 */
import React from 'react';

export default function TeamWorkloadView({ workloads = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {workloads.map((team) => (
        <div key={team.team_id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-bold text-slate-800">{team.team_name}</div>
          <div className="text-xs text-slate-500 mb-3">{team.department_name}</div>
          <div className="flex justify-between text-xs font-semibold mb-1">
            <span>Active Tickets</span>
            <span className="text-blue-600">{team.active_ticket_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
