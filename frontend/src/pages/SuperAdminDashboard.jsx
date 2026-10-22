/**
 * SmartComplaintHandler - Campus Facilities Directorate Overview
 * Style: Dark Enterprise Operations Dashboard (Command Center)
 * Reference: Executive Oversight telemetry, departmental operational stability,
 * building fault density, and SLA exception monitoring across IIIT Naya Raipur.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAdmins } from '../api/auth';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import { getCampusBuildings } from '../data/iiitnrCampusData';
import {
  Activity, AlertTriangle, BarChart3, Building2,
  CheckCircle2, ChevronRight, Clock3, Compass, LayoutDashboard,
  Map as MapIcon, ClipboardList, RefreshCw, Search, ShieldCheck, UsersRound, Wrench,
} from 'lucide-react';


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

function TrendChart({ data, isDark }) {
  const width = 720;
  const height = 220;
  const inset = { top: 16, right: 12, bottom: 28, left: 12 };
  const plotWidth = width - inset.left - inset.right;
  const plotHeight = height - inset.top - inset.bottom;
  const peak = Math.max(1, ...data.flatMap((item) => [item.filed, item.resolved]));
  const toPoints = (key) => data.map((item, index) => {
    const x = inset.left + (data.length === 1 ? 0 : (index / (data.length - 1)) * plotWidth);
    const y = inset.top + plotHeight - (item[key] / peak) * plotHeight;
    return `${x},${y}`;
  }).join(' ');
  const filedPoints = toPoints('filed');
  const resolvedPoints = toPoints('resolved');
  const labels = [data[0], data[Math.floor((data.length - 1) / 2)], data[data.length - 1]];

  return (
    <div className="w-full" role="img" aria-label={`Ticket activity over the last ${data.length} days: ${data.reduce((n, d) => n + d.filed, 0)} filed and ${data.reduce((n, d) => n + d.resolved, 0)} resolved`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" aria-hidden="true">
        {[0, 0.5, 1].map((fraction) => {
          const y = inset.top + plotHeight * fraction;
          return <line key={fraction} x1={inset.left} x2={width - inset.right} y1={y} y2={y} stroke={isDark ? '#334155' : '#e2e8f0'} strokeDasharray="4 6" />;
        })}
        <polyline points={filedPoints} fill="none" stroke={isDark ? '#818cf8' : '#4f46e5'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={resolvedPoints} fill="none" stroke={isDark ? '#2dd4bf' : '#0d9488'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const x = inset.left + (data.length === 1 ? 0 : (index / (data.length - 1)) * plotWidth);
          const filedY = inset.top + plotHeight - (item.filed / peak) * plotHeight;
          return item.filed > 0 ? <circle key={`filed-${index}`} cx={x} cy={filedY} r="3" fill={isDark ? '#141b2d' : '#ffffff'} stroke={isDark ? '#818cf8' : '#4f46e5'} strokeWidth="2" /> : null;
        })}
        {labels.map((item, index) => {
          const sourceIndex = index === 0 ? 0 : index === 1 ? Math.floor((data.length - 1) / 2) : data.length - 1;
          const x = inset.left + (data.length === 1 ? 0 : (sourceIndex / (data.length - 1)) * plotWidth);
          return <text key={`${item.label}-${index}`} x={x} y={height - 4} textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'} fill={isDark ? '#94a3b8' : '#64748b'} fontSize="11" fontWeight="500">{item.label}</text>;
        })}
      </svg>
    </div>
  );
}

function StatusRing({ total, active, resolved, isDark }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(1, total);
  const resolvedLength = (resolved / safeTotal) * circumference;
  const activeLength = (active / safeTotal) * circumference;
  const otherLength = total > 0 ? Math.max(0, circumference - resolvedLength - activeLength) : 0;
  return (
    <div className="relative h-36 w-36 shrink-0" role="img" aria-label={`${total} tickets: ${active} active and ${resolved} resolved`}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={radius} fill="none" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="12" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={isDark ? '#2dd4bf' : '#14b8a6'} strokeWidth="12" strokeDasharray={`${resolvedLength} ${circumference - resolvedLength}`} strokeDashoffset="0" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={isDark ? '#818cf8' : '#4f46e5'} strokeWidth="12" strokeDasharray={`${activeLength} ${circumference - activeLength}`} strokeDashoffset={-resolvedLength} />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray={`${otherLength} ${circumference - otherLength}`} strokeDashoffset={-(resolvedLength + activeLength)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{total}</span>
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">total tickets</span>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trendRange, setTrendRange] = useState(14);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
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
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to refresh directorate executive telemetry. Check network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0;

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
      ? Math.max(0, Math.min(100, Math.round(((totalTickets - overdueBreaches) / totalTickets) * 100)))
      : 100;

  const ticketTrend = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: trendRange }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (trendRange - index - 1));
      return { date, label: date.toLocaleDateString([], { month: 'short', day: 'numeric' }), filed: 0, resolved: 0 };
    });
    const byDay = new Map(days.map((day) => [day.date.toDateString(), day]));
    tickets.forEach((ticket) => {
      const created = ticket.created_at ? new Date(ticket.created_at) : null;
      const resolved = ticket.resolved_at ? new Date(ticket.resolved_at) : null;
      const filedDay = created && !Number.isNaN(created.getTime()) ? byDay.get(new Date(created.getFullYear(), created.getMonth(), created.getDate()).toDateString()) : null;
      const resolvedDay = resolved && !Number.isNaN(resolved.getTime()) ? byDay.get(new Date(resolved.getFullYear(), resolved.getMonth(), resolved.getDate()).toDateString()) : null;
      if (filedDay) filedDay.filed += 1;
      if (resolvedDay) resolvedDay.resolved += 1;
    });
    return days;
  }, [tickets, trendRange]);

  const trendTotal = ticketTrend.reduce((sum, day) => sum + day.filed, 0);
  const trendResolved = ticketTrend.reduce((sum, day) => sum + day.resolved, 0);

  // Department distribution with authentic health score
  const departmentStats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const depts = query
      ? CAMPUS_DEPARTMENTS.filter((dept) => dept.toLowerCase().includes(query))
      : CAMPUS_DEPARTMENTS;
    return depts.map((dept) => {
      const deptTickets = tickets.filter((t) => t.department_name === dept);
      const active = deptTickets.filter(
        (t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED'
      ).length;
      const resolved = deptTickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length;
      const total = deptTickets.length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      
      // Health calculation: 100 if zero active, drops with backlog severity
      const penalty = active * 6 + (active > 3 ? 12 : 0);
      const health = Math.max(55, Math.min(100, 100 - penalty));

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
  }, [tickets, searchQuery]);

  // Campus building distribution
  const buildingStats = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchedBuildings = query
      ? buildings.filter((b) => b.name.toLowerCase().includes(query) || (b.shortName || '').toLowerCase().includes(query) || b.id.toLowerCase().includes(query))
      : buildings;
    const list = matchedBuildings.map((b) => {
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
        category: b.category || 'FACILITY',
        color: b.trace?.color || b.mapPin?.color || '#00B386',
        total: matchedTickets.length,
        active,
      };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [buildings, tickets, searchQuery]);

  const handleFacilityClick = (building) => {
    navigate(`/track?search=${encodeURIComponent(building.shortName)}`);
  };

  const navItems = [
    { to: '/superadmin', label: 'Directorate desk', icon: Compass },
    { to: '/operations', label: 'Operations console', icon: LayoutDashboard },
    { to: '/superadmin/staff', label: 'Staff directory', icon: ShieldCheck },
    { to: '/squads', label: 'Squad capacity', icon: UsersRound },
    { to: '/map', label: 'Campus twin', icon: MapIcon },
    { to: '/track', label: 'Track & audit', icon: ClipboardList },
  ];

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${isDark ? 'bg-[#090d14] text-slate-100 selection:bg-indigo-500/40' : 'bg-[#f4f7fc] text-slate-900 selection:bg-indigo-100'}`}>
      <div className="mx-auto flex min-h-screen max-w-[1850px]">
        {/* Directorate Dedicated PC Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-white/[0.08] dark:bg-[#0d121b] lg:flex">
          {/* Brand Header */}
          <Link to="/superadmin" className="mb-6 flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_0_24px_rgba(99,102,241,.3)] dark:from-indigo-400 dark:to-violet-400 dark:text-indigo-950">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">IIIT-NR</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Directorate Desk</div>
            </div>
          </Link>

          {/* Quick Search */}
          <label className="relative mb-4 block">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campus telemetry"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400/60 dark:focus:ring-indigo-400/10"
            />
          </label>

          {/* Executive Quick Stats */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            <Link
              to="/operations"
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left transition hover:border-indigo-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:bg-white/[0.06]"
            >
              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">Active Load</span>
              <b className="mt-1 block text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {loading ? '—' : activeLoad}
              </b>
            </Link>
            <Link
              to="/operations"
              className={`rounded-xl border p-2.5 text-left transition ${
                overdueBreaches > 0
                  ? 'border-rose-200 bg-rose-50/70 hover:bg-rose-50 dark:border-rose-400/20 dark:bg-rose-400/[0.04] dark:hover:bg-rose-400/[0.08]'
                  : 'border-slate-200 bg-slate-50 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.025] dark:hover:bg-white/[0.06]'
              }`}
            >
              <span className={`block text-[10px] font-medium ${overdueBreaches > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>
                SLA Overdue
              </span>
              <b className={`mt-1 block text-lg font-bold tracking-tight ${overdueBreaches > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {loading ? '—' : overdueBreaches}
              </b>
            </Link>
          </div>

          {/* Workspaces Navigation */}
          <nav className="space-y-1" aria-label="Directorate navigation">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
              Executive Workspaces
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                    active
                      ? 'border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/15 dark:text-indigo-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.045] dark:hover:text-slate-100'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Footer Controls & User Card */}
          <div className="mt-auto space-y-2.5 border-t border-slate-200 pt-4 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white hover:text-slate-900 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white cursor-pointer"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <span className="flex items-center gap-2">
                <span>{isDark ? '🌙' : '☀️'}</span>
                <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
              </span>
              <span className="rounded-md bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Toggle
              </span>
            </button>

            <div className="flex items-center gap-2.5 px-2 pt-1">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
                {(currentUser?.name || 'D').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-200">
                  {currentUser?.name || 'Executive Director'}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {currentUser?.roleLabel || 'Directorate · Super Admin'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 space-y-6">
          <header className="flex flex-col justify-between gap-5 rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-[0_18px_50px_-25px_rgba(67,85,219,.65)] transition-colors dark:border dark:border-indigo-400/20 dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#312e81] dark:shadow-[0_18px_55px_-25px_rgba(0,0,0,.9)] sm:p-8 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo-50">
                <ShieldCheck size={14} /> DIRECTORATE OVERVIEW
                {lastUpdated && <span className="ml-1 text-indigo-100/80">· Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Campus operations, at a glance</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Monitor service health, resolve bottlenecks, and spot campus issues before they escalate.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/operations" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                <LayoutDashboard size={16} /> Operations console
              </Link>
              <Link to="/superadmin/staff" className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                <UsersRound size={16} /> Staff directory
              </Link>
              <button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60 dark:bg-indigo-100 dark:text-indigo-950 dark:hover:bg-white cursor-pointer">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Refreshing' : 'Refresh data'}
              </button>
            </div>
          </header>

        {error && <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"><span>{error}</span><button onClick={loadData} className="font-semibold underline">Retry</button></div>}

        <section aria-label="Executive metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {[
            { label: 'All requests', value: totalTickets, detail: 'Across campus', icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 dark:text-indigo-300' },
            { label: 'Needs attention', value: activeLoad, detail: `${pendingTickets} waiting · ${inProgressTickets} in progress`, icon: Activity, color: 'text-amber-700 bg-amber-50 dark:bg-amber-500/20 dark:text-amber-300' },
            { label: 'Resolved', value: `${resolutionRate}%`, detail: `${resolvedTickets} requests completed`, icon: CheckCircle2, color: 'text-teal-700 bg-teal-50 dark:bg-teal-500/20 dark:text-teal-300' },
            { label: 'SLA on track', value: `${slaCompliance}%`, detail: overdueBreaches ? `${overdueBreaches} overdue` : 'No active breaches', icon: Clock3, color: overdueBreaches ? 'text-rose-700 bg-rose-50 dark:bg-rose-500/20 dark:text-rose-300' : 'text-teal-700 bg-teal-50 dark:bg-teal-500/20 dark:text-teal-300' },
            { label: 'Field teams', value: teams.length, detail: `${admins.length} staff and admins`, icon: UsersRound, color: 'text-violet-700 bg-violet-50 dark:bg-violet-500/20 dark:text-violet-300' },
          ].map((metric) => {
            const Icon = metric.icon;
            return <article key={metric.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_12px_rgba(30,41,59,.035)] dark:border-slate-800 dark:bg-[#141b2d] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.label}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${metric.color}`}><Icon size={18} /></span>
              </div>
              <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{loading ? '—' : metric.value}</div>
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{metric.detail}</p>
            </article>;
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(310px,.9fr)]" aria-label="Ticket trends and status">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(30,41,59,.035)] dark:border-slate-800 dark:bg-[#141b2d] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <BarChart3 size={17} className="text-indigo-600 dark:text-indigo-400" /> Request activity
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Requests filed and resolved over time</p>
              </div>
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {[14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setTrendRange(days)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      trendRange === days
                        ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6"><TrendChart data={ticketTrend} isDark={isDark} /></div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex items-center gap-5 text-xs">
                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <i className="h-2.5 w-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400" /> Filed <b className="text-slate-900 dark:text-white">{loading ? '—' : trendTotal}</b>
                </span>
                <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <i className="h-2.5 w-2.5 rounded-full bg-teal-500 dark:bg-teal-400" /> Resolved <b className="text-slate-900 dark:text-white">{loading ? '—' : trendResolved}</b>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Based on request timestamps</span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(30,41,59,.035)] dark:border-slate-800 dark:bg-[#141b2d] sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Activity size={17} className="text-indigo-600 dark:text-indigo-400" /> Request status
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current distribution across all requests</p>
            <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:justify-around">
              <StatusRing total={totalTickets} active={activeLoad} resolved={resolvedTickets} isDark={isDark} />
              <div className="w-full space-y-3 sm:max-w-[170px]">
                {[
                  { label: 'Active', value: activeLoad, color: 'bg-indigo-600 dark:bg-indigo-400' },
                  { label: 'Resolved', value: resolvedTickets, color: 'bg-teal-500 dark:bg-teal-400' },
                  { label: 'Other', value: Math.max(0, totalTickets - activeLoad - resolvedTickets), color: 'bg-amber-400 dark:bg-amber-300' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <i className={`h-2.5 w-2.5 rounded-full ${item.color}`} />{item.label}
                    </span>
                    <b className="text-slate-900 dark:text-white">{loading ? '—' : item.value}</b>
                  </div>
                ))}
              </div>
            </div>
            <Link to="/operations" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
              Open operations queue <ChevronRight size={14} />
            </Link>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2" aria-label="Department and campus health">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(30,41,59,.035)] dark:border-slate-800 dark:bg-[#141b2d] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Department workload</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Active requests and resolution rate by team</p>
              </div>
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{departmentStats.length} teams</span>
            </div>
            <div className="mt-5 space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {dept.icon} <span className="ml-1">{dept.name}</span>
                    </span>
                    <span className="shrink-0 text-slate-500 dark:text-slate-400">
                      {dept.total ? `${dept.active} active` : 'No requests'}
                      <b className="ml-2 text-slate-900 dark:text-slate-100">{dept.total ? `${dept.rate}% resolved` : ''}</b>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${Math.max(2, dept.rate)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(30,41,59,.035)] dark:border-slate-800 dark:bg-[#141b2d] sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Campus issue hotspots</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Buildings with the most reported issues</p>
              </div>
              <Building2 size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {buildingStats.filter((building) => building.total > 0).slice(0, 5).map((building, index) => {
                const max = Math.max(1, buildingStats[0]?.total || 0);
                return (
                  <button key={building.id} type="button" onClick={() => handleFacilityClick(building)} className="group flex w-full items-center gap-3 py-3 text-left cursor-pointer">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-200 dark:group-hover:text-indigo-300">{building.shortName}</span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <span className="block h-full rounded-full bg-indigo-500 dark:bg-indigo-400" style={{ width: `${Math.max(4, (building.total / max) * 100)}%` }} />
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <b className="block text-sm text-slate-900 dark:text-white">{building.total}</b>
                      <small className="text-[10px] text-slate-500 dark:text-slate-400">{building.active} active</small>
                    </span>
                  </button>
                );
              })}
              {!buildingStats.some((building) => building.total > 0) && (
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">No building-linked requests yet.</div>
              )}
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]" aria-label="Risk and shortcuts">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(30,41,59,.035)] dark:border-slate-800 dark:bg-[#141b2d] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">SLA and safety watch</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Cases that may need a directorate response</p>
              </div>
              <AlertTriangle size={18} className={overdueBreaches || criticalTickets ? 'text-rose-500 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'} />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Overdue', value: overdueBreaches, detail: 'Beyond SLA', tone: overdueBreaches ? 'rose' : 'teal' },
                { label: 'Approaching', value: approachingBreaches, detail: 'Near SLA limit', tone: approachingBreaches ? 'amber' : 'slate' },
                { label: 'Critical safety', value: criticalTickets, detail: 'Open hazards', tone: criticalTickets ? 'rose' : 'teal' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to="/operations"
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-500/40"
                >
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</span>
                  <b className={`mt-2 block text-2xl font-bold ${
                    item.tone === 'rose'
                      ? 'text-rose-600 dark:text-rose-400'
                      : item.tone === 'amber'
                      ? 'text-amber-600 dark:text-amber-400'
                      : item.tone === 'teal'
                      ? 'text-teal-700 dark:text-teal-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {loading ? '—' : item.value}
                  </b>
                  <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{item.detail}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(30,41,59,.035)] dark:border-slate-800 dark:bg-[#141b2d] sm:p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Directorate shortcuts</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Jump into a workspace</p>
            <div className="mt-4 space-y-2">
              {[
                { to: '/operations', label: 'Operations console', icon: Activity, detail: 'Triage and dispatch' },
                { to: '/squads', label: 'Squads and workload', icon: UsersRound, detail: 'Team capacity' },
                { to: '/superadmin/staff', label: 'Staff directory', icon: ShieldCheck, detail: 'Accounts and access' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-indigo-200 hover:bg-indigo-50/60 dark:border-slate-800/80 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/10"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block text-xs font-semibold text-slate-900 dark:text-slate-100">{item.label}</b>
                      <small className="text-[11px] text-slate-500 dark:text-slate-400">{item.detail}</small>
                    </span>
                    <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
                  </Link>
                );
              })}
            </div>
          </article>
        </section>
      </main>
    </div>
  </div>
  );
}
