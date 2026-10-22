/**
 * SmartComplaintHandler - Maintenance Squad Workload Panel
 * Blueprint Reference: V1/M4/frontend/03_team_workload_panel.md
 * Role: Responsive grid displaying squad capacity meters with dynamic color thresholds and dual theme support.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { fetchSquadWorkloads } from '../api/assignment';

export default function TeamWorkloadView({ onSelectSquad }) {
  const { isDark } = useTheme();
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
    <div
      className={`rounded-xl border p-4 shadow-none space-y-4 transition-colors ${
        isDark ? 'bg-[#131D28] border-[#263545] text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
      }`}
    >
      <div
        className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4 ${
          isDark ? 'border-[#263545]' : 'border-slate-300'
        }`}
      >
        <div>
          <span
            className={`text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
              isDark
                ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                : 'text-emerald-800 bg-emerald-100 border-emerald-300'
            }`}
          >
            Workload Balancing
          </span>
          <h2 className={`text-base font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
            Maintenance Squad Queue Capacities
          </h2>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Real-time queue depth monitoring across campus facility maintenance squads.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            to="/squads"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 border ${
              isDark
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border-emerald-800'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <span>Squads Balancer</span>
            <span>→</span>
          </Link>
          <button
            onClick={loadWorkloads}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer border ${
              isDark
                ? 'bg-[#0e1117] hover:bg-[#263545] text-zinc-200 border-zinc-700'
                : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 border-slate-300'
            }`}
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Queues</span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className={`p-3 rounded-lg border text-xs ${
            isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800'
          }`}
        >
          {error}
        </div>
      )}

      {loading && workloads.length === 0 ? (
        <div className={`py-8 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          Loading squad capacities...
        </div>
      ) : workloads.length === 0 ? (
        <div className={`py-8 text-center text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
          No maintenance squads registered.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
          {workloads.map((squad) => {
            const ratio = Math.min(squad.active_ticket_count / MAX_CAPACITY, 1);
            const percent = Math.round(ratio * 100);

            let barColor = 'bg-emerald-500';
            let badgeClass = isDark
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300';
            let statusText = 'Optimal Capacity';

            if (percent > 90) {
              barColor = 'bg-rose-500';
              badgeClass = isDark
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : 'bg-rose-100 text-rose-800 border-rose-300';
              statusText = 'Overloaded';
            } else if (percent >= 70) {
              barColor = 'bg-amber-500';
              badgeClass = isDark
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'bg-amber-100 text-amber-800 border-amber-300';
              statusText = 'High Load';
            }

            return (
              <div
                key={squad.team_id}
                onClick={() => onSelectSquad && onSelectSquad(squad)}
                className={`p-3.5 rounded-xl border transition-all space-y-3 cursor-pointer ${
                  isDark
                    ? 'bg-[#0e1117] border-[#263545] hover:border-zinc-700 hover:bg-zinc-900/60'
                    : 'bg-[#e2e8f0] border-slate-300 hover:bg-[#cbd5e1]/60 hover:border-slate-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className={`text-xs font-bold truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}
                      title={squad.team_name}
                    >
                      {squad.team_name}
                    </h3>
                    <span className={`text-[10px] font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {squad.department_name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                    {statusText}
                  </span>
                </div>

                {/* Progress Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium">
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Active Queue</span>
                    <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                      {squad.active_ticket_count} tickets
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-2 overflow-hidden ${
                      isDark ? 'bg-[#263545]' : 'bg-slate-300'
                    }`}
                  >
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
