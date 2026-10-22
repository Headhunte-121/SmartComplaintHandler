/**
 * SmartComplaintHandler - SLA Breach Escalation Panel
 * Blueprint Reference: V1/M5/frontend/04_sla_breach_table.md
 * Role: Supervisory exception monitoring workstation surfacing overdue and near-breach tickets with dual theme styling.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { fetchActiveBreaches } from '../api/sla';
import PriorityBadge from './PriorityBadge';

export default function SLABreachTable({
  onEscalate,
  onReassign,
  refreshInterval = 30000,
}) {
  const { isDark } = useTheme();
  const [breaches, setBreaches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTier, setFilterTier] = useState('ALL'); // 'ALL' | 'BREACHED' | 'APPROACHING'
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [error, setError] = useState(null);

  const loadBreaches = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchActiveBreaches();
      setBreaches(data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch active SLA breaches.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load and automated background polling
  useEffect(() => {
    loadBreaches();
    const timer = setInterval(loadBreaches, refreshInterval);
    return () => clearInterval(timer);
  }, [loadBreaches, refreshInterval]);

  const overdueCount = breaches.filter((b) => b.is_breached).length;
  const approachingCount = breaches.filter((b) => !b.is_breached).length;

  const filteredBreaches = breaches.filter((b) => {
    if (filterTier === 'BREACHED') return b.is_breached;
    if (filterTier === 'APPROACHING') return !b.is_breached;
    return true;
  });

  const formatDuration = (item) => {
    if (item.is_breached) {
      const hours = Math.floor(item.overdue_seconds / 3600);
      const minutes = Math.floor((item.overdue_seconds % 3600) / 60);
      return `${hours}h ${minutes}m overdue`;
    }
    const hours = Math.floor(item.remaining_seconds / 3600);
    const minutes = Math.floor((item.remaining_seconds % 3600) / 60);
    if (hours === 0) {
      return `${minutes}m remaining`;
    }
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-none transition-colors ${
        isDark ? 'bg-[#131D28] border-[#263545] text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div
        className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5 ${
          isDark ? 'border-[#263545]' : 'border-slate-300'
        }`}
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Active SLA Escalations &amp; Breaches
            </h3>
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {overdueCount} Overdue
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  isDark
                    ? 'border-emerald-800 bg-emerald-950/60 text-emerald-300'
                    : 'border-emerald-300 bg-emerald-100 text-emerald-800'
                }`}
              >
                0 Overdue
              </span>
            )}
          </div>
          <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Exception-based supervisory monitoring &bull; Refreshed at{' '}
            {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBreaches}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs disabled:opacity-50 cursor-pointer transition-colors ${
              isDark
                ? 'bg-[#0B1119] hover:bg-zinc-800 text-zinc-200 border-zinc-700'
                : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 border-slate-300'
            }`}
            title="Refresh breach queue"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-400' : isDark ? 'text-zinc-400' : 'text-slate-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isLoading ? 'Polling...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div
        className={`mt-4 flex items-center gap-2 border-b pb-3 ${
          isDark ? 'border-[#263545]' : 'border-slate-300'
        }`}
      >
        <button
          type="button"
          onClick={() => setFilterTier('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filterTier === 'ALL'
              ? isDark
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'bg-slate-900 text-white'
              : isDark
              ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              : 'text-slate-600 hover:bg-[#cbd5e1]/50 hover:text-slate-900'
          }`}
        >
          All High-Risk ({breaches.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier('BREACHED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filterTier === 'BREACHED'
              ? 'bg-rose-600 text-white'
              : isDark
              ? 'text-rose-400 hover:bg-rose-950/40'
              : 'text-rose-700 hover:bg-rose-100'
          }`}
        >
          Overdue Breaches ({overdueCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier('APPROACHING')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            filterTier === 'APPROACHING'
              ? 'bg-amber-600 text-white'
              : isDark
              ? 'text-amber-400 hover:bg-amber-950/40'
              : 'text-amber-700 hover:bg-amber-100'
          }`}
        >
          Approaching Breach ({approachingCount})
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className={`mt-4 rounded-xl border p-3 text-xs ${
            isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800'
          }`}
        >
          {error}
        </div>
      )}

      {/* Content Area */}
      <div className="mt-4">
        {breaches.length === 0 && !isLoading ? (
          /* Zero-Breach Empty State Callout */
          <div
            className={`rounded-2xl border p-10 text-center transition-colors ${
              isDark ? 'border-emerald-800/60 bg-emerald-950/20' : 'border-emerald-300 bg-emerald-50/70'
            }`}
          >
            <div
              className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                isDark ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Zero Active SLA Breaches
            </h4>
            <p className={`mt-1 text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              All campus maintenance queues are operating smoothly within target commitments.
            </p>
          </div>
        ) : filteredBreaches.length === 0 && !isLoading ? (
          <div className={`py-8 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
            No complaints match the selected filter criteria.
          </div>
        ) : (
          /* Table of Breached and Nearing-Breach Tickets */
          <div
            className={`overflow-x-auto rounded-xl border transition-colors ${
              isDark ? 'border-[#263545] bg-[#0B1119]' : 'border-slate-300 bg-white'
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead
                className={`border-b text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  isDark ? 'border-[#263545] bg-[#111923] text-zinc-400' : 'border-slate-300 bg-[#e2e8f0] text-slate-700'
                }`}
              >
                <tr>
                  <th className="px-3 py-2.5">Tracking Code</th>
                  <th className="px-3 py-2.5">Issue &amp; Location</th>
                  <th className="px-3 py-2.5">Department &amp; Squad</th>
                  <th className="px-3 py-2.5">Priority</th>
                  <th className="px-3 py-2.5">SLA Status</th>
                  <th className="px-3 py-2.5 text-right">Supervisory Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                {filteredBreaches.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-zinc-800/40 text-zinc-200' : 'hover:bg-[#cbd5e1]/40 text-slate-800'
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            ticket.is_breached ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <span className={`font-mono font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                          {ticket.tracking_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 max-w-xs">
                      <div
                        className={`font-semibold truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}
                        title={ticket.title}
                      >
                        {ticket.title}
                      </div>
                      {ticket.location && (
                        <div
                          className={`flex items-center gap-1 text-[11px] truncate ${
                            isDark ? 'text-zinc-400' : 'text-slate-600'
                          }`}
                        >
                          <svg className="h-3 w-3 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{ticket.location}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className={`font-medium ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                        {ticket.department_name || 'Unassigned'}
                      </div>
                      <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        {ticket.assigned_team_name || 'No Squad Assigned'}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {ticket.is_breached ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-500 animate-pulse">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(ticket)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(ticket)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onEscalate && (
                          <button
                            type="button"
                            onClick={() => onEscalate(ticket)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                              isDark
                                ? 'border-amber-700/60 bg-amber-950/60 text-amber-300 hover:bg-amber-900/60'
                                : 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            Escalate
                          </button>
                        )}
                        {onReassign && (
                          <button
                            type="button"
                            onClick={() => onReassign(ticket)}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                              isDark
                                ? 'border-indigo-700/60 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/60'
                                : 'border-indigo-300 bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                            }`}
                          >
                            Reassign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
