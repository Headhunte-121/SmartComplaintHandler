/**
 * SmartComplaintHandler - Track Ticket Page
 * Blueprint Reference: V1/M2/frontend/04_track_ticket_page.md
 * Role: Public grievance lookup with 3-step progress stepper and SLA countdown.
 */
import React, { useState } from 'react';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';

export default function TrackTicket() {
  // Controlled input state for student tracking code query (e.g., 'TICK-8F2D')
  const [code, setCode] = useState('');
  
  // State storing the fetched ticket record (or null if no search conducted yet)
  const [ticket, setTicket] = useState(null);

  // Search trigger: in M2 development, replace this with axios call to GET /api/v1/tickets/${code}
  const handleSearch = (e) => {
    e.preventDefault(); // Prevents page reload
    
    // Simulate finding a matching ticket record
    setTicket({
      tracking_code: code.toUpperCase(),
      title: 'Water pipe leaking in corridor',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      department_name: 'Plumbing & Water Services',
      assigned_team_name: 'Plumbing Squad 2',
      sla_deadline: new Date(Date.now() + 10 * 3600 * 1000).toISOString()
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Track Complaint Status</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            required
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter Tracking Code (e.g. TICK-8F2D)..."
            className="flex-grow border border-slate-300 rounded-lg p-2.5 text-sm font-mono uppercase"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-medium rounded-lg text-sm transition">
            Search
          </button>
        </form>
      </div>
      {ticket && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono font-bold text-lg text-blue-600">{ticket.tracking_code}</span>
            <div className="flex items-center space-x-2">
              <PriorityBadge priority={ticket.priority} />
              <SLACountdownTimer deadline={ticket.sla_deadline} />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">{ticket.title}</h3>
          <p className="text-sm text-slate-500 mb-4">Assigned: {ticket.assigned_team_name} ({ticket.department_name})</p>
          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between text-xs font-semibold uppercase text-slate-500 mb-2">
              <span>Submitted</span>
              <span>In Progress</span>
              <span>Resolved</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-2 rounded-full w-1/2"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
