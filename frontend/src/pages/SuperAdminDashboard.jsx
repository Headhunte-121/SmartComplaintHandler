/**
 * SmartComplaintHandler - Directorate Executive Overview
 * High-level institutional telemetry, departmental health radar, campus digital twin
 * building fault distribution, and SLA exception monitoring for the Director / Chief Administrator.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAdmins } from '../api/auth';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import { getCampusBuildings } from '../data/iiitnrCampusData';

const CAMPUS_DEPARTMENTS = [
  'Electrical',
  'Plumbing',
  'Sanitation',
  'Carpentry',
  'IT Support',
  'General Administration',
];

const DEPT_ICONS = {
  Electrical: '⚡',
  Plumbing: '🚰',
  Sanitation: '🧹',
  Carpentry: '🪚',
  'IT Support': '💻',
  'General Administration': '🏛️',
};

export default function SuperAdminDashboard() {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminList, teamList, ticketList, breachList] = await Promise.all([
        fetchAdmins().catch(() => []),
        fetchSquadWorkloads().catch(() => []),
        fetchComplaints().catch(() => []),
        fetchActiveBreaches().catch(() => []),
      ]);
      setAdmins(Array.isArray(adminList) ? adminList : []);
      setTeams(Array.isArray(teamList) ? teamList : []);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      setBreaches(Array.isArray(breachList) ? breachList : []);
    } catch (err) {
      setError('Failed to load directorate executive telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Executive KPI Math
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter(
    (t) => t.status === 'SUBMITTED' || t.status === 'PENDING' || t.status === 'ASSIGNED'
  ).length;
  const inProgressTickets = tickets.filter(
    (t) => t.status === 'IN_PROGRESS' || t.status === 'ESCALATED'
  ).length;
  const resolvedTickets = tickets.filter(
    (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).length;
  const activeLoad = pendingTickets + inProgressTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100;

  const criticalTickets = tickets.filter(
    (t) =>
      (t.priority === 'CRITICAL' || t.hazard_detected) &&
      t.status !== 'RESOLVED' &&
      t.status !== 'CLOSED'
  ).length;

  const overdueBreaches = breaches.filter((b) => b.is_breached).length;
  const approachingBreaches = breaches.filter((b) => !b.is_breached).length;
  const slaCompliance =
    totalTickets > 0
      ? Math.max(0, Math.round(((totalTickets - overdueBreaches) / totalTickets) * 100))
      : 100;

  // Department distribution
  const departmentStats = useMemo(() => {
    return CAMPUS_DEPARTMENTS.map((dept) => {
      const deptTickets = tickets.filter((t) => t.department_name === dept);
      const active = deptTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
      ).length;
      const resolved = deptTickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length;
      const total = deptTickets.length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      const health = Math.max(65, 100 - active * 5);
      return {
        name: dept,
        icon: DEPT_ICONS[dept] || '🏢',
        total,
        active,
        resolved,
        rate,
        health,
      };
    });
  }, [tickets]);

  // Campus building distribution
  const buildingStats = useMemo(() => {
    const list = buildings.map((b) => {
      const matchedTickets = tickets.filter((t) => {
        const loc = (t.location || '').toLowerCase();
        return (
          loc.includes(b.name.toLowerCase()) ||
          loc.includes((b.shortName || '').toLowerCase()) ||
          loc.includes(b.id.toLowerCase())
        );
      });
      const active = matchedTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
      ).length;
      return {
        id: b.id,
        name: b.name,
        shortName: b.shortName || b.name,
        category: b.category,
        color: b.trace?.color || b.mapPin?.color || '#10b981',
        total: matchedTickets.length,
        active,
      };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [buildings, tickets]);

  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Directorate Executive Header */}
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
                Institutional Directorate Command
              </span>
              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>•</span>
              <span className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Executive Oversight
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Campus Facilities Directorate Overview
            </h1>
            <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              High-level institutional telemetry, cross-department operational stability, building fault density, and SLA exception monitoring across IIIT Naya Raipur.
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
              <span>{loading ? 'Refreshing...' : '🔄 Refresh Telemetry'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-8">
        {error && (
          <div className={`p-4 rounded-xl border text-xs font-bold ${
            isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            ⚠️ {error}
          </div>
        )}

        {/* Executive KPI Bento Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300 shadow-2xs'}`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Total Grievances
            </span>
            <span className={`text-2xl font-black block mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {totalTickets}
            </span>
            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Institutional Lifetime
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300 shadow-2xs'}`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Active Operations
            </span>
            <span className={`text-2xl font-black block mt-1 ${activeLoad > 0 ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-zinc-100' : 'text-slate-900')}`}>
              {activeLoad}
            </span>
            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {pendingTickets} Pending • {inProgressTickets} In-Work
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300 shadow-2xs'}`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Resolution Rate
            </span>
            <span className={`text-2xl font-black block mt-1 ${resolutionRate >= 80 ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-amber-400' : 'text-amber-700')}`}>
              {resolutionRate}%
            </span>
            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {resolvedTickets} Closed Tickets
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300 shadow-2xs'}`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              SLA Compliance
            </span>
            <span className={`text-2xl font-black block mt-1 ${overdueBreaches === 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : (isDark ? 'text-rose-400' : 'text-rose-600')}`}>
              {slaCompliance}%
            </span>
            <span className={`text-[11px] block mt-0.5 ${overdueBreaches > 0 ? 'text-rose-500 font-bold' : isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {overdueBreaches > 0 ? `⚠️ ${overdueBreaches} Overdue` : '✓ Zero Overdue'}
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300 shadow-2xs'}`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Field Squads
            </span>
            <span className={`text-2xl font-black block mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {teams.length}
            </span>
            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Active Balancing
            </span>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300 shadow-2xs'}`}>
            <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Staff &amp; Admins
            </span>
            <span className={`text-2xl font-black block mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {admins.length}
            </span>
            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              6 Departments
            </span>
          </div>
        </div>

        {/* Quick Command Navigators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/operations"
            className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 hover:border-emerald-600 text-zinc-100'
                : 'bg-white border-slate-300 hover:border-emerald-600 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl">🚨</span>
              <div>
                <h3 className="text-sm font-bold group-hover:text-emerald-500 transition-colors">
                  Operations Console
                </h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Live queue triage, priority overrides &amp; incident dispatch.
                </p>
              </div>
            </div>
            <span className="text-emerald-500 text-sm font-bold">→</span>
          </Link>

          <Link
            to="/squads"
            className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 hover:border-blue-600 text-zinc-100'
                : 'bg-white border-slate-300 hover:border-blue-600 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl">🛠️</span>
              <div>
                <h3 className="text-sm font-bold group-hover:text-blue-500 transition-colors">
                  Squads &amp; Dispatch
                </h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Line-by-line workload balancer ranked by bottleneck stress.
                </p>
              </div>
            </div>
            <span className="text-blue-500 text-sm font-bold">→</span>
          </Link>

          <Link
            to="/superadmin/staff"
            className={`p-5 rounded-2xl border transition-all flex items-center justify-between group ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 hover:border-purple-600 text-zinc-100'
                : 'bg-white border-slate-300 hover:border-purple-600 text-slate-900 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <span className="text-2xl">👥</span>
              <div>
                <h3 className="text-sm font-bold group-hover:text-purple-500 transition-colors">
                  Staff &amp; RBAC Directory
                </h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Authorize facility admins, squad leads &amp; manage access.
                </p>
              </div>
            </div>
            <span className="text-purple-500 text-sm font-bold">→</span>
          </Link>
        </div>

        {/* Department Health Radar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Departmental Infrastructure Health &amp; Operational Radar
              </h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Cross-functional telemetry tracking complaint volume, resolution percentages, and service stability across all 6 campus trades.
              </p>
            </div>
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-emerald-400' : 'bg-[#f1f5f9] border-slate-300 text-emerald-800'
            }`}>
              Live Radar Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentStats.map((dept) => (
              <div
                key={dept.name}
                className={`p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#161b22] border-zinc-800 hover:border-zinc-700 text-zinc-100'
                    : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{dept.icon}</span>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                        {dept.name}
                      </h3>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                        {dept.total} Total Grievances
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-mono font-bold ${dept.health >= 85 ? 'text-emerald-500' : dept.health >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {dept.health}/100 Health
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Active Workload:</span>
                    <span className={`font-mono font-bold ${dept.active > 0 ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-emerald-400' : 'text-emerald-700')}`}>
                      {dept.active} Active Faults
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Resolved on Campus:</span>
                    <span className={`font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                      {dept.resolved} ({dept.rate}%)
                    </span>
                  </div>

                  {/* Health Bar */}
                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.health >= 85 ? 'bg-emerald-500' : dept.health >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${dept.health}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campus Building Fault Distribution */}
        <div className="space-y-4">
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              Campus Digital Twin Infrastructure Density
            </h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Fault distribution and complaint density across Academic Complexes, Hostels, Amenity Centres, and Sports Grounds.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {buildingStats.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded-xl border transition-colors ${
                  isDark
                    ? 'bg-[#161b22] border-zinc-800 hover:border-zinc-700'
                    : 'bg-white border-slate-300 hover:border-slate-400 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <h4 className={`text-xs font-bold truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`} title={b.name}>
                      {b.shortName}
                    </h4>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-400' : 'bg-slate-50 border-slate-300 text-slate-600'
                  }`}>
                    {b.category}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Total Tickets:</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                    {b.total}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>Active Faults:</span>
                  <span className={`font-mono font-bold ${b.active > 0 ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-emerald-400' : 'text-emerald-700')}`}>
                    {b.active}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Breach Radar & Safety Hazard Alert Banner */}
        <div className={`p-6 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-300 shadow-sm'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                SLA Exception Radar &amp; Escalation Gate
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Real-time monitoring of campus tickets nearing or breaching contractual SLA limits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                overdueBreaches === 0
                  ? isDark
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse font-bold'
              }`}>
                {overdueBreaches === 0 ? '✓ Zero SLA Breaches' : `⚠️ ${overdueBreaches} Overdue Breaches`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Overdue Beyond SLA
              </span>
              <span className={`text-2xl font-black font-mono block mt-1 ${overdueBreaches > 0 ? 'text-rose-500' : isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {overdueBreaches}
              </span>
              <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Active breaches requiring supervisory intervention
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Approaching Breach Window
              </span>
              <span className={`text-2xl font-black font-mono block mt-1 ${approachingBreaches > 0 ? 'text-amber-500' : isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {approachingBreaches}
              </span>
              <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Tickets with &lt; 20% remaining SLA duration
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'}`}>
              <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                Critical Safety Breakdowns
              </span>
              <span className={`text-2xl font-black font-mono block mt-1 ${criticalTickets > 0 ? 'text-rose-500' : isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {criticalTickets}
              </span>
              <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Immediate hazards or 2-hour SLA items
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
