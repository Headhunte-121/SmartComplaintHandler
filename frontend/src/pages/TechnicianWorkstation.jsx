/**
 * SmartComplaintHandler - Field Technician Workstation
 * Dedicated boots-on-the-ground repair console strictly for Technicians.
 * Auto-detects assigned squad, provides live SLA countdowns, parts-needed hold gates,
 * and closed-loop resolution verification.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchComplaints } from '../api/complaints';
import { updateTicketStatus, escalateTicket } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import ResolutionNotesModal from '../components/ResolutionNotesModal';

const CAMPUS_SQUADS = [
  { id: 1, name: 'Substation High-Voltage Team', dept: 'Electrical' },
  { id: 6, name: 'Hostel Electrical Squad 1', dept: 'Electrical' },
  { id: 2, name: 'Water Supply Rapid Response', dept: 'Plumbing' },
  { id: 7, name: 'Hostel Plumbing Squad 2', dept: 'Plumbing' },
  { id: 3, name: 'Sanitation Rapid Response', dept: 'Sanitation' },
  { id: 4, name: 'Structural Fixtures Crew', dept: 'Carpentry' },
  { id: 5, name: 'Network & Wi-Fi Squad', dept: 'IT Support' },
];

const ESCALATION_PRESETS = [
  {
    id: 'misrouted',
    icon: '🏐',
    label: 'Misrouted Category / Wrong Squad',
    hint: 'Issue belongs to a different trade (e.g. sports nets, carpentry, civil fixtures).',
    defaultTarget: 'Carpentry (Structural Fixtures Crew)',
    getText: (ticket, squad) =>
      `Misrouted ticket: The reported issue ("${ticket.title}") does not pertain to the ${squad.name} (${squad.dept}) trade. Requesting supervisor review and manual reassignment to the appropriate maintenance crew.`,
  },
  {
    id: 'parts',
    icon: '📦',
    label: 'Parts / Vendor Procurement Required',
    hint: 'Specialized replacement materials or external vendor contractor required.',
    defaultTarget: '',
    getText: (ticket, squad) =>
      `Parts / Procurement dependency: Resolution of work order "${ticket.title}" requires specialized replacement parts or vendor intervention not available in ${squad.name} inventory.`,
  },
  {
    id: 'hazard',
    icon: '⚠️',
    label: 'Structural / Campus Safety Hazard',
    hint: 'Physical or safety hazard requiring immediate inspection and site containment.',
    defaultTarget: '',
    getText: (ticket, squad) =>
      `Campus Safety Hazard: Physical risk observed on-site for ticket "${ticket.title}". Immediate supervisor inspection and safety protocol activation requested.`,
  },
  {
    id: 'capacity',
    icon: '⏱️',
    label: 'Scope Exceeds Capacity / SLA Risk',
    hint: 'Scope or backlog threatens SLA breach without cross-squad support.',
    defaultTarget: '',
    getText: (ticket, squad) =>
      `Capacity constraint / SLA risk: Repair work for ticket "${ticket.title}" exceeds single-technician shift capacity. Requesting supervisor assistance or workload rebalancing.`,
  },
];

export default function TechnicianWorkstation() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const activeUser = currentUser;

  // Auto-detect assigned squad based on employee profile
  const assignedSquad = useMemo(() => {
    if (activeUser?.teamId) {
      const match = CAMPUS_SQUADS.find((s) => s.id === Number(activeUser.teamId));
      if (match) return match;
    }
    const email = (activeUser?.email || '').toLowerCase();
    const dept = (activeUser?.department_name || '').toLowerCase();

    if (dept.includes('it') || dept.includes('network')) {
      return CAMPUS_SQUADS.find((s) => s.id === 5); // Network & Wi-Fi Squad
    }
    if (dept.includes('elect') || dept.includes('power')) {
      return CAMPUS_SQUADS.find((s) => s.id === 6); // Hostel Electrical Squad 1
    }
    if (dept.includes('plumb')) {
      return CAMPUS_SQUADS.find((s) => s.id === 7); // Hostel Plumbing Squad 2
    }
    if (dept.includes('sanit')) {
      return CAMPUS_SQUADS.find((s) => s.id === 3); // Sanitation Rapid Response
    }
    if (dept.includes('carp')) {
      return CAMPUS_SQUADS.find((s) => s.id === 4); // Structural Fixtures Crew
    }
    return CAMPUS_SQUADS[0];
  }, [activeUser]);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'COMPLETED'
  const [actionSuccess, setActionSuccess] = useState(null);

  // Resolution modal state
  const [resolvingTicket, setResolvingTicket] = useState(null);

  // Hold / Parts Needed modal state
  const [holdingTicket, setHoldingTicket] = useState(null);
  const [holdReason, setHoldReason] = useState('Awaiting replacement spare parts from central institutional inventory.');
  const [submittingHold, setSubmittingHold] = useState(false);

  // Supervisory Escalation modal state
  const [escalatingTicket, setEscalatingTicket] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [suggestedTargetDept, setSuggestedTargetDept] = useState('');
  const [submittingEscalate, setSubmittingEscalate] = useState(false);

  // Keyboard accessibility: dismiss modals on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (escalatingTicket) setEscalatingTicket(null);
        if (holdingTicket) setHoldingTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [escalatingTicket, holdingTicket]);

  const loadWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchComplaints({ team_id: assignedSquad.id, limit: 100 });
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Unable to load squad work orders.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, [assignedSquad.id]);

  const handleStartWork = async (ticket) => {
    try {
      await updateTicketStatus(
        ticket.id,
        'IN_PROGRESS',
        `Technician ${activeUser?.name || 'Staff'} commenced on-site diagnostics and physical repair work.`,
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

  const handleConfirmHold = async (e) => {
    e.preventDefault();
    if (!holdingTicket) return;
    setSubmittingHold(true);
    try {
      await updateTicketStatus(
        holdingTicket.id,
        'ON_HOLD',
        `Work paused: ${holdReason.trim()}`,
        activeUser?.name || 'Field Technician'
      );
      setTickets((prev) =>
        prev.map((t) => (t.id === holdingTicket.id ? { ...t, status: 'ON_HOLD' } : t))
      );
      setActionSuccess(`Work order ${holdingTicket.tracking_code} placed ON_HOLD.`);
      setHoldingTicket(null);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to place ticket on hold.');
    } finally {
      setSubmittingHold(false);
    }
  };

  const handleOpenEscalate = (ticket) => {
    const defaultPreset = ESCALATION_PRESETS[0];
    setEscalateReason(defaultPreset.getText(ticket, assignedSquad));
    setSuggestedTargetDept(defaultPreset.defaultTarget);
    setEscalatingTicket(ticket);
    setError(null);
  };

  const handleConfirmEscalate = async (e) => {
    e.preventDefault();
    if (!escalatingTicket) return;
    const finalReason = [
      escalateReason.trim(),
      suggestedTargetDept ? `[Recommended Squad Target: ${suggestedTargetDept}]` : ''
    ].filter(Boolean).join('\n');

    if (finalReason.length < 5) {
      setError('Please provide an escalation justification of at least 5 characters.');
      return;
    }

    setSubmittingEscalate(true);
    setError(null);
    try {
      await escalateTicket(
        escalatingTicket.id,
        finalReason,
        activeUser?.name || activeUser?.email || 'Field Technician'
      );
      setTickets((prev) =>
        prev.map((t) =>
          t.id === escalatingTicket.id
            ? {
                ...t,
                status: 'ESCALATED',
                resolution_notes: t.resolution_notes
                  ? `${t.resolution_notes}\n[ESCALATION: ${new Date().toISOString()} | Technician: ${activeUser?.name || 'Staff'} | Reason: ${finalReason}]`
                  : `[ESCALATION: ${new Date().toISOString()} | Technician: ${activeUser?.name || 'Staff'} | Reason: ${finalReason}]`,
              }
            : t
        )
      );
      setActionSuccess(`Work order ${escalatingTicket.tracking_code} escalated to supervisor for review and reassignment.`);
      setEscalatingTicket(null);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to escalate ticket to supervisor.');
    } finally {
      setSubmittingEscalate(false);
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
    (t) => t.status === 'SUBMITTED' || t.status === 'IN_PROGRESS' || t.status === 'ESCALATED' || t.status === 'ON_HOLD'
  );
  const completedWorkOrders = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  );
  const criticalOrders = activeWorkOrders.filter(
    (t) => t.priority === 'CRITICAL' || t.status === 'ESCALATED'
  );
  const displayedOrders = activeTab === 'ACTIVE' ? activeWorkOrders : completedWorkOrders;

  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Flush Field Operations Hero Header */}
      <div
        className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
            : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xs'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner border ${
                isDark ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-700'
              }`}
            >
              🛠️
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Field Technician Console
                </span>
                <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>•</span>
                <span className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  {activeUser?.name || 'Authorized Field Staff'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {assignedSquad.name}
              </h1>
              <div className="pt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-emerald-400' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                }`}>
                  Trade: {assignedSquad.dept}
                </span>
                <span className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] ${
                  isDark ? 'bg-zinc-800/60 border-zinc-700 text-zinc-300' : 'bg-white border-slate-300 text-slate-700'
                }`}>
                  Shift: Active On-Duty Dispatch
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={loadWorkOrders}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <svg className={`w-4 h-4 text-emerald-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8 ${isDark ? 'bg-[#0e1117]' : 'bg-white'}`}>
        {actionSuccess && (
          <div
            className={`p-4 rounded-xl border text-xs font-bold flex items-center space-x-3 animate-fade-in shadow-xs ${
              isDark
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
              ✓
            </span>
            <span>{actionSuccess}</span>
          </div>
        )}

        {criticalOrders.length > 0 && (
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xl shrink-0 font-black shadow-md shadow-rose-600/20">
                ⚡
              </div>
              <div>
                <h3 className={`text-sm font-black tracking-tight ${isDark ? 'text-rose-200' : 'text-rose-900'}`}>
                  High-Urgency Complaints Queue ({criticalOrders.length} Critical / Expedited)
                </h3>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-300/80' : 'text-rose-700'}`}>
                  Immediate attention required for high-priority facility complaints in your squad queue.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              View Urgent Complaints
            </button>
          </div>
        )}

        {/* Bento Telemetry Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div
            className={`p-5 border-l-4 border-l-amber-500 flex items-center justify-between rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Assigned Queue
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                {activeWorkOrders.length}
              </div>
              <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {assignedSquad.name}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-bold ${
                isDark ? 'bg-amber-950/60 border-amber-800 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              📋
            </div>
          </div>

          <div
            className={`p-5 border-l-4 border-l-rose-500 flex items-center justify-between rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                Critical / Escalated
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                {criticalOrders.length}
              </div>
              <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                2-hour SLA priority gate
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-bold ${
                isDark ? 'bg-rose-950/60 border-rose-800 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              ⚡
            </div>
          </div>

          <div
            className={`p-5 border-l-4 border-l-emerald-500 flex items-center justify-between rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                Completed Repairs
              </span>
              <div className={`text-3xl font-black mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {completedWorkOrders.length}
              </div>
              <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Verified with closure notes
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-xl font-bold ${
                isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              ✓
            </div>
          </div>
        </div>

        {/* Work Orders Roster */}
        <div
          className={`rounded-2xl border overflow-hidden transition-colors ${
            isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <div
            className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
            }`}
          >
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Work Orders — {assignedSquad.name}
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Start physical triage, pause for parts, and document closure proof with replaced parts.
              </p>
            </div>

            <div
              className={`flex items-center space-x-1 p-1 rounded-xl border ${
                isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ACTIVE'
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : 'bg-white text-slate-900 shadow-2xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Queue ({activeWorkOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'COMPLETED'
                    ? isDark
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : 'bg-white text-slate-900 shadow-2xs'
                    : isDark
                    ? 'text-zinc-400 hover:text-zinc-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({completedWorkOrders.length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Loading squad work orders...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center space-y-3 px-4">
              <p className="text-xs font-bold text-rose-500">{error}</p>
              <button
                type="button"
                onClick={loadWorkOrders}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                Retry
              </button>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="py-20 text-center space-y-3 max-w-sm mx-auto px-4">
              <div
                className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center text-2xl ${
                  isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-slate-100 border-slate-300'
                }`}
              >
                🔧
              </div>
              <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>Queue Clear</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                No work orders in this state for {assignedSquad.name}.
              </p>
            </div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-zinc-800/80' : 'divide-slate-200'}`}>
              {displayedOrders.map((ticket) => {
                const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
                const isClosed = ticket.status === 'CLOSED';
                const isSubmitted = ticket.status === 'SUBMITTED' || ticket.status === 'ASSIGNED' || ticket.status === 'PENDING';
                const isInProgress = ticket.status === 'IN_PROGRESS';
                const isEscalated = ticket.status === 'ESCALATED';
                const isOnHold = ticket.status === 'ON_HOLD';

                return (
                  <div
                    key={ticket.id || ticket.tracking_code}
                    className={`p-5 sm:p-6 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                      isDark ? 'hover:bg-zinc-800/40 text-zinc-200' : 'hover:bg-[#cbd5e1]/30 text-slate-800'
                    }`}
                  >
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Link
                          to={`/track?code=${ticket.tracking_code}`}
                          className={`font-mono font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:bg-emerald-900/90'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          }`}
                        >
                          {ticket.tracking_code}
                        </Link>
                        <PriorityBadge priority={ticket.priority} dark={isDark} />
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                            ticket.status === 'IN_PROGRESS'
                              ? isDark
                                ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                              : ticket.status === 'ESCALATED'
                              ? isDark
                                ? 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              : ticket.status === 'ON_HOLD'
                              ? isDark
                                ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                              : ticket.status === 'RESOLVED'
                              ? isDark
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isDark
                              ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                              : 'bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <div>
                        <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          {ticket.title}
                        </h3>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          {ticket.description}
                        </p>
                      </div>

                      {/* Prominent Physical Location & Contact Info */}
                      <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                        <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-bold ${
                          isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
                        }`}>
                          <span>📍 Location:</span>
                          <span className="text-emerald-500">{ticket.location}</span>
                        </div>

                        {ticket.student_name && (
                          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-[11px] ${
                            isDark ? 'bg-zinc-800/40 border-zinc-700 text-zinc-300' : 'bg-white border-slate-300 text-slate-700'
                          }`}>
                            <span>👤 Submitter:</span>
                            <strong>{ticket.student_name}</strong>
                            {ticket.student_email && (
                              <a
                                href={`mailto:${ticket.student_email}?subject=Regarding Grievance ${ticket.tracking_code}`}
                                className="ml-1 text-emerald-500 underline hover:text-emerald-400 font-mono"
                                title="Click to email student"
                              >
                                {ticket.student_email}
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {ticket.resolution_notes && (
                        <div
                          className={`mt-2 p-3 rounded-xl border text-xs space-y-1 ${
                            isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-300' : 'bg-[#e2e8f0] border-slate-300 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                            Audit Trail &amp; Repair Notes
                          </div>
                          <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed">
                            {ticket.resolution_notes}
                          </pre>
                        </div>
                      )}

                      {/* Closed Loop Student Feedback Display */}
                      {isResolved && ticket.feedback_rating && (
                        <div className={`p-3 rounded-xl border flex items-center gap-3 ${
                          isDark ? 'bg-amber-950/20 border-amber-800/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          <span className="text-base font-bold">★ {ticket.feedback_rating}/5</span>
                          <span className="text-xs italic">
                            "{ticket.feedback_comments || 'Student confirmed satisfaction with resolution.'}"
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 ${
                        isDark ? 'border-zinc-800' : 'border-slate-300'
                      }`}
                    >
                      {!isResolved ? (
                        <div className="space-y-1 text-left sm:text-right">
                          <span className={`text-[10px] uppercase font-bold tracking-wider block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                            SLA Target Countdown
                          </span>
                          <SLACountdownTimer
                            slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                            priority={ticket.priority}
                            status={ticket.status}
                            resolvedAt={ticket.resolved_at}
                            dark={isDark}
                          />
                        </div>
                      ) : (
                        <div className="space-y-1 text-left sm:text-right">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center sm:justify-end space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Closed &amp; Verified</span>
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {(isSubmitted || isOnHold) && (
                          <button
                            type="button"
                            onClick={() => handleStartWork(ticket)}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            ▶ {isOnHold ? 'Resume Repair' : 'Commence Work'}
                          </button>
                        )}

                        {isInProgress && (
                          <>
                            <button
                              type="button"
                              onClick={() => setHoldingTicket(ticket)}
                              className="px-3 py-2 bg-amber-700/80 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              ⏳ Hold (Parts)
                            </button>

                            <button
                              type="button"
                              onClick={() => setResolvingTicket(ticket)}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                            >
                              ✓ Complete &amp; Log
                            </button>
                          </>
                        )}

                        {/* Escalate to Supervisor Button */}
                        {!isResolved && !isClosed && (
                          isEscalated ? (
                            <span
                              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 ${
                                isDark
                                  ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                                  : 'bg-rose-50 border-rose-300 text-rose-800'
                              }`}
                              title="Under supervisory review for manual reassignment"
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                              ⚠️ Escalated to Supervisor
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEscalate(ticket)}
                              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                                isDark
                                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/80 hover:border-rose-700'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-2xs'
                              }`}
                              title="Escalate to Supervisor for review or manual squad reassignment"
                            >
                              <span>⚠️ Escalate to Supervisor</span>
                            </button>
                          )
                        )}

                        <Link
                          to={`/track?code=${ticket.tracking_code}`}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-colors text-center ${
                            isDark
                              ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                          }`}
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
      </div>

      {/* Hold Reason Modal */}
      {holdingTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="hold-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHoldingTicket(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        >
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-scale-up ${
            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <h3 id="hold-modal-title" className="text-base font-bold">Pause Work Order (Parts / Delay Gate)</h3>
            <p className="text-xs text-slate-400">
              Provide the justification for pausing work order <strong>{holdingTicket.tracking_code}</strong> (e.g. required replacement parts or awaiting specialized tools).
            </p>
            <form onSubmit={handleConfirmHold} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Reason / Required Inventory</label>
                <textarea
                  rows={3}
                  required
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="e.g. Awaiting 3/4 inch brass gate valve from central store..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setHoldingTicket(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHold}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-sm"
                >
                  {submittingHold ? 'Recording...' : 'Confirm Hold Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supervisory Escalation Modal */}
      {escalatingTicket && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="escalate-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEscalatingTicket(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
        >
          <div
            className={`w-full max-w-lg p-6 sm:p-7 rounded-2xl border shadow-2xl space-y-4 animate-scale-up ${
              isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border bg-rose-500/20 text-rose-400 border-rose-500/30">
                  Supervisory Escalation Gate
                </span>
                <h3 id="escalate-modal-title" className="text-base font-black mt-1">
                  Escalate Work Order to Supervisor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscalatingTicket(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Flag this ticket for immediate supervisory intervention. The Facility Admin can review your reason, override trade assignment, and manually reassign the ticket to the correct maintenance squad.
            </p>

            <div className={`p-3 rounded-xl border text-xs space-y-1 ${
              isDark ? 'bg-zinc-800/40 border-zinc-700 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-400">{escalatingTicket.tracking_code}</span>
                <span className="font-semibold text-[11px] opacity-75">{assignedSquad.name} ({assignedSquad.dept})</span>
              </div>
              <div className="font-bold truncate">{escalatingTicket.title}</div>
              <div className="text-[11px] opacity-80">📍 {escalatingTicket.location || 'Campus'}</div>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                Quick Select Escalation Reason
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ESCALATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setEscalateReason(preset.getText(escalatingTicket, assignedSquad));
                      if (preset.defaultTarget) setSuggestedTargetDept(preset.defaultTarget);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isDark
                        ? 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:border-rose-500/50'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800 hover:border-rose-400'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-xs text-rose-500">
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                      {preset.hint}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleConfirmEscalate} className="space-y-4 text-xs pt-1">
              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Escalation Justification (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Detail why this ticket requires supervisory review (e.g. misrouted trade, structural hazard, or specialized equipment needed)..."
                  className={`w-full p-3 rounded-xl border text-xs focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-rose-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500 shadow-2xs'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Recommended Squad Trade (Optional suggestion for Supervisor)
                </label>
                <select
                  value={suggestedTargetDept}
                  onChange={(e) => setSuggestedTargetDept(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-rose-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-rose-500'
                  }`}
                >
                  <option value="">-- Let Supervisor Decide Target Squad --</option>
                  <option value="Carpentry (Structural Fixtures Crew)">Carpentry (Structural Fixtures Crew - Sports / Nets / Wooden Fixtures)</option>
                  <option value="General Administration (Facilities & Civil Squad)">General Administration (Facilities &amp; Civil Infrastructure)</option>
                  <option value="Electrical (Hostel Electrical Squad 1)">Electrical (Hostel Electrical Squad 1 - Power / Lighting / Motors)</option>
                  <option value="Plumbing (Hostel Plumbing Squad 2)">Plumbing (Hostel Plumbing Squad 2 - Water / Drainage)</option>
                  <option value="Sanitation (Sanitation Rapid Response)">Sanitation (Sanitation Rapid Response - Waste / Cleaning)</option>
                  <option value="IT Support (Network & Wi-Fi Squad)">IT Support (Network &amp; Wi-Fi Squad - LAN / Access Points)</option>
                </select>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setEscalatingTicket(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEscalate}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  {submittingEscalate ? (
                    <span>Escalating...</span>
                  ) : (
                    <>
                      <span>⚠️ Confirm Escalation to Supervisor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
