/** Facilities operations desk: dispatch, ticket triage, workload and SLA exceptions. */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, BellRing, CheckCircle2, ClipboardList, Compass, LayoutDashboard, Map, Plus, RefreshCw, Search, Settings2, ShieldAlert, UsersRound, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchComplaints } from '../api/complaints';
import { updateTicketStatus, escalateTicket } from '../api/sla';
import PriorityBadge from '../components/PriorityBadge';
import PriorityOverrideModal from '../components/PriorityOverrideModal';
import ResolutionNotesModal from '../components/ResolutionNotesModal';
import ReassignTeamModal from '../components/ReassignTeamModal';
import TeamWorkloadView from '../components/TeamWorkloadView';
import SLABreachTable from '../components/SLABreachTable';
import SLACountdownTimer from '../components/SLACountdownTimer';

const STATUS_TABS = [{ id: '', label: 'All work' }, { id: 'SUBMITTED', label: 'Unassigned' }, { id: 'IN_PROGRESS', label: 'In progress' }, { id: 'ESCALATED', label: 'At risk' }];
const DEPARTMENTS = [['1', 'Electrical'], ['2', 'Plumbing'], ['3', 'Sanitation'], ['4', 'Carpentry'], ['5', 'IT Support'], ['6', 'General Administration']];

