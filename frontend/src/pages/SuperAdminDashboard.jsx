/**
 * SmartComplaintHandler - Campus Facilities Directorate Operations Center
 * Role: Dedicated Executive Command Console for the Super Administrator / Directorate.
 * Combines full live ticket dispatch & triage, squad reallocation, SLA exception mitigation,
 * and seamless governance links (Staff Directory, Campus Twin, Squads).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertTriangle, BellRing, CheckCircle2, ClipboardList,
  Compass, LayoutDashboard, Map as MapIcon, Plus, RefreshCw,
  Search, Settings2, ShieldAlert, ShieldCheck, UsersRound, Wrench, Moon, Sun,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchComplaints } from '../api/complaints';
import { updateTicketStatus, escalateTicket } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import PriorityOverrideModal from '../components/PriorityOverrideModal';
import ResolutionNotesModal from '../components/ResolutionNotesModal';
import ReassignTeamModal from '../components/ReassignTeamModal';
import TeamWorkloadView from '../components/TeamWorkloadView';
import SLABreachTable from '../components/SLABreachTable';
import SLACountdownTimer from '../components/SLACountdownTimer';

const STATUS_TABS = [
  { id: '', label: 'All work' },
  { id: 'SUBMITTED', label: 'Unassigned' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'ESCALATED', label: 'At risk' },
];

const DEPARTMENTS = [
  ['1', 'Electrical'],
  ['2', 'Plumbing'],
  ['3', 'Sanitation'],
  ['4', 'Carpentry'],
  ['5', 'IT Support'],
  ['6', 'General Administration'],
];

function StatusBadge({ status, isDark }) {
  const stylesDark = {
    SUBMITTED: 'bg-slate-700/70 text-slate-200 border-slate-600',
    ASSIGNED: 'bg-sky-500/10 text-sky-300 border-sky-400/20',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-300 border-indigo-400/20',
    ESCALATED: 'bg-rose-500/10 text-rose-300 border-rose-400/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
    CLOSED: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20',
  };

  const stylesLight = {
    SUBMITTED: 'bg-slate-100 text-slate-700 border-slate-300',
    ASSIGNED: 'bg-sky-50 text-sky-700 border-sky-200',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ESCALATED: 'bg-rose-50 text-rose-700 border-rose-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const styles = isDark ? stylesDark : stylesLight;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${styles[status] || styles.SUBMITTED}`}>
      {(status || 'SUBMITTED').replace('_', ' ')}
    </span>
  );
}

export default function SuperAdminDashboard() {
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [overrideTicket, setOverrideTicket] = useState(null);
  const [resolveTicketTarget, setResolveTicketTarget] = useState(null);
  const [reassignTicketTarget, setReassignTicketTarget] = useState(null);
  const [escalateTarget, setEscalateTarget] = useState(null);
  const [escalateReason, setEscalateReason] = useState('High risk of operational SLA breach or campus safety hazard.');
  const [escalating, setEscalating] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComplaints();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load directorate operations queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const showToast = (message) => {
    setToastMsg(message);
    window.setTimeout(() => setToastMsg(null), 3500);
  };

  const handleStartWork = async (ticket) => {
    try {
      await updateTicketStatus(ticket.id, 'IN_PROGRESS', 'Technician dispatched and commenced physical repair.', currentUser?.name);
      showToast(`${ticket.tracking_code} is now in progress.`);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start this repair.');
    }
  };

  const handleConfirmEscalate = async (event) => {
    event.preventDefault();
    if (!escalateTarget || escalateReason.trim().length < 5) return;
    try {
      setEscalating(true);
      await escalateTicket(escalateTarget.id, escalateReason.trim(), currentUser?.name);
      showToast(`${escalateTarget.tracking_code} was escalated for supervisory attention.`);
      setEscalateTarget(null);
      loadTickets();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Escalation failed.');
    } finally {
      setEscalating(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (selectedDept && String(ticket.department_id) !== selectedDept) return false;
      if (selectedPriority && ticket.priority !== selectedPriority) return false;
      if (selectedStatus && ticket.status !== selectedStatus) return false;
      const query = searchQuery.trim().toLowerCase();
      return !query || [ticket.tracking_code, ticket.title, ticket.location, ticket.assigned_team_name].some((val) => val?.toLowerCase().includes(query));
    });
  }, [tickets, selectedDept, selectedPriority, selectedStatus, searchQuery]);

  const metrics = useMemo(() => {
    const active = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const progress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const critical = tickets.filter((t) => t.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const escalated = tickets.filter((t) => t.status === 'ESCALATED').length;
    return { total: tickets.length, active, progress, critical, escalated };
  }, [tickets]);

  // Directorate Navigation (Notice: No link to /operations; this IS the SuperAdmin's operations desk)
  const navItems = [
    { to: '/superadmin', label: 'Directorate desk', icon: Compass },
    { to: '/superadmin/staff', label: 'Staff directory', icon: ShieldCheck },
    { to: '/squads', label: 'Squad capacity', icon: UsersRound },
    { to: '/map', label: 'Campus twin', icon: MapIcon },
    { to: '/track', label: 'Track & audit', icon: ClipboardList },
  ];

  const panelClass = isDark
    ? 'rounded-2xl border border-white/[0.09] bg-[#101722] shadow-[0_10px_30px_-24px_rgba(0,0,0,.9)]'
    : 'rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(30,41,59,.04)]';

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${
      isDark ? 'bg-[#090d14] text-slate-100 selection:bg-indigo-500/40' : 'bg-[#f4f7fc] text-slate-900 selection:bg-indigo-100'
    }`}>
      <div className="mx-auto flex min-h-screen max-w-[1850px]">
        {/* Directorate Dedicated PC Sidebar */}
        <aside className={`sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r px-4 py-5 lg:flex ${
          isDark ? 'border-white/[0.08] bg-[#0d121b]' : 'border-slate-200 bg-white'
        }`}>
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
              placeholder="Search requests"
              className={`w-full rounded-xl border py-2 pl-9 pr-3 text-xs outline-none transition ${
                isDark
                  ? 'border-white/[0.08] bg-white/[0.035] text-slate-100 placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10'
                  : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'
              }`}
            />
          </label>

          {/* Quick Filter Badges */}
          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')}
              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                selectedStatus === 'IN_PROGRESS'
                  ? 'border-indigo-500/50 bg-indigo-500/15'
                  : isDark
                  ? 'border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.06]'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <span className="block text-[10px] font-medium text-slate-500 dark:text-slate-400">In progress</span>
              <b className="mt-1 block text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {metrics.progress}
              </b>
            </button>

            <button
              onClick={() => setSelectedStatus(selectedStatus === 'ESCALATED' ? '' : 'ESCALATED')}
              className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                metrics.escalated > 0
                  ? isDark
                    ? 'border-rose-400/20 bg-rose-400/[0.04] hover:bg-rose-400/[0.08]'
                    : 'border-rose-200 bg-rose-50/70 hover:bg-rose-50'
                  : isDark
                  ? 'border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.06]'
                  : 'border-slate-200 bg-slate-50 hover:bg-white'
              }`}
            >
              <span className={`block text-[10px] font-medium ${metrics.escalated > 0 ? 'text-rose-600 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>
                At risk
              </span>
              <b className={`mt-1 block text-lg font-bold tracking-tight ${metrics.escalated > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                {metrics.escalated}
              </b>
            </button>
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
                      ? isDark
                        ? 'border border-indigo-400/20 bg-indigo-500/15 text-indigo-200'
                        : 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                      : isDark
                      ? 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Footer Controls & User Card */}
          <div className={`mt-auto space-y-2.5 border-t pt-4 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
            <Link
              to="/submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 shadow-sm"
            >
              <Plus size={15} /> Create request
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'border-white/[0.08] bg-white/[0.035] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:text-slate-900'
              }`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              <span className="flex items-center gap-2">
                {isDark ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-500" />}
                <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
              </span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200/60 text-slate-600'
              }`}>
                Toggle
              </span>
            </button>

            <div className="flex items-center gap-2.5 px-2 pt-1">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200">
                {(currentUser?.name && isNaN(currentUser.name) ? currentUser.name : currentUser?.email || 'Director').slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-200">
                  {currentUser?.name && isNaN(currentUser.name) ? currentUser.name : (currentUser?.email ? currentUser.email.split('@')[0] : 'Executive Director')}
                </p>
                <p className="truncate text-[10px] text-slate-500">
                  {currentUser?.roleLabel || 'Directorate · Super Admin'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Operational Console */}
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7 space-y-5">
          {/* Header */}
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(74,222,128,.8)]" />
                Live Directorate Operations
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Campus Facilities & Grievance Command
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Dispatch work, enforce SLAs, and oversee campus facilities across IIIT Naya Raipur.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadTickets}
                disabled={loading}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition disabled:opacity-60 cursor-pointer ${
                  isDark
                    ? 'border-white/[0.1] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <Link
                to="/superadmin/staff"
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                  isDark
                    ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-xs'
                }`}
              >
                <UsersRound size={15} /> Staff directory
              </Link>
              <Link
                to="/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 shadow-sm"
              >
                <Plus size={15} /> New request
              </Link>
            </div>
          </header>

          {/* Toast and Error notifications */}
          {toastMsg && (
            <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-xs font-medium animate-fade-in ${
              isDark
                ? 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                {toastMsg}
              </span>
              <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">×</button>
            </div>
          )}

          {error && (
            <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-xs font-medium animate-fade-in ${
              isDark
                ? 'border-rose-400/20 bg-rose-400/[0.08] text-rose-200'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}>
              <span>{error}</span>
              <button onClick={loadTickets} className="font-semibold underline">Retry</button>
            </div>
          )}

          {/* Top Operational Metrics */}
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Operations summary">
            {[
              {
                label: 'Open queue',
                value: metrics.active,
                detail: `${metrics.total} total requests`,
                icon: ClipboardList,
                toneDark: 'text-indigo-200 bg-indigo-400/10 border-indigo-400/20',
                toneLight: 'text-indigo-700 bg-indigo-50 border-indigo-200',
              },
              {
                label: 'Active repairs',
                value: metrics.progress,
                detail: 'Field teams working',
                icon: Wrench,
                toneDark: 'text-sky-200 bg-sky-400/10 border-sky-400/20',
                toneLight: 'text-sky-700 bg-sky-50 border-sky-200',
              },
              {
                label: 'Critical cases',
                value: metrics.critical,
                detail: 'Immediate response',
                icon: ShieldAlert,
                toneDark: 'text-rose-200 bg-rose-400/10 border-rose-400/20',
                toneLight: 'text-rose-700 bg-rose-50 border-rose-200',
              },
              {
                label: 'SLA at risk',
                value: metrics.escalated,
                detail: 'Needs review',
                icon: BellRing,
                toneDark: 'text-amber-200 bg-amber-400/10 border-amber-400/20',
                toneLight: 'text-amber-700 bg-amber-50 border-amber-200',
              },
            ].map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.label} className={`${panelClass} p-4 sm:p-5`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{metric.label}</span>
                    <span className={`grid h-8 w-8 place-items-center rounded-xl border ${isDark ? metric.toneDark : metric.toneLight}`}>
                      <Icon size={16} />
                    </span>
                  </div>
                  <strong className="mt-4 block text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {loading ? '—' : metric.value}
                  </strong>
                  <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{metric.detail}</span>
                </article>
              );
            })}
          </section>

          {/* Active Work Queue & Focus / Workloads */}
          <section className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Main Table */}
            <div className={`min-w-0 ${panelClass}`}>
              <div className={`border-b px-4 py-4 sm:px-5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Active work queue</h2>
                      {metrics.escalated > 0 && (
                        <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                          {metrics.escalated} escalated
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Prioritise urgent work before it becomes a breach.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="relative">
                      <Search className="pointer-events-none absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search queue"
                        className={`w-40 rounded-lg border py-2 pl-8 pr-2 text-xs outline-none transition sm:w-48 ${
                          isDark
                            ? 'border-white/[0.09] bg-[#0a0f17] text-white placeholder:text-slate-600 focus:border-indigo-400/60'
                            : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white'
                        }`}
                      />
                    </label>

                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className={`rounded-lg border px-2.5 py-2 text-xs outline-none ${
                        isDark
                          ? 'border-white/[0.09] bg-[#0a0f17] text-slate-300'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <option value="">All teams</option>
                      {DEPARTMENTS.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className={`rounded-lg border px-2.5 py-2 text-xs outline-none ${
                        isDark
                          ? 'border-white/[0.09] bg-[#0a0f17] text-slate-300'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <option value="">Priority</option>
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex gap-1 overflow-x-auto pb-0.5">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedStatus(tab.id)}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        selectedStatus === tab.id
                          ? 'bg-indigo-600 text-white shadow-[0_4px_14px_rgba(99,102,241,.3)]'
                          : isDark
                          ? 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                      {tab.id === 'ESCALATED' && metrics.escalated ? ` · ${metrics.escalated}` : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className={`border-b text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    isDark
                      ? 'border-white/[0.08] bg-white/[0.018] text-slate-500'
                      : 'border-slate-200 bg-slate-50/70 text-slate-500'
                  }`}>
                    <tr>
                      <th className="px-5 py-3">Request</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Assigned to</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">SLA</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Next step</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/[0.065]' : 'divide-slate-100'}`}>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-14 text-center text-xs text-slate-400">
                          Loading the directorate queue…
                        </td>
                      </tr>
                    ) : filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-14 text-center text-xs text-slate-400">
                          No requests match these filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className={`group transition ${
                            isDark ? 'hover:bg-white/[0.025]' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              to={`/track?code=${ticket.tracking_code}`}
                              className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
                            >
                              {ticket.tracking_code}
                            </Link>
                            <p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-slate-900 dark:text-slate-100" title={ticket.title}>
                              {ticket.title}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="max-w-[165px] truncate text-xs text-slate-600 dark:text-slate-300">
                              {ticket.location || 'Campus location pending'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {ticket.assigned_team_name || 'Unassigned'}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {ticket.department_name || 'Needs routing'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <PriorityBadge priority={ticket.priority} />
                          </td>
                          <td className="px-4 py-3.5">
                            <SLACountdownTimer
                              deadline={ticket.sla_deadline}
                              priority={ticket.priority}
                              status={ticket.status}
                              resolvedAt={ticket.resolved_at}
                              dark={isDark}
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={ticket.status} isDark={isDark} />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {(ticket.status === 'ASSIGNED' || ticket.status === 'SUBMITTED') && (
                                <button
                                  onClick={() => handleStartWork(ticket)}
                                  className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-indigo-500 cursor-pointer"
                                >
                                  Start
                                </button>
                              )}
                              {ticket.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => setResolveTicketTarget(ticket)}
                                  className="rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-300 cursor-pointer"
                                >
                                  Resolve
                                </button>
                              )}
                              {!['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                                <button
                                  onClick={() => setReassignTicketTarget(ticket)}
                                  title="Reassign squad"
                                  className={`rounded-lg border p-1.5 transition cursor-pointer ${
                                    isDark
                                      ? 'border-white/[0.1] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <UsersRound size={14} />
                                </button>
                              )}
                              {!['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                                <button
                                  onClick={() => setOverrideTicket(ticket)}
                                  title="Override priority"
                                  className={`rounded-lg border p-1.5 transition cursor-pointer ${
                                    isDark
                                      ? 'border-white/[0.1] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                                      : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                  }`}
                                >
                                  <Settings2 size={14} />
                                </button>
                              )}
                              {!['RESOLVED', 'CLOSED', 'ESCALATED'].includes(ticket.status) && (
                                <button
                                  onClick={() => {
                                    setEscalateTarget(ticket);
                                    setEscalateReason('High risk of operational SLA breach or campus safety hazard.');
                                  }}
                                  title="Escalate ticket"
                                  className="rounded-lg border border-rose-400/20 p-1.5 text-rose-600 hover:bg-rose-400/10 dark:text-rose-300 cursor-pointer"
                                >
                                  <AlertTriangle size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side Focus & Squads */}
            <aside className="space-y-5">
              <div className={`${panelClass} p-4 sm:p-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Queue focus</h2>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Immediate supervisory action</p>
                  </div>
                  <AlertTriangle className={metrics.critical ? 'text-rose-500 dark:text-rose-300' : 'text-emerald-500 dark:text-emerald-300'} size={18} />
                </div>

                <div className="mt-4 space-y-3">
                  <button
                    onClick={() => {
                      setSelectedPriority('CRITICAL');
                      setSelectedStatus('');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition cursor-pointer ${
                      isDark
                        ? 'border-rose-400/15 bg-rose-400/[0.06] hover:bg-rose-400/[0.1]'
                        : 'border-rose-200 bg-rose-50/70 hover:bg-rose-100/70'
                    }`}
                  >
                    <span>
                      <b className="block text-xs text-rose-700 dark:text-rose-200">Critical breakdowns</b>
                      <small className="mt-0.5 block text-[10px] text-rose-600/70 dark:text-rose-200/60">Review immediately</small>
                    </span>
                    <strong className="text-xl text-rose-600 dark:text-rose-300">{metrics.critical}</strong>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedStatus('ESCALATED');
                      setSelectedPriority('');
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition cursor-pointer ${
                      isDark
                        ? 'border-amber-400/15 bg-amber-400/[0.06] hover:bg-amber-400/[0.1]'
                        : 'border-amber-200 bg-amber-50/70 hover:bg-amber-100/70'
                    }`}
                  >
                    <span>
                      <b className="block text-xs text-amber-700 dark:text-amber-200">Escalated requests</b>
                      <small className="mt-0.5 block text-[10px] text-amber-600/70 dark:text-amber-100/60">Require a decision</small>
                    </span>
                    <strong className="text-xl text-amber-600 dark:text-amber-300">{metrics.escalated}</strong>
                  </button>
                </div>
              </div>

              {/* Live Squad Capacity */}
              <TeamWorkloadView forceDark={isDark} />
            </aside>
          </section>

          {/* SLA Exception Monitor */}
          <section className="mt-5">
            <SLABreachTable
              forceDark={isDark}
              onEscalate={(ticket) => {
                setEscalateTarget(ticket);
                setEscalateReason('Contractual SLA threshold exceeded; escalating for supervisory intervention.');
              }}
              onReassign={(ticket) => setReassignTicketTarget(ticket)}
            />
          </section>
        </main>
      </div>

      {/* Operational Modals */}
      <PriorityOverrideModal
        isOpen={Boolean(overrideTicket)}
        ticket={overrideTicket}
        onClose={() => setOverrideTicket(null)}
        onPriorityUpdated={() => {
          setOverrideTicket(null);
          showToast('Ticket priority and SLA were updated.');
          loadTickets();
        }}
      />

      <ResolutionNotesModal
        isOpen={Boolean(resolveTicketTarget)}
        ticket={resolveTicketTarget}
        onClose={() => setResolveTicketTarget(null)}
        onResolved={() => {
          setResolveTicketTarget(null);
          showToast('Ticket resolved and logged.');
          loadTickets();
        }}
      />

      <ReassignTeamModal
        isOpen={Boolean(reassignTicketTarget)}
        ticket={reassignTicketTarget}
        onClose={() => setReassignTicketTarget(null)}
        onReassigned={() => {
          setReassignTicketTarget(null);
          showToast('Ticket reassigned to a new maintenance squad.');
          loadTickets();
        }}
      />

      {escalateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleConfirmEscalate}
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
              isDark ? 'border-white/[0.12] bg-[#111926]' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-500 dark:text-rose-300">
                  Escalate request
                </span>
                <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                  {escalateTarget.tracking_code}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEscalateTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ×
              </button>
            </div>
            <label className="mt-5 block text-xs font-medium text-slate-700 dark:text-slate-300">
              Reason
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                className={`mt-2 min-h-28 w-full rounded-xl border p-3 text-xs outline-none ${
                  isDark
                    ? 'border-white/[0.1] bg-[#090d14] text-white focus:border-rose-400/60'
                    : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-rose-400 focus:bg-white'
                }`}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEscalateTarget(null)}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={escalating || escalateReason.trim().length < 5}
                className="rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
              >
                {escalating ? 'Escalating…' : 'Escalate request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
