/**
 * SmartComplaintHandler - Campus Facilities Operations Console
 * Blueprint Reference: V1/M4/frontend/02_admin_dashboard_page.md & V1/M5/00_M5_CENTRAL_OVERVIEW.md
 * Design Pattern: Enterprise supervisory operations workstation with Bento KPI cards,
 *                 inline escalation dialog (replacing raw browser prompt), and filterable queue.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints } from '../api/complaints';
import { updateTicketStatus, escalateTicket } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import PriorityOverrideModal from '../components/PriorityOverrideModal';
import ResolutionNotesModal from '../components/ResolutionNotesModal';
import ReassignTeamModal from '../components/ReassignTeamModal';
import TeamWorkloadView from '../components/TeamWorkloadView';
import SLABreachTable from '../components/SLABreachTable';
import SLACountdownTimer from '../components/SLACountdownTimer';

export default function AdminDashboard() {
  const { currentPersona, currentUser, isTechnician, isAdmin } = useAuth();
  const activeUser = currentUser || currentPersona;

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Filter States
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTicket, setOverrideTicket] = useState(null);

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveTicketTarget, setResolveTicketTarget] = useState(null);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTicketTarget, setReassignTicketTarget] = useState(null);

  // Inline Escalation Modal State
  const [escalateTarget, setEscalateTarget] = useState(null);
  const [escalateReason, setEscalateReason] = useState('High risk of operational SLA breach or campus safety hazard.');
  const [escalating, setEscalating] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComplaints();
      setTickets(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load tickets queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleStartWork = async (ticket) => {
    try {
      await updateTicketStatus(
        ticket.id,
        'IN_PROGRESS',
        'Technician dispatched and commenced physical repair.',
        activeUser?.name
      );
      showToast(`Ticket ${ticket.tracking_code} advanced to IN_PROGRESS.`);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to advance status.');
    }
  };

  const handleConfirmEscalate = async (e) => {
    e.preventDefault();
    if (!escalateTarget || escalateReason.trim().length < 5) return;
    setEscalating(true);
    try {
      await escalateTicket(escalateTarget.id, escalateReason.trim(), activeUser?.name);
      showToast(`Ticket ${escalateTarget.tracking_code} escalated to supervisory attention.`);
      setEscalateTarget(null);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Escalation failed.');
    } finally {
      setEscalating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (selectedDept && t.department_id !== Number(selectedDept) && t.department_name !== selectedDept) return false;
    if (selectedPriority && t.priority !== selectedPriority) return false;
    if (selectedStatus && t.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (t.tracking_code || '').toLowerCase().includes(q);
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchLoc = (t.location || '').toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchLoc) return false;
    }
    return true;
  });

  const totalCount = tickets.length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const criticalCount = tickets.filter(
    (t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Dark Architectural Operations Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl bg-dark-architectural-grid border border-slate-800">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-[11px] font-bold uppercase tracking-wider">
              <span>🛡️ Supervisory Command Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Facilities Maintenance Operations Console
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Live queue dispatch, squad workload balancing, priority override governance, and SLA breach monitoring.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 shrink-0">
            <span className="text-2xl">{activeUser?.avatar || '🛡️'}</span>
            <div className="text-left text-xs">
              <div className="font-bold text-white flex items-center space-x-1.5">
                <span>{activeUser?.name}</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {activeUser?.roleLabel || activeUser?.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                {activeUser?.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-fade-in shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black">✓</span>
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Bento Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card p-5 border-l-4 border-l-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Grievances
          </span>
          <span className="text-3xl font-black text-slate-900 block">{totalCount}</span>
          <span className="text-[11px] text-slate-500 block">Across all campus zones</span>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-blue-600 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
            Active Repairs
          </span>
          <span className="text-3xl font-black text-blue-600 block">{inProgressCount}</span>
          <span className="text-[11px] text-slate-500 block">Dispatched to field squads</span>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-rose-600 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
            Critical Hazards
          </span>
          <span className="text-3xl font-black text-rose-600 block">{criticalCount}</span>
          <span className="text-[11px] text-slate-500 block">2-hour SLA priority gate</span>
        </div>

        <div className="bento-card p-5 border-l-4 border-l-emerald-600 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
            Verified Closed
          </span>
          <span className="text-3xl font-black text-emerald-600 block">{resolvedCount}</span>
          <span className="text-[11px] text-slate-500 block">Completed with repair proof</span>
        </div>
      </div>

      {/* Maintenance Squad Workload Capacities */}
      <TeamWorkloadView />

      {/* Main Incident Operations Table */}
      <div className="bento-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Campus Incident Queue ({filteredTickets.length} records)
            </h2>
            <p className="text-xs text-slate-500">
              Filter active tickets across status, priority, and maintenance squad assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, room..."
              className="enterprise-input w-48 sm:w-56"
            />

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="enterprise-input w-auto"
            >
              <option value="">All Departments</option>
              <option value="1">Electrical</option>
              <option value="2">Plumbing</option>
              <option value="3">Sanitation</option>
              <option value="4">Carpentry</option>
              <option value="5">IT Support</option>
              <option value="6">General Administration</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="enterprise-input w-auto"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="enterprise-input w-auto"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            <button
              onClick={loadTickets}
              disabled={loading}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Ticket Ref</th>
                <th className="py-3.5 px-4">Issue &amp; Campus Location</th>
                <th className="py-3.5 px-4">Squad / Dept</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">SLA Clock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Querying campus incident database...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      <Link to={`/track?code=${t.tracking_code}`} className="hover:underline">
                        {t.tracking_code}
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate" title={t.title}>
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        📍 {t.location || 'Campus'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {t.assigned_team_name || 'Auto-Dispatch'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {t.department_name || 'General'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} size="sm" showSlaTooltip={true} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SLACountdownTimer
                        slaDeadline={t.sla_deadline || t.target_resolution_date}
                        priority={t.priority}
                        status={t.status}
                      />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : t.status === 'ASSIGNED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : t.status === 'ESCALATED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {(t.status === 'ASSIGNED' || t.status === 'SUBMITTED') && (
                          <button
                            type="button"
                            onClick={() => handleStartWork(t)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          >
                            Start Work
                          </button>
                        )}

                        {t.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={() => {
                              setResolveTicketTarget(t);
                              setResolveModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}

                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setOverrideTicket(t);
                              setOverrideModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Supervisor Priority Override"
                          >
                            Priority
                          </button>
                        )}

                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReassignTicketTarget(t);
                              setReassignModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] rounded-lg border border-purple-200 transition-colors cursor-pointer"
                            title="Reassign to another squad"
                          >
                            Reassign
                          </button>
                        )}

                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'ESCALATED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setEscalateTarget(t);
                              setEscalateReason('High risk of operational SLA breach or campus safety hazard.');
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                            title="Escalate ticket"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisory SLA Breach Escalation Panel */}
      <SLABreachTable
        onEscalate={(ticket) => {
          setEscalateTarget(ticket);
          setEscalateReason('Contractual SLA threshold exceeded; escalating for supervisory intervention.');
        }}
        onReassign={(ticket) => {
          setReassignTicketTarget(ticket);
          setReassignModalOpen(true);
        }}
      />

      <PriorityOverrideModal
        isOpen={overrideModalOpen}
        ticket={overrideTicket}
        onClose={() => setOverrideModalOpen(false)}
        onPriorityUpdated={() => {
          setOverrideModalOpen(false);
          showToast('Ticket priority updated and SLA deadline recalculated.');
          loadTickets();
        }}
      />

      <ResolutionNotesModal
        isOpen={resolveModalOpen}
        ticket={resolveTicketTarget}
        onClose={() => setResolveModalOpen(false)}
        onResolved={() => {
          setResolveModalOpen(false);
          showToast('Ticket formally resolved and audit log updated.');
          loadTickets();
        }}
      />

      <ReassignTeamModal
        isOpen={reassignModalOpen}
        ticket={reassignTicketTarget}
        onClose={() => setReassignModalOpen(false)}
        onReassigned={() => {
          setReassignModalOpen(false);
          showToast('Ticket reassigned to new maintenance squad.');
          loadTickets();
        }}
      />

      {/* Styled Escalation Justification Modal */}
      {escalateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Supervisory Escalation
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Escalate Ticket {escalateTarget.tracking_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscalateTarget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmEscalate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mandatory Escalation Justification (min 5 chars)
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="enterprise-input resize-none"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEscalateTarget(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={escalating}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs"
                >
                  {escalating ? 'Escalating...' : 'Confirm Escalation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
