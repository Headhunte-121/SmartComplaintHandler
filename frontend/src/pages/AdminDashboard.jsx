/**
 * SmartComplaintHandler - Campus Facilities Operations Console
 * Flush Edge-to-Edge Supervisory Workstation with Full Width Layout & Dual Theme Palette
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { currentUser, isTechnician, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const activeUser = currentUser;

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

  // Client-side multi-dimensional filtering
  const filteredTickets = tickets.filter((t) => {
    if (selectedDept && String(t.department_id) !== String(selectedDept)) return false;
    if (selectedPriority && t.priority !== selectedPriority) return false;
    if (selectedStatus && t.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = t.tracking_code?.toLowerCase().includes(q);
      const matchTitle = t.title?.toLowerCase().includes(q);
      const matchLoc = t.location?.toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchLoc) return false;
    }
    return true;
  });

  // KPI Metrics Calculations
  const totalCount = tickets.length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const criticalCount = tickets.filter(
    (t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  ).length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Flush Operations Hero Header */}
      <div
        className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
            : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xs'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <div
              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span>🛡️ Supervisory Command Desk</span>
            </div>
            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Facilities Maintenance Operations Console
            </h1>
            <p className={`text-xs sm:text-sm max-w-2xl ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Live queue dispatch, squad workload balancing, priority override governance, and SLA breach monitoring.
            </p>
          </div>

          <div
            className={`flex items-center space-x-3 p-3.5 rounded-2xl border shrink-0 transition-colors ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300 shadow-2xs'
            }`}
          >
            <span className="text-2xl">{activeUser?.avatar || '🛡️'}</span>
            <div className="text-left text-xs">
              <div className="font-bold flex items-center space-x-1.5">
                <span className={isDark ? 'text-zinc-100' : 'text-slate-900'}>{activeUser?.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {activeUser?.roleLabel || activeUser?.role}
                </span>
              </div>
              <div className={`text-[11px] font-mono mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {activeUser?.email}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content Area */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8 ${isDark ? 'bg-[#0e1117]' : 'bg-white'}`}>
        {toastMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs ${
              isDark
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">✓</span>
              <span>{toastMsg}</span>
            </div>
            <button type="button" onClick={() => setToastMsg(null)} className="font-bold cursor-pointer hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {/* Bento Operational Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-5 border-l-4 border-l-slate-400 space-y-1 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
              Total Grievances
            </span>
            <span className={`text-3xl font-black block ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{totalCount}</span>
            <span className={`text-[11px] block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Across all campus zones</span>
          </div>

          <div
            className={`p-5 border-l-4 border-l-blue-500 space-y-1 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              Active Repairs
            </span>
            <span className={`text-3xl font-black block ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{inProgressCount}</span>
            <span className={`text-[11px] block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Dispatched to field squads</span>
          </div>

          <div
            className={`p-5 border-l-4 border-l-rose-500 space-y-1 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
              Critical Breakdowns
            </span>
            <span className={`text-3xl font-black block ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>{criticalCount}</span>
            <span className={`text-[11px] block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>2-hour SLA priority gate</span>
          </div>

          <div
            className={`p-5 border-l-4 border-l-emerald-500 space-y-1 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Verified Closed
            </span>
            <span className={`text-3xl font-black block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{resolvedCount}</span>
            <span className={`text-[11px] block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>Completed with repair proof</span>
          </div>
        </div>

        {/* Maintenance Squad Workload Capacities */}
        <TeamWorkloadView />

        {/* Main Incident Operations Table */}
        <div
          className={`rounded-2xl border p-6 sm:p-8 space-y-6 transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <div
            className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 ${
              isDark ? 'border-zinc-800' : 'border-slate-300'
            }`}
          >
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Campus Incident Queue ({filteredTickets.length} records)
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Filter active tickets across status, priority, and maintenance squad assignments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, title, room..."
                className={`px-3 py-2 rounded-xl border text-xs sm:w-56 focus:outline-none transition-all ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                }`}
              />

              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-700 text-zinc-100'
                    : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <option value="" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>All Departments</option>
                <option value="1" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>Electrical</option>
                <option value="2" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>Plumbing</option>
                <option value="3" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>Sanitation</option>
                <option value="4" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>Carpentry</option>
                <option value="5" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>IT Support</option>
                <option value="6" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>General Administration</option>
              </select>

              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-700 text-zinc-100'
                    : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <option value="" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>All Priorities</option>
                <option value="CRITICAL" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>CRITICAL</option>
                <option value="HIGH" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>HIGH</option>
                <option value="MEDIUM" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>MEDIUM</option>
                <option value="LOW" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>LOW</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-700 text-zinc-100'
                    : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                }`}
              >
                <option value="" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>All Statuses</option>
                <option value="SUBMITTED" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>SUBMITTED</option>
                <option value="ASSIGNED" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>ASSIGNED</option>
                <option value="IN_PROGRESS" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>IN_PROGRESS</option>
                <option value="ESCALATED" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>ESCALATED</option>
                <option value="RESOLVED" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>RESOLVED</option>
              </select>

              <button
                type="button"
                onClick={loadTickets}
                disabled={loading}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  isDark
                    ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                    : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
                }`}
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-500">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`font-mono font-bold uppercase tracking-wider text-[10px] border-b ${
                  isDark ? 'bg-[#0e1117] text-zinc-400 border-zinc-800' : 'bg-[#e2e8f0] text-slate-700 border-slate-300'
                }`}
              >
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
              <tbody
                className={`divide-y ${
                  isDark ? 'divide-zinc-800/80 text-zinc-300' : 'divide-slate-200 text-slate-700'
                }`}
              >
                {loading && tickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`py-12 text-center ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      Querying campus incident database...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`py-12 text-center ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      No tickets match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((t) => (
                    <tr
                      key={t.id}
                      className={`transition-colors ${isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-[#cbd5e1]/30'}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-500 whitespace-nowrap">
                        <Link to={`/track?code=${t.tracking_code}`} className="hover:underline">
                          {t.tracking_code}
                        </Link>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className={`font-bold truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`} title={t.title}>
                          {t.title}
                        </div>
                        <div className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                          📍 {t.location || 'Campus'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                          {t.assigned_team_name || 'Auto-Dispatch'}
                        </div>
                        <div className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          {t.department_name || 'General'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={t.priority} size="sm" showSlaTooltip={true} dark={isDark} />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SLACountdownTimer
                          slaDeadline={t.sla_deadline || t.target_resolution_date}
                          priority={t.priority}
                          status={t.status}
                          resolvedAt={t.resolved_at}
                          dark={isDark}
                        />
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            t.status === 'RESOLVED'
                              ? isDark
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : t.status === 'IN_PROGRESS'
                              ? isDark
                                ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                              : t.status === 'ASSIGNED'
                              ? isDark
                                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                              : t.status === 'ESCALATED'
                              ? isDark
                                ? 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : isDark
                              ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
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
                              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-blue-950/60 hover:bg-blue-900/80 text-blue-400 border-blue-800'
                                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300'
                              }`}
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
                              className={`px-2.5 py-1 font-bold text-[11px] rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border-emerald-800'
                                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                              }`}
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
                              className={`px-2.5 py-1 font-semibold text-[11px] rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300'
                                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
                              }`}
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
                              className={`px-2.5 py-1 font-semibold text-[11px] rounded-lg border transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-400 border-indigo-800'
                                  : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300'
                              }`}
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
                              className="p-1.5 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 rounded-lg border border-transparent hover:border-rose-800 transition-colors cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
            <div
              className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 ${
                isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      isDark ? 'bg-rose-950/60 text-rose-400 border-rose-800' : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    Supervisory Escalation
                  </span>
                  <h3 className={`text-base font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Escalate Ticket {escalateTarget.tracking_code}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEscalateTarget(null)}
                  className={`font-bold text-sm cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-100' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleConfirmEscalate} className="space-y-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Mandatory Escalation Justification (min 5 chars)
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none resize-none ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-emerald-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                    }`}
                  />
                </div>
                <div className={`flex items-center justify-end space-x-2 pt-2 border-t ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
                  <button
                    type="button"
                    onClick={() => setEscalateTarget(null)}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                        : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={escalating}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {escalating ? 'Escalating...' : 'Confirm Escalation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
