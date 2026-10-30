/**
 * SmartComplaintHandler - Field Technician Workstation
 * High-Density Obsidian Command Desk Standard:
 *  - Deep Space Obsidian canvas (#090d14)
 *  - Boots-on-the-ground repair console with squad telemetry badge
 *  - Real-time SLA Countdown Timers with parts-hold and complete-log gates
 *  - Supervisory escalation drawer with structured institutional presets
 *  - High-density work order action cards
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints } from '../api/complaints';
import { updateTicketStatus, escalateTicket } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import SLACountdownTimer from '../components/SLACountdownTimer';
import ResolutionNotesModal from '../components/ResolutionNotesModal';
import ActivityAuditLog from '../components/ActivityAuditLog';
import {
  Wrench, ShieldAlert, CheckCircle2, Clock, AlertTriangle,
  Play, Pause, ArrowRight, RefreshCw, MapPin, User, Mail, X, Sparkles, ChevronDown,
} from 'lucide-react';

const CAMPUS_SQUADS = [
  { id: 1, name: 'Substation High-Voltage Team', dept: 'Electrical' },
  { id: 6, name: 'Hostel Electrical Squad 1', dept: 'Electrical' },
  { id: 2, name: 'Water Supply Rapid Response', dept: 'Plumbing' },
  { id: 7, name: 'Hostel Plumbing Squad 2', dept: 'Plumbing' },
  { id: 3, name: 'Sanitation Rapid Response', dept: 'Sanitation' },
  { id: 4, name: 'Structural Fixtures Crew', dept: 'Carpentry' },
  { id: 5, name: 'Network & Wi-Fi Squad', dept: 'IT Support' },
  { id: 8, name: 'General Facilities & Civil Squad', dept: 'General Administration' },
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
  const activeUser = currentUser;

  const assignedSquad = useMemo(() => {
    const userTeamId = activeUser?.team_id || activeUser?.teamId;
    if (userTeamId) {
      const match = CAMPUS_SQUADS.find((s) => s.id === Number(userTeamId));
      if (match) return match;
    }
    if (activeUser?.team_name) {
      const match = CAMPUS_SQUADS.find((s) => s.name.toLowerCase() === activeUser.team_name.toLowerCase());
      if (match) return match;
    }
    const email = (activeUser?.email || '').toLowerCase();
    const dept = (activeUser?.department_name || '').toLowerCase();

    if (dept.includes('it') || dept.includes('network')) {
      return CAMPUS_SQUADS.find((s) => s.id === 5);
    }
    if (dept.includes('elect') || dept.includes('power')) {
      return CAMPUS_SQUADS.find((s) => s.id === 6);
    }
    if (dept.includes('plumb')) {
      return CAMPUS_SQUADS.find((s) => s.id === 7);
    }
    if (dept.includes('sanit')) {
      return CAMPUS_SQUADS.find((s) => s.id === 3);
    }
    if (dept.includes('carp')) {
      return CAMPUS_SQUADS.find((s) => s.id === 4);
    }
    return CAMPUS_SQUADS[1] || CAMPUS_SQUADS[0];
  }, [activeUser]);

  const [tickets, setTickets] = useState([]);
  const [selectedSquadId, setSelectedSquadId] = useState(null);

  const currentSquad = useMemo(() => {
    if (selectedSquadId) {
      const match = CAMPUS_SQUADS.find((s) => s.id === selectedSquadId);
      if (match) return match;
    }
    return assignedSquad;
  }, [selectedSquadId, assignedSquad]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [actionSuccess, setActionSuccess] = useState(null);

  const [resolvingTicket, setResolvingTicket] = useState(null);

  const [holdingTicket, setHoldingTicket] = useState(null);
  const [holdReason, setHoldReason] = useState('Awaiting replacement spare parts from central institutional inventory.');
  const [submittingHold, setSubmittingHold] = useState(false);

  const [escalatingTicket, setEscalatingTicket] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [suggestedTargetDept, setSuggestedTargetDept] = useState('');
  const [submittingEscalate, setSubmittingEscalate] = useState(false);

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
      const data = await fetchComplaints({ team_id: currentSquad.id, limit: 100 });
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
  }, [currentSquad.id]);

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
    setEscalateReason(defaultPreset.getText(ticket, currentSquad));
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
    loadWorkOrders();
  };

  const activeWorkOrders = tickets.filter(
    (t) => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(t.status)
  );
  const completedWorkOrders = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  );
  const criticalOrders = activeWorkOrders.filter(
    (t) => t.priority === 'CRITICAL' && t.status !== 'ESCALATED'
  );
  const displayedOrders = activeTab === 'ACTIVE' ? activeWorkOrders : completedWorkOrders;

  return (
    <div className="w-full min-h-screen bg-[#121317] text-zinc-100 font-sans antialiased selection:bg-[#ff5a36]/30 selection:text-white p-4 sm:p-6 lg:p-8 space-y-6 relative">
      {/* Subtle specular ambient sheen */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_60%_0%,rgba(255,90,50,0.035),transparent_60%)]" />

      {/* Header Bar */}
      <div className="p-6 sm:p-7 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#1b1d24] to-[#14151b] backdrop-blur-xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner border border-white/[0.1] bg-white/[0.04] text-[#ff5a36]">
              <Wrench size={26} />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-white/[0.1] bg-white/[0.04] text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  <span>Field Technician Workstation · Active Repair Terminal</span>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {activeUser?.name || 'Authorized Field Staff'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {currentSquad.name}
              </h1>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Boots-on-the-ground repair console, spare parts procurement hold logs, and formal ticket closure verification.
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-lg border border-white/[0.1] bg-white/[0.04] font-mono font-bold text-xs text-zinc-200">
                  Trade: {currentSquad.dept}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg border border-white/[0.08] bg-white/[0.02] font-mono text-[11px] text-zinc-400">
                  Shift: Active On-Duty Dispatch
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Squad Switcher Dropdown */}
            <div className="relative">
              <select
                aria-label="Switch Maintenance Squad View"
                value={currentSquad.id}
                onChange={(e) => setSelectedSquadId(Number(e.target.value))}
                className="appearance-none px-3.5 py-2.5 pr-8 rounded-xl border border-white/[0.1] bg-[#1a1c24] hover:bg-[#222530] text-zinc-200 font-bold text-xs shadow-xs transition-colors cursor-pointer outline-none focus:border-[#ff5a36]/50"
              >
                {CAMPUS_SQUADS.map((squad) => (
                  <option key={squad.id} value={squad.id} className="bg-[#14151b] text-white">
                    {squad.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>

            <button
              type="button"
              onClick={loadWorkOrders}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-white' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300 flex items-center space-x-3 shadow-xl animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {criticalOrders.length > 0 && (
        <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 font-black shadow-lg shadow-rose-600/30">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-rose-200">
                High-Urgency Complaints Queue ({criticalOrders.length} Critical / Expedited)
              </h3>
              <p className="text-xs text-rose-300/80 mt-0.5">
                Immediate attention required for high-priority facility complaints in your squad queue.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVE')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 transition-all shrink-0 cursor-pointer"
          >
            View Urgent Complaints
          </button>
        </div>
      )}

      {/* Bento Telemetry Strip (Clean, Restrained) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Assigned Queue */}
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400">Assigned Queue</span>
              <div className="text-2xl font-bold mt-1 text-white font-mono">{activeWorkOrders.length}</div>
              <span className="text-[11px] text-zinc-500 mt-0.5 block truncate max-w-[200px]">
                {currentSquad.name}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
        </div>

        {/* Card 2: Critical / Urgent */}
        <div className={`p-5 rounded-2xl border transition-all backdrop-blur-xl relative overflow-hidden shadow-sm ${
          criticalOrders.length > 0
            ? 'border-rose-500/30 bg-rose-950/20'
            : 'border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-xs font-medium ${criticalOrders.length ? 'text-rose-300 font-semibold' : 'text-zinc-400'}`}>
                Emergency Gate
              </span>
              <div className={`text-2xl font-bold mt-1 font-mono ${criticalOrders.length ? 'text-rose-300' : 'text-white'}`}>
                {criticalOrders.length}
              </div>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">
                {criticalOrders.length ? '2-hour SLA breach risk' : 'All clear · 0 emergencies'}
              </span>
            </div>
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
              criticalOrders.length
                ? 'border-rose-500/30 bg-rose-500/15 text-rose-400'
                : 'border-white/[0.08] bg-white/[0.03] text-zinc-400'
            }`}>
              {criticalOrders.length ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
            </div>
          </div>
        </div>

        {/* Card 3: Completed Repairs */}
        <div className="p-5 rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-400">Completed Repairs</span>
              <div className="text-2xl font-bold mt-1 text-white font-mono">{completedWorkOrders.length}</div>
              <span className="text-[11px] text-zinc-500 mt-0.5 block">Verified with closure notes</span>
            </div>
            <div className="w-9 h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Work Orders Roster */}
      <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#181a21] to-[#14151a] backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.07)] relative">
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">
              Work Orders — {currentSquad.name}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Start physical triage, pause for parts, and document closure proof with replaced parts.
            </p>
          </div>

          <div className="flex items-center space-x-1 p-1 rounded-xl border border-white/[0.08] bg-[#050608]">
            <button
              type="button"
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-[inset_0_1px_0_0_rgba(245,158,11,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Active Queue ({activeWorkOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'COMPLETED'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.2)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Completed ({completedWorkOrders.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-xs font-mono text-zinc-400">Loading squad work orders...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3 px-4">
            <p className="text-xs font-bold text-rose-400">{error}</p>
            <button
              type="button"
              onClick={loadWorkOrders}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-[0_2px_12px_rgba(59,130,246,0.25)] border border-blue-400/30"
            >
              Retry
            </button>
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="py-20 text-center space-y-3 max-w-sm mx-auto px-4">
            <div className="w-14 h-14 mx-auto rounded-2xl border border-white/[0.08] bg-[#050608] flex items-center justify-center text-2xl text-zinc-500">
              <Wrench size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Queue Clear</h3>
            <p className="text-xs text-zinc-400">
              No work orders in this state for {currentSquad.name}.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
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
                  className="p-5 sm:p-6 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-white/[0.02]"
                >
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="font-mono font-bold px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:text-blue-200 transition-colors"
                      >
                        {ticket.tracking_code}
                      </Link>
                      <PriorityBadge priority={ticket.priority} dark={true} />
                      <StatusBadge status={ticket.status} size="sm" />
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                        {ticket.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>

                    {/* Location & Submitter info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                      <div className="px-2.5 py-1 rounded-lg border border-white/[0.08] bg-[#050608] flex items-center gap-1.5 font-bold text-zinc-200">
                        <MapPin size={13} className="text-blue-400" />
                        <span>Location:</span>
                        <span className="text-white font-mono">{ticket.location}</span>
                      </div>

                      {ticket.student_name && (
                        <div className="px-2.5 py-1 rounded-lg border border-white/[0.08] bg-[#050608] flex items-center gap-1.5 text-[11px] text-zinc-300">
                          <User size={13} className="text-zinc-400" />
                          <span>Submitter:</span>
                          <strong className="text-white">{ticket.student_name}</strong>
                          {ticket.student_email && (
                            <a
                              href={`mailto:${ticket.student_email}?subject=Regarding Grievance ${ticket.tracking_code}`}
                              className="ml-1 text-zinc-300 hover:text-white underline font-mono"
                              title="Click to email student"
                            >
                              {ticket.student_email}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {ticket.resolution_notes && (
                      <div className="mt-2">
                        <ActivityAuditLog
                          notes={ticket.resolution_notes}
                          title="Audit Trail & Repair Notes"
                          compact={true}
                        />
                      </div>
                    )}

                    {isResolved && ticket.feedback_rating && (
                      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center gap-3 text-amber-300">
                        <span className="text-base font-bold font-mono">★ {ticket.feedback_rating}/5</span>
                        <span className="text-xs italic text-zinc-300">
                          "{ticket.feedback_comments || 'Student confirmed satisfaction with resolution.'}"
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.08]">
                    {!isResolved ? (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider block text-zinc-500">
                          SLA Target Countdown
                        </span>
                        <SLACountdownTimer
                          slaDeadline={ticket.sla_deadline || ticket.target_resolution_date}
                          priority={ticket.priority}
                          status={ticket.status}
                          resolvedAt={ticket.resolved_at}
                          dark={true}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 text-left sm:text-right">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center sm:justify-end space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Closed &amp; Verified</span>
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {(isSubmitted || isOnHold) && (
                        <button
                          type="button"
                          onClick={() => handleStartWork(ticket)}
                          className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-[0_2px_12px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Play size={12} fill="currentColor" />
                          <span>{isOnHold ? 'Resume Repair' : 'Commence Work'}</span>
                        </button>
                      )}

                      {isInProgress && (
                        <>
                          <button
                            type="button"
                            onClick={() => setHoldingTicket(ticket)}
                            className="px-3 py-2 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Pause size={12} fill="currentColor" />
                            <span>Hold (Parts)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setResolvingTicket(ticket)}
                            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-[0_2px_12px_rgba(16,185,129,0.25)] border border-emerald-400/30 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={13} />
                            <span>Complete &amp; Log</span>
                          </button>
                        </>
                      )}

                      {!isResolved && !isClosed && (
                        isEscalated ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-3 py-2 text-xs font-mono font-bold rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block" />
                              <span>Escalated to Supervisor</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartWork(ticket)}
                              className="px-3 py-2 text-xs font-semibold rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all cursor-pointer flex items-center gap-1"
                              title="Resume physical repair on-site"
                            >
                              <Play size={12} fill="currentColor" />
                              <span>Resume Work</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenEscalate(ticket)}
                            className="px-3 py-2 text-xs font-semibold rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition-all cursor-pointer flex items-center gap-1.5"
                            title="Escalate to Supervisor for review or manual squad reassignment"
                          >
                            <ShieldAlert size={13} />
                            <span>Escalate</span>
                          </button>
                        )
                      )}

                      <Link
                        to={`/track?code=${ticket.tracking_code}`}
                        className="px-3 py-2 text-xs font-semibold rounded-xl border border-white/[0.1] bg-white/[0.04] hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-300 text-zinc-300 transition-colors"
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

      {/* Hold Reason Modal */}
      {holdingTicket && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHoldingTicket(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/[0.14] bg-[#0c0d12]/95 text-zinc-100 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.1)] space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />
            <h3 className="text-base font-bold text-white">Pause Work Order (Parts / Delay Gate)</h3>
            <p className="text-xs text-zinc-400">
              Provide justification for pausing work order <strong>{holdingTicket.tracking_code}</strong>.
            </p>
            <form onSubmit={handleConfirmHold} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-zinc-300">Reason / Required Inventory</label>
                <textarea
                  rows={3}
                  required
                  value={holdReason}
                  onChange={(e) => setHoldReason(e.target.value)}
                  placeholder="e.g. Awaiting 3/4 inch brass gate valve from central store..."
                  className="w-full p-3 rounded-xl border border-white/[0.1] bg-[#050608] text-white focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setHoldingTicket(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
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
          onClick={(e) => {
            if (e.target === e.currentTarget) setEscalatingTicket(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl border border-white/[0.14] bg-[#0c0d12]/95 text-zinc-100 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.1)] space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400">
                  Supervisory Escalation Gate
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Escalate Work Order ({escalatingTicket.tracking_code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscalatingTicket(null)}
                className="p-1 rounded-lg border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Select an escalation scenario below to request manual reassignment or supervisor intervention:
            </p>

            {/* Escalation Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {ESCALATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setEscalateReason(preset.getText(escalatingTicket, currentSquad));
                    setSuggestedTargetDept(preset.defaultTarget);
                  }}
                  className="p-2.5 rounded-xl border border-white/[0.08] bg-[#050608] hover:border-white/30 hover:bg-white/[0.03] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1 line-clamp-2">
                    {preset.hint}
                  </div>
                </button>
              ))}
            </div>

            <form onSubmit={handleConfirmEscalate} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Escalation Justification &amp; Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Recommended Target Squad (Optional)
                </label>
                <input
                  type="text"
                  value={suggestedTargetDept}
                  onChange={(e) => setSuggestedTargetDept(e.target.value)}
                  placeholder="e.g. Carpentry (Structural Fixtures Crew)"
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs font-mono focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEscalatingTicket(null)}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEscalate}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingEscalate ? 'Escalating...' : 'Submit Escalation to Directorate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolution Notes Modal */}
      {resolvingTicket && (
        <ResolutionNotesModal
          isOpen={Boolean(resolvingTicket)}
          ticket={resolvingTicket}
          onClose={() => setResolvingTicket(null)}
          onResolved={handleTicketResolved}
          onSuccess={handleTicketResolved}
        />
      )}
    </div>
  );
}
