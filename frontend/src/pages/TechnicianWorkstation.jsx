/**
 * SmartComplaintHandler - Field Technician Workstation
 * Blueprint Reference: V1/M4/frontend & V1/M5/frontend/03_resolution_notes_modal.md
 * Role: Operational field console for campus maintenance squads. Supports 1-click status advancement (SUBMITTED -> IN_PROGRESS),
 *       emergency hazard triage, and formal verified closure via ResolutionNotesModal.
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
  const { currentPersona } = useAuth();
  const [selectedTeamId, setSelectedTeamId] = useState(currentPersona?.teamId || 1);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'COMPLETED'
  const [actionSuccess, setActionSuccess] = useState(null);

  // Resolution Modal State
  const [resolvingTicket, setResolvingTicket] = useState(null);

  const selectedSquad = CAMPUS_SQUADS.find((s) => s.id === Number(selectedTeamId)) || CAMPUS_SQUADS[0];

  const loadWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query tickets assigned to this team
      const data = await fetchComplaints({ team_id: selectedTeamId, limit: 100 });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load squad work orders:', err);
      try {
        const allData = await fetchComplaints({ limit: 100 });
        const filtered = allData.filter((t) => t.assigned_team_id === Number(selectedTeamId));
        setTickets(filtered.length > 0 ? filtered : allData);
      } catch (fallbackErr) {
        setError('Unable to load squad work orders. Ensure the backend service is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, [selectedTeamId]);

  const handleStartWork = async (ticket) => {
    try {
      const updated = await updateTicketStatus(
        ticket.id,
        'IN_PROGRESS',
        `Technician ${currentPersona?.name || 'Staff'} commenced on-site diagnostics and repair work.`,
        currentPersona?.name || 'Field Technician'
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: 'IN_PROGRESS' } : t))
      );
      setActionSuccess(`Work order ${ticket.tracking_code} transitioned to IN_PROGRESS.`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to update work order status.');
    }
  };

  const handleTicketResolved = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket, status: 'RESOLVED' } : t))
    );
    setActionSuccess(`Ticket ${updatedTicket.tracking_code} successfully resolved and closure notes recorded.`);
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
      {/* Technician Station Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {currentPersona.avatar || '🔧'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Field Squad Workstation
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/30 text-amber-200">
                  {currentPersona.name} ({currentPersona.identifier || 'TECH-42'})
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium">
                Operational console for dispatch execution, repair progress logging, and verification notes.
              </p>
              {/* Squad Selector */}
              <div className="pt-2 flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-bold">Active Squad Console:</span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                  className="bg-slate-800/90 border border-slate-700 text-amber-300 font-bold rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
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
              title="Refresh Work Orders"
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all text-xs font-bold flex items-center space-x-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-3 animate-fade-in shadow-xs">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">
            ✓
          </span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Emergency Hazard Dispatch Banner */}
      {criticalOrders.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 font-black shadow-md shadow-rose-600/20">
              🚨
            </div>
            <div>
              <h3 className="text-sm font-black text-rose-900 tracking-tight">
                Emergency Priority Dispatch Warning ({criticalOrders.length} Urgent)
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Immediate response required! Safety hazards or high-urgency incidents assigned to this squad.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
          >
            Review Urgent Work Orders
          </button>
        </div>
      )}

      {/* Telemetry Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-xl font-bold">
            📋
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{activeWorkOrders.length}</div>
            <div className="text-xs font-semibold text-slate-500">Active Work Orders</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-xl font-bold">
            ⚡
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{criticalOrders.length}</div>
            <div className="text-xs font-semibold text-slate-500">Critical / Escalated</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
            ✓
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{completedWorkOrders.length}</div>
            <div className="text-xs font-semibold text-slate-500">Completed & Documented</div>
          </div>
        </div>
      </div>

      {/* Work Orders Roster */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Header & Tabs */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              Squad Work Orders — {selectedSquad.name}
            </h2>
            <p className="text-xs text-slate-500">
              Contractual repair execution queue with mandatory closure documentation.
            </p>
          </div>

          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Active Queue ({activeWorkOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Completed ({completedWorkOrders.length})
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Retrieving squad work orders from SQLite database...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold">
              !
            </div>
            <p className="text-xs font-bold text-rose-700">{error}</p>
            <button
              onClick={loadWorkOrders}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
            >
              Retry
            </button>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-20 text-center space-y-4 max-w-sm mx-auto px-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
              🔧
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">No Work Orders Found</h3>
              <p className="text-xs text-slate-500">
                There are currently no tickets matching this state in {selectedSquad.name}'s queue.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayedOrders.map((ticket) => {
              const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
              const isSubmitted = ticket.status === 'SUBMITTED';
              const isInProgress = ticket.status === 'IN_PROGRESS';

              return (
                <div
                  key={ticket.id || ticket.tracking_code}
                  className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Top Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
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
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {ticket.status}
                      </span>
                      {ticket.student_name && (
                        <span className="text-slate-500 text-[11px] font-medium flex items-center space-x-1">
                          <span>Reported by:</span>
                          <strong className="text-slate-700">{ticket.student_name}</strong>
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Location & Logged Time */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1 text-slate-600 font-medium">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Location: <strong>{ticket.location}</strong></span>
                      </span>
                      <span>•</span>
                      <span>
                        Logged: {new Date(ticket.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Resolution Notes preview if present */}
                    {ticket.resolution_notes && (
                      <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Audit Trail & Repair Notes:
                        </div>
                        <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                          {ticket.resolution_notes}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Actions & SLA Timer */}
                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {!isResolved ? (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                          Contractual SLA Target
                        </span>
                        <SLACountdownTimer
                          slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                          priority={ticket.priority}
                          status={ticket.status}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Repaired</span>
                        </span>
                        {ticket.feedback_rating && (
                          <div className="text-xs font-bold text-amber-600 flex items-center space-x-1">
                            <span>Student Review:</span>
                            <span>{'★'.repeat(ticket.feedback_rating)} ({ticket.feedback_rating}/5)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Field Action Buttons */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      {isSubmitted && (
                        <button
                          type="button"
                          onClick={() => handleStartWork(ticket)}
                          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                        >
                          <span>▶ Start Repair</span>
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => setResolvingTicket(ticket)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                        >
                          <span>✓ Resolve Ticket</span>
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

      {/* Mandatory Closure Resolution Modal */}
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
