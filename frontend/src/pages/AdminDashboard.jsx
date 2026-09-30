/**
 * SmartComplaintHandler - Campus Facilities Operations Console
 * Blueprint Reference: V1/M4/frontend/02_admin_dashboard_page.md & V1/M5/00_M5_CENTRAL_OVERVIEW.md
 * Role: Primary operations workstation for campus facility supervisors, technicians, and maintenance leads.
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
  const { currentPersona, isTechnician, isAdmin } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Load all tickets from backend
  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComplaints();
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to load tickets queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Quick Action: Advance to IN_PROGRESS
  const handleStartWork = async (ticket) => {
    try {
      await updateTicketStatus(ticket.id, 'IN_PROGRESS', 'Technician dispatched and commenced physical repair.', currentPersona.name);
      loadTickets();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to advance status.');
    }
  };

  // Quick Action: Escalate
  const handleEscalate = async (ticket) => {
    const reason = prompt(`Enter escalation justification for ${ticket.tracking_code}:`, 'High risk of operational delay or safety hazard escalation.');
    if (!reason || reason.trim().length < 5) {
      alert('Escalation reason must contain at least 5 characters.');
      return;
    }
    try {
      await escalateTicket(ticket.id, reason, currentPersona.name);
      alert(`Ticket ${ticket.tracking_code} escalated successfully!`);
      loadTickets();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Escalation failed.');
    }
  };

  // Filter Logic
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

  // Calculate Operational Metrics
  const totalCount = tickets.length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
  const criticalCount = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Persona Identifier */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Campus Facilities</Link>
            <span>/</span>
            <span className="font-semibold text-indigo-600">Operations Console</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Facilities Maintenance Operations Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational queue dispatch, squad workload balancing, supervisor priority adjustment, and SLA breach governance.
          </p>
        </div>

        {/* Current Active Persona Badge */}
        <div className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-2xl">{currentPersona.avatar}</span>
          <div className="text-left text-xs">
            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
              <span>{currentPersona.name}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${currentPersona.badgeClass}`}>
                {currentPersona.roleLabel}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {isAdmin ? 'Chief Supervisory Authority' : isTechnician ? 'Assigned Field Queue' : 'Campus Member'}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Logged Grievances
          </span>
          <span className="text-2xl font-black text-slate-900">{totalCount}</span>
          <span className="text-[10px] text-slate-500 block">Across all campus zones</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block">
            Active Repairs in Progress
          </span>
          <span className="text-2xl font-black text-blue-600">{inProgressCount}</span>
          <span className="text-[10px] text-slate-500 block">Dispatched to field squads</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 block">
            Critical Safety Incidents
          </span>
          <span className="text-2xl font-black text-rose-600">{criticalCount}</span>
          <span className="text-[10px] text-slate-500 block">Immediate 2-hour priority gate</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block">
            Verified Resolutions
          </span>
          <span className="text-2xl font-black text-emerald-600">{resolvedCount}</span>
          <span className="text-[10px] text-slate-500 block">Completed with repair proof</span>
        </div>
      </div>

      {/* Maintenance Squad Workload Capacities */}
      <TeamWorkloadView />

      {/* Main Incident Operations Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-xs space-y-6">
        {/* Table Filters & Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Campus Incident Queue ({filteredTickets.length} records)
            </h2>
            <p className="text-xs text-slate-400">
              Slice active tickets across status, priority, and maintenance squad assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, title, room..."
              className="text-xs rounded-xl border border-slate-300 px-3.5 py-2 w-48 sm:w-60 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadTickets}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Incidents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ticket Ref</th>
                <th className="py-3 px-4">Issue & Campus Location</th>
                <th className="py-3 px-4">Squad / Dept</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">SLA Clock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Operational Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Querying campus incident database...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      <Link to={`/track?code=${t.tracking_code}`} className="hover:underline">
                        {t.tracking_code}
                      </Link>
                    </td>

                    {/* Title & Location */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 truncate" title={t.title}>
                        {t.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{t.location || 'Campus'}</span>
                      </div>
                    </td>

                    {/* Squad / Dept */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">
                        {t.assigned_team_name || 'Auto-Dispatch'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {t.department_name || 'General'}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={t.priority} size="sm" showSlaTooltip={true} />
                    </td>

                    {/* SLA Countdown Timer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <SLACountdownTimer
                        slaDeadline={t.target_resolution_date}
                        status={t.status}
                      />
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          t.status === 'RESOLVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : t.status === 'ASSIGNED'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    {/* Operational Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Technician Action: Start Work */}
                        {t.status === 'ASSIGNED' && (
                          <button
                            type="button"
                            onClick={() => handleStartWork(t)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] rounded-lg border border-blue-200 transition-colors"
                          >
                            Start Work
                          </button>
                        )}

                        {/* Technician Action: Resolve Ticket */}
                        {t.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            onClick={() => {
                              setResolveTicketTarget(t);
                              setResolveModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition-colors"
                          >
                            Resolve Ticket
                          </button>
                        )}

                        {/* Supervisor Action: Override Priority */}
                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setOverrideTicket(t);
                              setOverrideModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg border border-slate-200 transition-colors"
                            title="Supervisor Priority Override"
                          >
                            Override
                          </button>
                        )}

                        {/* Supervisor Action: Reassign Squad */}
                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReassignTicketTarget(t);
                              setReassignModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-[11px] rounded-lg border border-purple-200 transition-colors"
                            title="Reassign to another squad"
                          >
                            Reassign
                          </button>
                        )}

                        {/* Escalate Action */}
                        {t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleEscalate(t)}
                            className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors"
                            title="Escalate ticket"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
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
        onEscalate={(ticket) => handleEscalate(ticket)}
        onReassign={(ticket) => {
          setReassignTicketTarget(ticket);
          setReassignModalOpen(true);
        }}
      />

      {/* Modal 1: Priority Override */}
      <PriorityOverrideModal
        isOpen={overrideModalOpen}
        ticket={overrideTicket}
        onClose={() => setOverrideModalOpen(false)}
        onPriorityUpdated={() => {
          setOverrideModalOpen(false);
          loadTickets();
        }}
      />

      {/* Modal 2: Resolution Notes Gate */}
      <ResolutionNotesModal
        isOpen={resolveModalOpen}
        ticket={resolveTicketTarget}
        onClose={() => setResolveModalOpen(false)}
        onResolved={() => {
          setResolveModalOpen(false);
          loadTickets();
        }}
      />

      {/* Modal 3: Reassign Squad */}
      <ReassignTeamModal
        isOpen={reassignModalOpen}
        ticket={reassignTicketTarget}
        onClose={() => setReassignModalOpen(false)}
        onReassigned={() => {
          setReassignModalOpen(false);
          loadTickets();
        }}
      />
    </div>
  );
}