function StatusBadge({ status }) {
  const styles = { SUBMITTED: 'bg-slate-700/70 text-slate-200 border-slate-600', ASSIGNED: 'bg-sky-500/10 text-sky-300 border-sky-400/20', IN_PROGRESS: 'bg-indigo-500/10 text-indigo-300 border-indigo-400/20', ESCALATED: 'bg-rose-500/10 text-rose-300 border-rose-400/20', RESOLVED: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20', CLOSED: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${styles[status] || styles.SUBMITTED}`}>{(status || 'SUBMITTED').replace('_', ' ')}</span>;
}

export default function AdminDashboard() {
  const location = useLocation();
  const { currentUser, isSuperAdmin } = useAuth();
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
    try { setLoading(true); setError(null); const data = await fetchComplaints(); setTickets(Array.isArray(data) ? data : []); }
    catch (err) { setError(err.response?.data?.detail || err.message || 'Failed to load the operations queue.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadTickets(); }, []);
  const showToast = (message) => { setToastMsg(message); window.setTimeout(() => setToastMsg(null), 3500); };

  const handleStartWork = async (ticket) => {
    try { await updateTicketStatus(ticket.id, 'IN_PROGRESS', 'Technician dispatched and commenced physical repair.', currentUser?.name); showToast(`${ticket.tracking_code} is now in progress.`); loadTickets(); }
    catch (err) { setError(err.response?.data?.detail || err.message || 'Failed to start this repair.'); }
  };
  const handleConfirmEscalate = async (event) => {
    event.preventDefault(); if (!escalateTarget || escalateReason.trim().length < 5) return;
    try { setEscalating(true); await escalateTicket(escalateTarget.id, escalateReason.trim(), currentUser?.name); showToast(`${escalateTarget.tracking_code} was escalated for supervisory attention.`); setEscalateTarget(null); loadTickets(); }
    catch (err) { setError(err.response?.data?.detail || err.message || 'Escalation failed.'); }
    finally { setEscalating(false); }
  };

  const filteredTickets = useMemo(() => tickets.filter((ticket) => {
    if (selectedDept && String(ticket.department_id) !== selectedDept) return false;
    if (selectedPriority && ticket.priority !== selectedPriority) return false;
    if (selectedStatus && ticket.status !== selectedStatus) return false;
    const query = searchQuery.trim().toLowerCase();
    return !query || [ticket.tracking_code, ticket.title, ticket.location, ticket.assigned_team_name].some((value) => value?.toLowerCase().includes(query));
  }), [tickets, selectedDept, selectedPriority, selectedStatus, searchQuery]);

  const metrics = useMemo(() => {
    const active = tickets.filter((ticket) => !['RESOLVED', 'CLOSED'].includes(ticket.status)).length;
    const progress = tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length;
    const critical = tickets.filter((ticket) => ticket.priority === 'CRITICAL' && !['RESOLVED', 'CLOSED'].includes(ticket.status)).length;
    const escalated = tickets.filter((ticket) => ticket.status === 'ESCALATED').length;
    return { total: tickets.length, active, progress, critical, escalated };
  }, [tickets]);

  const navItems = [{ to: '/operations', label: 'Operations', icon: LayoutDashboard }, { to: '/squads', label: 'Squads', icon: UsersRound }, { to: '/track', label: 'Track request', icon: ClipboardList }, { to: '/map', label: 'Campus map', icon: Map }, ...(isSuperAdmin ? [{ to: '/superadmin', label: 'Directorate', icon: Compass }] : [])];
  const panel = 'rounded-2xl border border-white/[0.09] bg-[#101722] shadow-[0_10px_30px_-24px_rgba(0,0,0,.9)]';

  return (
    <div className="min-h-screen bg-[#090d14] font-sans text-slate-100 selection:bg-indigo-500/40">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="sticky top-0 hidden h-screen w-[254px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0d121b] px-4 py-5 lg:flex">
          <Link to="/operations" className="mb-8 flex items-center gap-3 px-2"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-300 to-sky-300 text-indigo-950 shadow-[0_0_28px_rgba(129,140,248,.25)]"><Wrench size={20} strokeWidth={2.5} /></div><div><div className="text-sm font-bold tracking-tight text-white">IIIT-NR</div><div className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">Facilities desk</div></div></Link>
          <label className="relative mb-5 block"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search requests" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.035] py-2 pl-9 pr-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-400/10" /></label>
          <div className="mb-5 grid grid-cols-2 gap-2"><button onClick={() => setSelectedStatus(selectedStatus === 'IN_PROGRESS' ? '' : 'IN_PROGRESS')} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:bg-white/[0.06]"><span className="block text-[10px] font-medium text-slate-500">In progress</span><b className="mt-1 block text-xl tracking-tight text-white">{metrics.progress}</b></button><button onClick={() => setSelectedStatus(selectedStatus === 'ESCALATED' ? '' : 'ESCALATED')} className="rounded-xl border border-rose-400/20 bg-rose-400/[0.035] p-3 text-left transition hover:bg-rose-400/[0.08]"><span className="block text-[10px] font-medium text-rose-200/70">At risk</span><b className="mt-1 block text-xl tracking-tight text-rose-300">{metrics.escalated}</b></button></div>
          <nav className="space-y-1" aria-label="Operations navigation"><p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">Workspaces</p>{navItems.map((item) => { const Icon = item.icon; const active = location.pathname === item.to; return <Link key={item.to} to={item.to} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${active ? 'border border-indigo-300/15 bg-indigo-400/10 text-indigo-200' : 'text-slate-400 hover:bg-white/[0.045] hover:text-slate-100'}`}><Icon size={16} />{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300" />}</Link>; })}</nav>
          <div className="mt-auto space-y-2 border-t border-white/[0.08] pt-4"><Link to="/submit" className="flex items-center gap-2 rounded-xl bg-indigo-500 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-400"><Plus size={15} /> Create request</Link><div className="flex items-center gap-2 px-2 pt-2"><div className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs font-bold text-indigo-200">{(currentUser?.name || 'A').slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-200">{currentUser?.name || 'Operations Admin'}</p><p className="truncate text-[10px] text-slate-500">{currentUser?.roleLabel || 'Administrator'}</p></div></div></div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <header className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,.8)]" /> Live operations</div><h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Maintenance command center</h1><p className="mt-1 text-xs text-slate-400">Dispatch work, protect SLAs, and keep campus services moving.</p></div><div className="flex items-center gap-2"><button onClick={loadTickets} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-60 cursor-pointer"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button><Link to="/submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-400"><Plus size={15} /> New request</Link></div></header>

          {/* Mobile workspace tabs when sidebar is hidden on small screens */}
          <nav className="mb-5 flex gap-1.5 overflow-x-auto pb-1 lg:hidden" aria-label="Mobile workspace navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? 'border border-indigo-400/30 bg-indigo-500/20 text-indigo-200'
                      : 'border border-white/[0.07] bg-white/[0.03] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {toastMsg && <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3 text-xs font-medium text-emerald-200"><span className="flex items-center gap-2"><CheckCircle2 size={16} />{toastMsg}</span><button onClick={() => setToastMsg(null)} className="text-emerald-100/70 hover:text-white">×</button></div>}
          {error && <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-3 text-xs font-medium text-rose-200"><span>{error}</span><button onClick={loadTickets} className="font-semibold underline">Retry</button></div>}
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="Operations summary">{[{ label: 'Open queue', value: metrics.active, detail: `${metrics.total} total requests`, icon: ClipboardList, tone: 'text-indigo-200 bg-indigo-400/10 border-indigo-400/20' }, { label: 'Active repairs', value: metrics.progress, detail: 'Field teams working', icon: Wrench, tone: 'text-sky-200 bg-sky-400/10 border-sky-400/20' }, { label: 'Critical cases', value: metrics.critical, detail: 'Immediate response', icon: ShieldAlert, tone: 'text-rose-200 bg-rose-400/10 border-rose-400/20' }, { label: 'SLA at risk', value: metrics.escalated, detail: 'Needs review', icon: BellRing, tone: 'text-amber-200 bg-amber-400/10 border-amber-400/20' }].map((metric) => { const Icon = metric.icon; return <article key={metric.label} className={`${panel} p-4`}><div className="flex items-start justify-between gap-2"><span className="text-xs font-medium text-slate-400">{metric.label}</span><span className={`grid h-8 w-8 place-items-center rounded-xl border ${metric.tone}`}><Icon size={16} /></span></div><strong className="mt-4 block text-3xl font-bold tracking-tight text-white">{loading ? '—' : metric.value}</strong><span className="mt-1 block text-[11px] text-slate-500">{metric.detail}</span></article>; })}</section>
          <section className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_300px]"><div className={`min-w-0 ${panel}`}><div className="border-b border-white/[0.08] px-4 py-4 sm:px-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-white">Active work queue</h2>{metrics.escalated > 0 && <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold text-rose-300">{metrics.escalated} escalated</span>}</div><p className="mt-1 text-xs text-slate-500">Prioritise urgent work before it becomes a breach.</p></div><div className="flex flex-wrap items-center gap-2"><label className="relative"><Search className="pointer-events-none absolute left-3 top-2 h-3.5 w-3.5 text-slate-500" /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search queue" className="w-40 rounded-lg border border-white/[0.09] bg-[#0a0f17] py-2 pl-8 pr-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-400/60 sm:w-48" /></label><select value={selectedDept} onChange={(event) => setSelectedDept(event.target.value)} className="rounded-lg border border-white/[0.09] bg-[#0a0f17] px-2.5 py-2 text-xs text-slate-300 outline-none"><option value="">All teams</option>{DEPARTMENTS.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select><select value={selectedPriority} onChange={(event) => setSelectedPriority(event.target.value)} className="rounded-lg border border-white/[0.09] bg-[#0a0f17] px-2.5 py-2 text-xs text-slate-300 outline-none"><option value="">Priority</option>{['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></div></div><div className="mt-4 flex gap-1 overflow-x-auto pb-0.5">{STATUS_TABS.map((tab) => <button key={tab.id} onClick={() => setSelectedStatus(tab.id)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedStatus === tab.id ? 'bg-indigo-500 text-white shadow-[0_4px_14px_rgba(99,102,241,.3)]' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'}`}>{tab.label}{tab.id === 'ESCALATED' && metrics.escalated ? ` · ${metrics.escalated}` : ''}</button>)}</div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="border-b border-white/[0.08] bg-white/[0.018] text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"><tr><th className="px-5 py-3">Request</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Assigned to</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">SLA</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Next step</th></tr></thead><tbody className="divide-y divide-white/[0.065]">{loading ? <tr><td colSpan={7} className="px-5 py-14 text-center text-xs text-slate-500">Loading the live queue…</td></tr> : filteredTickets.length === 0 ? <tr><td colSpan={7} className="px-5 py-14 text-center text-xs text-slate-500">No requests match these filters.</td></tr> : filteredTickets.map((ticket) => <tr key={ticket.id} className="group transition hover:bg-white/[0.025]"><td className="px-5 py-3.5"><Link to={`/track?code=${ticket.tracking_code}`} className="font-mono text-xs font-bold text-indigo-300 hover:text-indigo-200">{ticket.tracking_code}</Link><p className="mt-1 max-w-[220px] truncate text-xs font-semibold text-slate-100" title={ticket.title}>{ticket.title}</p></td><td className="px-4 py-3.5"><p className="max-w-[165px] truncate text-xs text-slate-300">{ticket.location || 'Campus location pending'}</p></td><td className="px-4 py-3.5"><p className="text-xs font-medium text-slate-200">{ticket.assigned_team_name || 'Unassigned'}</p><p className="mt-1 text-[10px] text-slate-500">{ticket.department_name || 'Needs routing'}</p></td><td className="px-4 py-3.5"><PriorityBadge priority={ticket.priority} /></td><td className="px-4 py-3.5"><SLACountdownTimer deadline={ticket.sla_deadline} priority={ticket.priority} status={ticket.status} resolvedAt={ticket.resolved_at} dark /></td><td className="px-4 py-3.5"><StatusBadge status={ticket.status} /></td><td className="px-5 py-3.5 text-right"><div className="flex items-center justify-end gap-1.5">{(ticket.status === 'ASSIGNED' || ticket.status === 'SUBMITTED') && <button onClick={() => handleStartWork(ticket)} className="rounded-lg bg-indigo-500 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-indigo-400">Start</button>}{ticket.status === 'IN_PROGRESS' && <button onClick={() => setResolveTicketTarget(ticket)} className="rounded-lg bg-emerald-500/15 px-2.5 py-1.5 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-500/25">Resolve</button>}{!['RESOLVED', 'CLOSED'].includes(ticket.status) && <button onClick={() => setReassignTicketTarget(ticket)} title="Reassign squad" className="rounded-lg border border-white/[0.1] p-1.5 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"><UsersRound size={14} /></button>}{!['RESOLVED', 'CLOSED'].includes(ticket.status) && <button onClick={() => setOverrideTicket(ticket)} title="Override priority" className="rounded-lg border border-white/[0.1] p-1.5 text-slate-300 transition hover:bg-white/[0.08] hover:text-white"><Settings2 size={14} /></button>}{!['RESOLVED', 'CLOSED', 'ESCALATED'].includes(ticket.status) && <button onClick={() => { setEscalateTarget(ticket); setEscalateReason('High risk of operational SLA breach or campus safety hazard.'); }} title="Escalate ticket" className="rounded-lg border border-rose-400/20 p-1.5 text-rose-300 transition hover:bg-rose-400/10"><AlertTriangle size={14} /></button>}</div></td></tr>)}</tbody></table></div></div>
            <aside className="space-y-5"><div className={`${panel} p-4`}><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold text-white">Queue focus</h2><p className="mt-1 text-[11px] text-slate-500">Recommended next review</p></div><AlertTriangle className={metrics.critical ? 'text-rose-300' : 'text-emerald-300'} size={18} /></div><div className="mt-4 space-y-3"><button onClick={() => { setSelectedPriority('CRITICAL'); setSelectedStatus(''); }} className="flex w-full items-center justify-between rounded-xl border border-rose-400/15 bg-rose-400/[0.06] p-3 text-left transition hover:bg-rose-400/[0.1]"><span><b className="block text-xs text-rose-200">Critical breakdowns</b><small className="mt-0.5 block text-[10px] text-rose-200/60">Review immediately</small></span><strong className="text-xl text-rose-300">{metrics.critical}</strong></button><button onClick={() => { setSelectedStatus('ESCALATED'); setSelectedPriority(''); }} className="flex w-full items-center justify-between rounded-xl border border-amber-400/15 bg-amber-400/[0.06] p-3 text-left transition hover:bg-amber-400/[0.1]"><span><b className="block text-xs text-amber-200">Escalated requests</b><small className="mt-0.5 block text-[10px] text-amber-100/60">Require a decision</small></span><strong className="text-xl text-amber-300">{metrics.escalated}</strong></button></div></div><TeamWorkloadView forceDark /></aside></section>
          <section className="mt-5"><SLABreachTable forceDark onEscalate={(ticket) => { setEscalateTarget(ticket); setEscalateReason('Contractual SLA threshold exceeded; escalating for supervisory intervention.'); }} onReassign={(ticket) => setReassignTicketTarget(ticket)} /></section>
        </main>
      </div>
      <PriorityOverrideModal isOpen={Boolean(overrideTicket)} ticket={overrideTicket} onClose={() => setOverrideTicket(null)} onPriorityUpdated={() => { setOverrideTicket(null); showToast('Ticket priority and SLA were updated.'); loadTickets(); }} />
      <ResolutionNotesModal isOpen={Boolean(resolveTicketTarget)} ticket={resolveTicketTarget} onClose={() => setResolveTicketTarget(null)} onResolved={() => { setResolveTicketTarget(null); showToast('Ticket resolved and logged.'); loadTickets(); }} />
      <ReassignTeamModal isOpen={Boolean(reassignTicketTarget)} ticket={reassignTicketTarget} onClose={() => setReassignTicketTarget(null)} onReassigned={() => { setReassignTicketTarget(null); showToast('Ticket reassigned to a new maintenance squad.'); loadTickets(); }} />
      {escalateTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><form onSubmit={handleConfirmEscalate} className="w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#111926] p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-rose-300">Escalate request</span><h2 className="mt-1 text-base font-semibold text-white">{escalateTarget.tracking_code}</h2></div><button type="button" onClick={() => setEscalateTarget(null)} className="text-slate-500 hover:text-white">×</button></div><label className="mt-5 block text-xs font-medium text-slate-300">Reason<textarea value={escalateReason} onChange={(event) => setEscalateReason(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-white/[0.1] bg-[#090d14] p-3 text-xs text-white outline-none focus:border-rose-400/60" /></label><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setEscalateTarget(null)} className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button><button disabled={escalating || escalateReason.trim().length < 5} className="rounded-xl bg-rose-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-rose-400 disabled:opacity-50">{escalating ? 'Escalating…' : 'Escalate request'}</button></div></form></div>}
    </div>
  );
}
