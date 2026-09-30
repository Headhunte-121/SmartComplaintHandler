/**
 * SmartComplaintHandler - Maintenance Squad Workload Panel
 * Blueprint Reference: V1/M4/frontend/03_team_workload_panel.md
 * Role: Responsive grid displaying squad capacity meters with dynamic color thresholds.
 */
import React, { useState, useEffect } from 'react';
import { fetchSquadWorkloads } from '../api/assignment';

export default function TeamWorkloadView({ onSelectSquad }) {
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWorkloads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSquadWorkloads();
      setWorkloads(data);
    } catch (err) {
      setError(err.message || 'Unable to fetch squad workloads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkloads();
  }, []);

  const MAX_CAPACITY = 10; // Standard nominal max ticket capacity per squad

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            Workload Balancing
          </span>
          <h2 className="text-base font-black text-slate-900 mt-1">
            Maintenance Squad Queue Capacities
          </h2>
          <p className="text-xs text-slate-500">
            Real-time queue depth monitoring across campus facility maintenance squads.
          </p>
        </div>
        <button
          onClick={loadWorkloads}
          disabled={loading}
          className="self-start sm:self-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh Queues</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {error}
        </div>
      )}

      {loading && workloads.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          Loading squad capacities...
        </div>
      ) : workloads.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No maintenance squads registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {workloads.map((squad) => {
            const ratio = Math.min(squad.active_ticket_count / MAX_CAPACITY, 1);
            const percent = Math.round(ratio * 100);

            let barColor = 'bg-emerald-500';
            let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            let statusText = 'Optimal Capacity';

            if (percent > 90) {
              barColor = 'bg-rose-500';
              badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              statusText = 'Overloaded';
            } else if (percent >= 70) {
              barColor = 'bg-amber-500';
              badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
              statusText = 'High Load';
            }

            return (
              <div
                key={squad.team_id}
                onClick={() => onSelectSquad && onSelectSquad(squad)}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate" title={squad.team_name}>
                      {squad.team_name}
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {squad.department_name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeColor}`}>
                    {statusText}
                  </span>
                </div>

                {/* Progress Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>Active Queue</span>
                    <span className="font-bold text-slate-900">{squad.active_ticket_count} tickets</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
