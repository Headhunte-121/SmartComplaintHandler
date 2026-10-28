/**
 * SmartComplaintHandler - Maintenance Squads & Workload Balancer
 * High-Density Obsidian Command Desk Standard:
 *  - Deep Space Obsidian canvas (#090d14)
 *  - Dynamic severity ranking (highest bottleneck & breach stress squads at top)
 *  - High-density capacity pills, SLA overdue badges, and live rebalance actions
 *  - Integrated ReassignTeamModal with closed-loop squad load updates
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import ReassignTeamModal from '../components/ReassignTeamModal';
import SLACountdownTimer from '../components/SLACountdownTimer';
import { isDeadlineOverdue } from '../utils/dateUtils';
import {
  Users, Wrench, RefreshCw, AlertTriangle, Clock, ChevronDown,
  ChevronUp, CheckCircle2, ArrowRightLeft, ShieldAlert, MapPin, X,
} from 'lucide-react';

const CAMPUS_DEPT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🚰',
  Sanitation: '🧹',
  Carpentry: '🪚',
  'IT Support': '💻',
  'General Administration': '🏛️',
};

export default function SquadsPage() {
  const { currentUser } = useAuth();

  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [expandedTeamId, setExpandedTeamId] = useState(null);

  const [reassignTicket, setReassignTicket] = useState(null);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamList, ticketList, breachList] = await Promise.all([
        fetchSquadWorkloads().catch(() => []),
        fetchComplaints().catch(() => []),
        fetchActiveBreaches().catch(() => []),
      ]);
      setTeams(Array.isArray(teamList) ? teamList : []);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      setBreaches(Array.isArray(breachList) ? breachList : []);
    } catch (err) {
      setError('Failed to load squad workload telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overdueTicketIds = useMemo(() => {
    const set = new Set();
    breaches.forEach((b) => {
      if (b.is_breached && b.ticket_id) set.add(b.ticket_id);
    });
    return set;
  }, [breaches]);

  const sortedSquads = useMemo(() => {
    const enhanced = teams.map((team) => {
      const squadTickets = tickets.filter(
        (t) => t.assigned_team_id === team.team_id || t.assigned_team_name === team.team_name
      );
      const activeTickets = squadTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
      );
      const overdueTickets = activeTickets.filter(
        (t) =>
          overdueTicketIds.has(t.id) ||
          (t.sla_deadline && isDeadlineOverdue(t.sla_deadline))
      );
      const onHoldTickets = activeTickets.filter((t) => t.status === 'ON_HOLD');
      const inProgressTickets = activeTickets.filter(
        (t) => t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
      );
      const submittedTickets = activeTickets.filter(
        (t) => t.status === 'SUBMITTED' || t.status === 'ASSIGNED' || t.status === 'PENDING'
      );

      const issuesScore =
        overdueTickets.length * 4 + onHoldTickets.length * 2 + activeTickets.length;

      let capacityStatus = 'Optimal Capacity';
      let capacityColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';

      if (overdueTickets.length > 0 || activeTickets.length >= 6) {
        capacityStatus = 'Critical Backlog';
        capacityColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse';
      } else if (onHoldTickets.length > 0 || activeTickets.length >= 3) {
        capacityStatus = 'Heavy Load';
        capacityColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      }

      return {
        ...team,
        activeTickets,
        overdueCount: overdueTickets.length,
        onHoldCount: onHoldTickets.length,
        inProgressCount: inProgressTickets.length,
        submittedCount: submittedTickets.length,
        totalActive: activeTickets.length,
        issuesScore,
        capacityStatus,
        capacityColor,
      };
    });

    return enhanced.sort((a, b) => b.issuesScore - a.issuesScore);
  }, [teams, tickets, overdueTicketIds]);

  const handleOpenReassign = (ticket) => {
    setReassignTicket(ticket);
    setReassignModalOpen(true);
  };

  const handleReassignSuccess = (ticketId, newTeamName) => {
    showToast(`Ticket #${ticketId} transferred to ${newTeamName}.`);
    loadData();
  };

  return (
    <div className="w-full min-h-screen bg-[#090d14] text-slate-100 font-sans antialiased selection:bg-cyan-500/30 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="p-6 sm:p-7 rounded-2xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                Dynamic Capacity Dispatch
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-mono text-slate-400">
                {sortedSquads.length} Active Field Squads
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Maintenance Squads &amp; Dispatch Balancer
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Ranked dynamically by severity stress. Inspect backlog bottlenecks, monitor overdue SLA items, and rebalance dispatch queues across campus trades.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh Queues'}</span>
            </button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg(null)} className="cursor-pointer text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/60 text-xs font-semibold text-rose-300 flex items-center gap-2 shadow-xl">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Legend / Ranking Banner */}
      <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono font-bold">SORT ORDER:</span>
          <span className="text-slate-300">
            Squads with active SLA breaches and heavy work queues appear at the top.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span>Overdue Breaches</span>
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>On Hold (Parts)</span>
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>In Work</span>
          </span>
        </div>
      </div>

      {/* Line-by-Line Squad Roster */}
      <div className="space-y-4">
        {sortedSquads.map((squad, index) => {
          const isExpanded = expandedTeamId === squad.team_id;
          const rankLabel = index === 0 ? 'Highest Demand' : index === sortedSquads.length - 1 ? 'Optimal Capacity' : `#${index + 1}`;

          return (
            <div
              key={squad.team_id}
              className="rounded-2xl border border-white/[0.08] bg-[#0e131f]/80 backdrop-blur-md hover:border-white/[0.14] transition-all overflow-hidden shadow-xl"
            >
              {/* Squad Line Row Header */}
              <div
                className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                onClick={() => setExpandedTeamId(isExpanded ? null : squad.team_id)}
              >
                <div className="flex items-center gap-4 min-w-[260px]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/[0.08] bg-[#0b0f19]">
                    {CAMPUS_DEPT_ICONS[squad.department_name] || '🛠️'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {squad.team_name}
                      </h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${squad.capacityColor}`}>
                        {squad.capacityStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">
                        {squad.department_name}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        index === 0
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                          : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
                      }`}>
                        {rankLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges Line-by-Line Breakdown */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  {/* Overdue Badge */}
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                    squad.overdueCount > 0
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
                  }`}>
                    <span>⚠️ Overdue:</span>
                    <span className="font-bold">{squad.overdueCount}</span>
                  </div>

                  {/* On Hold Badge */}
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                    squad.onHoldCount > 0
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
                  }`}>
                    <span>⏳ On Hold:</span>
                    <span className="font-bold">{squad.onHoldCount}</span>
                  </div>

                  {/* In Progress Badge */}
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                    squad.inProgressCount > 0
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-bold'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-500'
                  }`}>
                    <span>🔧 In Work:</span>
                    <span className="font-bold">{squad.inProgressCount}</span>
                  </div>

                  {/* Total Active Queue Depth */}
                  <div className="px-3.5 py-1.5 rounded-xl border border-white/[0.08] bg-[#0b0f19] text-xs font-mono font-bold flex items-center gap-2 text-white">
                    <span className="text-slate-400">Active Queue:</span>
                    <span className="text-sm font-black text-cyan-400">{squad.totalActive}</span>
                  </div>

                  <button
                    type="button"
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1 shrink-0 ${
                      isExpanded
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{isExpanded ? 'Hide Queue' : 'Inspect Queue'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expanded Tickets Drawer */}
              {isExpanded && (
                <div className="p-5 border-t border-white/[0.08] space-y-4 bg-[#090d14] animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Active Work Orders Assigned to {squad.team_name} ({squad.activeTickets.length})
                    </h4>
                    <span className="text-[11px] font-mono text-slate-500">
                      Click "Reassign Squad" to transfer an incident
                    </span>
                  </div>

                  {squad.activeTickets.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border border-white/[0.06] bg-[#0b0f19] text-xs text-slate-400">
                      🎉 No active bottlenecks or pending work orders assigned to this squad.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {squad.activeTickets.map((t) => {
                        const isOverdue =
                          overdueTicketIds.has(t.id) ||
                          (t.sla_deadline && isDeadlineOverdue(t.sla_deadline));

                        return (
                          <div
                            key={t.id}
                            className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                              isOverdue
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                : 'bg-[#0b0f19] border-white/[0.08] text-slate-200'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs font-bold text-cyan-400">
                                  {t.tracking_code || `#${t.id}`}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <PriorityBadge priority={t.priority} dark={true} />
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                                    t.status === 'ON_HOLD'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                      : t.status === 'IN_PROGRESS'
                                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                      : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                                  }`}>
                                    {t.status}
                                  </span>
                                </div>
                              </div>

                              <h5 className="text-xs font-bold text-white">
                                {t.title}
                              </h5>

                              <p className="text-[11px] text-slate-400 line-clamp-2">
                                {t.description}
                              </p>

                              <div className="flex items-center gap-1 text-[11px] pt-1 text-slate-400 font-mono">
                                <MapPin size={12} className="text-cyan-400" />
                                <span className="truncate">{t.location}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                              <div>
                                {t.sla_deadline ? (
                                  <SLACountdownTimer
                                    slaDeadline={t.sla_deadline}
                                    status={t.status}
                                    resolvedAt={t.resolved_at}
                                    dark={true}
                                  />
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    SLA: Standard
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleOpenReassign(t)}
                                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <ArrowRightLeft size={12} />
                                <span>Reassign Squad</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reassign Team Modal */}
      {reassignModalOpen && reassignTicket && (
        <ReassignTeamModal
          isOpen={reassignModalOpen}
          onClose={() => {
            setReassignModalOpen(false);
            setReassignTicket(null);
          }}
          ticketId={reassignTicket.id}
          currentTeamId={reassignTicket.assigned_team_id}
          onReassignSuccess={handleReassignSuccess}
        />
      )}
    </div>
  );
}
