/**
 * SmartComplaintHandler - Field Technician Workstation
 * Blueprint Reference: V1/M4/frontend & V1/M5/frontend/03_resolution_notes_modal.md
 * Design Pattern: Enterprise field operations console with fixed dark hero gradient,
 *                 Bento workload counters, and 1-click work order progression.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints } from '../api/complaints';
import { updateTicketStatus } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import ResolutionNotesModal from '../components/ResolutionNotesModal';

const CAMPUS_SQUADS = [
  { id: 1, name: 'Substation High-Voltage Team', dept: 'Electrical' },
  { id: 6, name: 'Hostel Electrical Squad 1', dept: 'Electrical' },
  { id: 2, name: 'Water Supply Emergency Team', dept: 'Plumbing' },
  { id: 7, name: 'Hostel Plumbing Squad 2', dept: 'Plumbing' },
  { id: 3, name: 'Sanitation Rapid Response', dept: 'Sanitation' },
  { id: 4, name: 'Structural Fixtures Crew', dept: 'Carpentry' },
  { id: 5, name: 'Network & Wi-Fi Squad', dept: 'IT Support' },
];

export default function TechnicianWorkstation() {
  const { currentPersona, currentUser } = useAuth();
  const activeUser = currentUser || currentPersona;

  const [selectedTeamId, setSelectedTeamId] = useState(activeUser?.teamId || 1);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [resolvingTicket, setResolvingTicket] = useState(null);

  const selectedSquad = CAMPUS_SQUADS.find((s) => s.id === Number(selectedTeamId)) || CAMPUS_SQUADS[0];

  const loadWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints({ team_id: selectedTeamId, limit: 100 });
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to load squad work orders. Ensure the backend service is running.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, [selectedTeamId]);

  const handleStartWork = async (ticket) => {
    try {
      await updateTicketStatus(
        ticket.id,
        'IN_PROGRESS',
        `Technician ${activeUser?.name || 'Staff'} commenced on-site diagnostics and repair work.`,
        activeUser?.name || 'Field Technician'
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: 'IN_PROGRESS' } : t))
      );
      setActionSuccess(`Work order ${ticket.tracking_code} transitioned to IN_PROGRESS.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update work order status.');
    }
  };

  const handleTicketResolved = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket, status: 'RESOLVED' } : t))
    );
    setActionSuccess(`Ticket ${updatedTicket.tracking_code} resolved and closure notes recorded.`);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const activeWorkOrders = tickets.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
  );
  const completedWorkOrders = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  );
  const criticalOrders = activeWorkOrders.filter(
    (t) => t.priority === 'CRITICAL' || t.status === 'ESCALATED'
  );
  const displayedOrders = activeTab === 'ACTIVE' ? activeWorkOrders : completedWorkOrders;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Clean White Field Squad Workstation Header */}
      <div className="rounded-3xl bg-white border border-slate-200/90 text-slate-900 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-56 h-56 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-3xl shadow-xs shrink-0">
              {activeUser?.avatar || '🔧'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Field Squad Workstation
                </h1>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-800">
                  {activeUser?.name}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                On-site dispatch execution, repair progress logging, and mandatory closure verification.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-600 font-bold">Active Squad Queue:</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                  className="bg-white border border-slate-200 text-slate-900 font-bold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  {CAMPUS_SQUADS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.dept})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={loadWorkOrders}
              className="btn-botanical-secondary"
            >
              <svg className={`w-4 h-4 text-green-600 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold flex items-center space-x-3 animate-fade-in shadow-2xs">
          <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
            ✓
          </span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {criticalOrders.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 font-black shadow-md shadow-rose-600/20">
              ⚡
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-900 tracking-tight">
                High-Urgency Complaints Queue ({criticalOrders.length} Critical / Expedited)
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Immediate attention required for high-priority facility complaints in your squad queue.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            View Urgent Complaints
          </button>
        </div>
      )}

      {/* Bento Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bento-card p-5 border-l-4 border-l-amber-500 flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Assigned Queue
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">{activeWorkOrders.length}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">{selectedSquad.name}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-600 text-xl font-bold">
            📋
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-rose-500 flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Critical / Escalated
            </span>
            <div className="text-3xl font-black text-rose-600 mt-1">{criticalOrders.length}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">2-hour SLA priority gate</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-600 text-xl font-bold">
            ⚡
          </div>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-green-600 flex items-center justify-between bg-white border border-slate-200 shadow-sm rounded-2xl">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Completed Repairs
            </span>
            <div className="text-3xl font-black text-green-700 mt-1">{completedWorkOrders.length}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Verified with closure notes</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center text-green-700 text-xl font-bold">
            ✓
          </div>
        </div>
      </div>

      {/* Work Orders Roster */}
      <div className="bento-card overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/40">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Squad Work Orders — {selectedSquad.name}
            </h2>
            <p className="text-xs text-slate-500">
              Start on-site repair work or record formal resolution proof.
            </p>
          </div>

          <div className="flex items-center space-x-1 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Queue ({activeWorkOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedWorkOrders.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Loading squad work orders...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 px-4">
            <p className="text-xs font-bold text-rose-700">{error}</p>
            <button
              onClick={loadWorkOrders}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-20 text-center space-y-3 max-w-sm mx-auto px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
              🔧
            </div>
            <h3 className="text-base font-bold text-slate-800">Queue Clear</h3>
            <p className="text-xs text-slate-500">
              No work orders in this state for {selectedSquad.name}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedOrders.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              const isSubmitted = ticket.status === 'SUBMITTED';
              const isInProgress = ticket.status === 'IN_PROGRESS' || ticket.status === 'ESCALATED';

              return (
                <div
                  key={ticket.id || ticket.tracking_code}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <PriorityBadge priority={ticket.priority} />
                      <span
                        className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                          ticket.status === 'IN_PROGRESS'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : ticket.status === 'ESCALATED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold'
                            : ticket.status === 'RESOLVED'
                            ? 'bg-[#8C906D]/20 text-[#3C4233] border-[#8C906D]/40'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {ticket.status}
                      </span>
                      {ticket.student_name && (
                        <span className="text-slate-500 text-[11px] font-medium">
                          Reported by: <strong className="text-slate-700">{ticket.student_name}</strong>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-500">
                      <span>📍 Location: <strong>{ticket.location}</strong></span>
                      <span>•</span>
                      <span>
                        Logged: {new Date(ticket.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {ticket.resolution_notes && (
                      <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Audit Trail &amp; Repair Notes
                        </div>
                        <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                          {ticket.resolution_notes}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {!isResolved ? (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          SLA Target Countdown
                        </span>
                        <SLACountdownTimer
                          slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                          priority={ticket.priority}
                          status={ticket.status}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#687156] flex items-center sm:justify-end space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#687156]" />
                          <span>Completed</span>
                        </span>
                        {ticket.feedback_rating && (
                          <div className="text-xs font-bold text-amber-600">
                            {'★'.repeat(ticket.feedback_rating)} ({ticket.feedback_rating}/5)
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      {isSubmitted && (
                        <button
                          type="button"
                          onClick={() => handleStartWork(ticket)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          ▶ Start Repair
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => setResolvingTicket(ticket)}
                          className="px-4 py-2 bg-[#687156] hover:bg-[#8C906D] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          ✓ Complete &amp; Resolve
                        </button>
                      )}

                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="px-3 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {resolvingTicket && (
        <ResolutionNotesModal
          isOpen={!!resolvingTicket}
          ticket={resolvingTicket}
          onClose={() => setResolvingTicket(null)}
          onResolved={handleTicketResolved}
        />
      )}
    </div>
  );
}
