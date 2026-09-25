/**
 * SmartComplaintHandler - SLA Breach Escalation Panel
 * Blueprint Reference: V1/M5/frontend/04_sla_breach_table.md
 * Role: Supervisory exception monitoring workstation surfacing overdue and near-breach tickets.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { fetchActiveBreaches } from '../api/sla';
import PriorityBadge from './PriorityBadge';

export default function SLABreachTable({
  onEscalate,
  onReassign,
  refreshInterval = 30000,
}) {
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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900">
              Active SLA Escalations & Breaches
            </h3>
            {overdueCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                {overdueCount} Overdue
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                0 Overdue
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Exception-based supervisory monitoring &bull; Refreshed at{' '}
            {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBreaches}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
            title="Refresh breach queue"
          >
            <svg
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`}
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
      <div className="mt-4 flex items-center gap-2 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setFilterTier('ALL')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterTier === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All High-Risk ({breaches.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier('BREACHED')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterTier === 'BREACHED'
              ? 'bg-rose-600 text-white'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          Overdue Breaches ({overdueCount})
        </button>
        <button
          type="button"
          onClick={() => setFilterTier('APPROACHING')}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterTier === 'APPROACHING'
              ? 'bg-amber-600 text-white'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          Approaching Breach ({approachingCount})
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Content Area */}
      <div className="mt-4">
        {breaches.length === 0 && !isLoading ? (
          /* Zero-Breach Empty State Callout */
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-900">Zero Active SLA Breaches</h4>
            <p className="mt-1 text-xs text-slate-500">
              All campus maintenance queues are operating smoothly within target commitments.
            </p>
          </div>
        ) : filteredBreaches.length === 0 && !isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No complaints match the selected filter criteria.
          </div>
        ) : (
          /* Table of Breached and Nearing-Breach Tickets */
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Tracking Code</th>
                  <th className="px-4 py-3">Issue & Location</th>
                  <th className="px-4 py-3">Department & Squad</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SLA Status</th>
                  <th className="px-4 py-3 text-right">Supervisory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBreaches.map((ticket) => (
                  <tr key={ticket.ticket_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            ticket.is_breached ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        />
                        <span className="font-mono font-bold text-slate-800">
                          {ticket.tracking_code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={ticket.title}>
                        {ticket.title}
                      </div>
                      {ticket.location && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                          <svg className="h-3 w-3 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{ticket.location}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">{ticket.department_name || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-500">{ticket.assigned_team_name || 'No Squad Assigned'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ticket.is_breached ? (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 animate-pulse">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(ticket)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(ticket)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onEscalate && (
                          <button
                            type="button"
                            onClick={() => onEscalate(ticket)}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                          >
                            Escalate
                          </button>
                        )}
                        {onReassign && (
                          <button
                            type="button"
                            onClick={() => onReassign(ticket)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
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
