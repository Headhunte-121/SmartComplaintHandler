/**
 * SmartComplaintHandler - Maintenance Squads & Workload Balancer
 * Line-by-line squad roster ranked dynamically by issue severity (Most Issues at Top, Least at Bottom)
 * Supports supervisory queue inspection and live squad load rebalancing.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import ReassignTeamModal from '../components/ReassignTeamModal';
import SLACountdownTimer from '../components/SLACountdownTimer';

const CAMPUS_DEPT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🚰',
  Sanitation: '🧹',
  Carpentry: '🪚',
  'IT Support': '💻',
  'General Administration': '🏛️',
};

export default function SquadsPage() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Expanded squad ID for detail view
  const [expandedTeamId, setExpandedTeamId] = useState(null);

  // Reassign modal state
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

  // Build enhanced squad objects and sort dynamically: MOST ISSUES AT TOP, LEAST AT BOTTOM
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
          (t.sla_deadline && new Date(t.sla_deadline) < new Date())
      );
      const onHoldTickets = activeTickets.filter((t) => t.status === 'ON_HOLD');
      const inProgressTickets = activeTickets.filter(
        (t) => t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
      );
      const submittedTickets = activeTickets.filter(
        (t) => t.status === 'SUBMITTED' || t.status === 'ASSIGNED' || t.status === 'PENDING'
      );

      // Issues score: overdue counts highest (weight 4), on-hold (weight 2), backlog (weight 1)
      const issuesScore =
        overdueTickets.length * 4 + onHoldTickets.length * 2 + activeTickets.length;

      let capacityStatus = 'Optimal Capacity';
      let capacityColor = isDark ? 'text-emerald-400 border-emerald-800 bg-emerald-950/40' : 'text-emerald-800 border-emerald-300 bg-emerald-50';

      if (overdueTickets.length > 0 || activeTickets.length >= 6) {
        capacityStatus = 'Critical Backlog';
        capacityColor = isDark ? 'text-rose-400 border-rose-800 bg-rose-950/40 animate-pulse' : 'text-rose-800 border-rose-300 bg-rose-50';
      } else if (onHoldTickets.length > 0 || activeTickets.length >= 3) {
        capacityStatus = 'Heavy Load';
        capacityColor = isDark ? 'text-amber-400 border-amber-800 bg-amber-950/40' : 'text-amber-800 border-amber-300 bg-amber-50';
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

    // Sort descending by issuesScore (most issues first, least issues at the bottom)
    return enhanced.sort((a, b) => b.issuesScore - a.issuesScore);
  }, [teams, tickets, overdueTicketIds, isDark]);

  const handleOpenReassign = (ticket) => {
    setReassignTicket(ticket);
    setReassignModalOpen(true);
  };

  const handleReassignSuccess = (ticketId, newTeamName) => {
    showToast(`Ticket #${ticketId} transferred to ${newTeamName}.`);
    loadData();
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Hero Header */}
      <div
        className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden transition-colors ${
          isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xs'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                isDark ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-800'
              }`}>
                Dynamic Capacity Dispatch
              </span>
              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>•</span>
              <span className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {sortedSquads.length} Active Field Squads
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Maintenance Squads &amp; Dispatch Balancer
            </h1>
            <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Ranked line-by-line from highest workload stress to least. Inspect bottlenecks, monitor overdue SLA items, and rebalance dispatch queues across campus trades.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
              }`}
            >
              <span>{loading ? 'Refreshing...' : '🔄 Refresh Queues'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        {toastMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs ${
              isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>✓ {toastMsg}</span>
            <button type="button" onClick={() => setToastMsg(null)} className="font-bold cursor-pointer hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-xl border text-xs font-bold ${
            isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            ⚠️ {error}
          </div>
        )}

        {/* Legend / Ranking Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">📌</span>
            <span className={`font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
              Sorted by Priority Demand: Squads with Overdue breaches and heavy backlogs appear at the top.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Overdue Breaches</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>On Hold (Parts)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>In Work</span>
            </span>
          </div>
        </div>

        {/* Line-by-Line Squad Roster */}
        <div className="space-y-4">
          {sortedSquads.map((squad, index) => {
            const isExpanded = expandedTeamId === squad.team_id;
            const rankLabel = index === 0 ? 'Highest Demand' : index === sortedSquads.length - 1 ? 'Optimal Free Capacity' : `#${index + 1}`;

            return (
              <div
                key={squad.team_id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isDark
                    ? 'bg-[#161b22] border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-xs'
                }`}
              >
                {/* Squad Line Row Header */}
                <div
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                  onClick={() => setExpandedTeamId(isExpanded ? null : squad.team_id)}
                >
                  <div className="flex items-center gap-4 min-w-[260px]">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {CAMPUS_DEPT_ICONS[squad.department_name] || '🛠️'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          {squad.team_name}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${squad.capacityColor}`}>
                          {squad.capacityStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          {squad.department_name}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          index === 0
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold'
                            : isDark
                            ? 'bg-zinc-800/60 border-zinc-700 text-zinc-400'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
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
                        ? isDark
                          ? 'bg-rose-950/60 border-rose-800 text-rose-300 font-bold'
                          : 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                        : isDark
                        ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <span>⚠️ Overdue:</span>
                      <span className="font-bold">{squad.overdueCount}</span>
                    </div>

                    {/* On Hold Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                      squad.onHoldCount > 0
                        ? isDark
                          ? 'bg-amber-950/60 border-amber-800 text-amber-300 font-bold'
                          : 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                        : isDark
                        ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <span>⏳ On Hold:</span>
                      <span className="font-bold">{squad.onHoldCount}</span>
                    </div>

                    {/* In Progress Badge */}
                    <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 ${
                      squad.inProgressCount > 0
                        ? isDark
                          ? 'bg-blue-950/60 border-blue-800 text-blue-300 font-bold'
                          : 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                        : isDark
                        ? 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <span>🔧 In Work:</span>
                      <span className="font-bold">{squad.inProgressCount}</span>
                    </div>

                    {/* Total Active Queue Depth */}
                    <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${
                      isDark ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200' : 'bg-slate-100 border-slate-300 text-slate-900'
                    }`}>
                      <span>Active Queue:</span>
                      <span className="text-sm font-black">{squad.totalActive}</span>
                    </div>

                    <button
                      type="button"
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1 shrink-0 ${
                        isExpanded
                          ? isDark
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : isDark
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Tickets ▴' : 'View Tickets ▾'}</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Tickets Drawer */}
                {isExpanded && (
                  <div className={`p-5 border-t space-y-4 animate-fade-in ${
                    isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        Active Work Orders Assigned to {squad.team_name} ({squad.activeTickets.length})
                      </h4>
                      <span className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                        Click "Reassign" to shift tickets to an available squad.
                      </span>
                    </div>

                    {squad.activeTickets.length === 0 ? (
                      <div className={`text-center py-8 rounded-xl border text-xs ${
                        isDark ? 'border-zinc-800 text-zinc-500' : 'border-slate-200 text-slate-500'
                      }`}>
                        🎉 No active bottlenecks or pending work orders assigned to this squad.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {squad.activeTickets.map((t) => {
                          const isOverdue =
                            overdueTicketIds.has(t.id) ||
                            (t.sla_deadline && new Date(t.sla_deadline) < new Date());

                          return (
                            <div
                              key={t.id}
                              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                                isOverdue
                                  ? isDark
                                    ? 'bg-rose-950/20 border-rose-800/60'
                                    : 'bg-rose-50/60 border-rose-300'
                                  : isDark
                                  ? 'bg-[#161b22] border-zinc-800'
                                  : 'bg-white border-slate-200 shadow-2xs'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs font-bold text-emerald-400">
                                    {t.tracking_code || `#${t.id}`}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <PriorityBadge priority={t.priority} />
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                      t.status === 'ON_HOLD'
                                        ? isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-300'
                                        : t.status === 'IN_PROGRESS'
                                        ? isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-300'
                                        : isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                                    }`}>
                                      {t.status}
                                    </span>
                                  </div>
                                </div>

                                <h5 className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                                  {t.title}
                                </h5>

                                <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                                  {t.description}
                                </p>

                                <div className="flex items-center gap-1 text-[11px] pt-1 text-slate-400">
                                  <span>📍</span>
                                  <span className="truncate">{t.location}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-inherit">
                                <div>
                                  {t.sla_deadline ? (
                                    <SLACountdownTimer deadline={t.sla_deadline} status={t.status} />
                                  ) : (
                                    <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                      SLA: Standard
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleOpenReassign(t)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isDark
                                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                                      : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                                  }`}
                                >
                                  🔄 Reassign Squad
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
