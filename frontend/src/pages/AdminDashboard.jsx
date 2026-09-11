/**
 * SmartComplaintHandler - Admin Dashboard Workstation
 * Blueprint Reference: V1/M4/frontend/02_admin_dashboard_page.md
 * Role: Central operations desk unifying ticket queue table, workload views, and SLA breach panels.
 */
import React, { useState } from 'react';
import TeamWorkloadView from '../components/TeamWorkloadView';
import SLABreachTable from '../components/SLABreachTable';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import ResolutionNotesModal from '../components/ResolutionNotesModal';

export default function AdminDashboard() {
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const workloads = [
    { team_id: 1, team_name: 'Plumbing Squad 1', department_name: 'Plumbing', active_ticket_count: 4 },
    { team_id: 2, team_name: 'Plumbing Squad 2', department_name: 'Plumbing', active_ticket_count: 1 },
    { team_id: 3, team_name: 'Electrical Team A', department_name: 'Electrical', active_ticket_count: 3 },
    { team_id: 4, team_name: 'Carpentry Unit', department_name: 'Carpentry', active_ticket_count: 0 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Facility Operations Workstation</h1>
      </div>
      <SLABreachTable breaches={[]} />
      <TeamWorkloadView workloads={workloads} />
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-800">Active Queue</div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Title</th>
              <th className="p-4">Priority</th>
              <th className="p-4">SLA Timer</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="p-4 font-mono font-bold text-blue-600">TICK-8F2D</td>
              <td className="p-4 font-medium">Water pipe leaking in corridor</td>
              <td className="p-4"><PriorityBadge priority="HIGH" /></td>
              <td className="p-4"><SLACountdownTimer deadline={new Date(Date.now() + 8*3600*1000).toISOString()} /></td>
              <td className="p-4 font-semibold text-amber-600">IN_PROGRESS</td>
              <td className="p-4">
                <button onClick={() => setResolveModalOpen(true)} className="bg-green-600 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-700">
                  Resolve
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ResolutionNotesModal isOpen={resolveModalOpen} onResolve={(notes) => setResolveModalOpen(false)} onClose={() => setResolveModalOpen(false)} />
    </div>
  );
}
