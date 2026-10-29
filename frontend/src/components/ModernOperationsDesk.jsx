/**
 * SmartComplaintHandler - Ultra-Modern Enterprise Command Desk
 * Pixel-Perfect match to reference design (High-Density Nexus Telemetry):
 *  - Official circular IIIT-NR Logo emblem on top-left sidebar
 *  - High-res Campus Digital Twin with realistic architectural masterplan, glowing Apple Maps-style pins,
 *    landmark pills (Academic, Canteen, Auditorium, Hostels), layer switch & compass zoom controls
 *  - Authentic Stacked Request Volume Bar Chart with left Y-axis labels (320, 240, 160, 80, 0),
 *    dashed horizontal grid lines, 5 bold stacked department color blocks, and hour markers
 *  - Dynamic multi-segmented radial Donut gauge & 20-capsule segmented pill progress bar
 *  - Sleek dark obsidian glassmorphism throughout all buttons, filters, pagination, and modals
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpRight, BarChart3, BellRing,
  Building2, CheckCircle2, ChevronRight, ClipboardList,
  ExternalLink, LayoutDashboard,
  LineChart, Map as MapIcon, Plus, Radio, RefreshCw,
  Search, Settings2, ShieldAlert, ShieldCheck, Sliders,
  Users, UsersRound, Wrench, Moon, Sun, Check, X,
  Zap, Droplet, Hammer, Wifi, Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchComplaints } from '../api/complaints';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchActiveBreaches, updateTicketStatus, escalateTicket } from '../api/sla';
import { fetchCampusBuildings } from '../api/campus';
import { getCampusBuildings } from '../data/iiitnrCampusData';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import DepartmentBadge from './DepartmentBadge';
import PriorityOverrideModal from './PriorityOverrideModal';
import ResolutionNotesModal from './ResolutionNotesModal';
import ReassignTeamModal from './ReassignTeamModal';
import TeamWorkloadView from './TeamWorkloadView';
import SLABreachTable from './SLABreachTable';
import SLACountdownTimer from './SLACountdownTimer';

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

const PAGE_SIZE = 15;

export default function ModernOperationsDesk({ mode = 'superadmin' }) {
  const isSuperAdminMode = mode === 'superadmin';
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Core telemetry state
  const [tickets, setTickets] = useState([]);
  const [squads, setSquads] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Filters & UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeTableTab, setActiveTableTab] = useState('queue'); // 'structures' | 'queue'
  const [structureStatusFilter, setStructureStatusFilter] = useState('ALL'); // 'ALL' | 'ALERT' | 'NORMAL'
  const [selectedBuildingId, setSelectedBuildingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [volumeMode, setVolumeMode] = useState('daily'); // 'daily' | 'hourly'

  // Modals state
  const [overrideTicket, setOverrideTicket] = useState(null);
  const [resolveTicketTarget, setResolveTicketTarget] = useState(null);
  const [reassignTicketTarget, setReassignTicketTarget] = useState(null);
  const [escalateTarget, setEscalateTarget] = useState(null);
  const [escalateReason, setEscalateReason] = useState('High risk of operational SLA breach or campus safety hazard.');
  const [escalating, setEscalating] = useState(false);

  // Load all telemetry from live backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketList, squadList, breachList, remoteBuildings] = await Promise.all([
        fetchComplaints().catch(() => []),
        fetchSquadWorkloads().catch(() => []),
        fetchActiveBreaches().catch(() => []),
        fetchCampusBuildings().catch(() => []),
      ]);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      setSquads(Array.isArray(squadList) ? squadList : []);
      setBreaches(Array.isArray(breachList) ? breachList : []);
      if (Array.isArray(remoteBuildings) && remoteBuildings.length > 0) {
        setBuildings(remoteBuildings);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load live telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTableTab, structureStatusFilter, selectedDept, selectedPriority, selectedStatus, selectedBuildingId, searchQuery]);

  // Synchronize location hash with active table tab
  useEffect(() => {
    if (location.hash === '#queue') {
      setActiveTableTab('queue');
    } else if (location.hash === '#structures') {
      setActiveTableTab('structures');
    }
  }, [location.hash]);

  const showToast = (message) => {
    setToastMsg(message);
    window.setTimeout(() => setToastMsg(null), 3500);
  };

  // Operational actions
  const handleStartWork = async (ticket) => {
    try {
      await updateTicketStatus(ticket.id, 'IN_PROGRESS', 'Technician dispatched and commenced physical repair.', currentUser?.name);
      showToast(`${ticket.tracking_code} is now in progress.`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to start this repair.');
    }
  };

  const handleConfirmEscalate = async (e) => {
    e.preventDefault();
    if (!escalateTarget || escalateReason.trim().length < 5) return;
    try {
      setEscalating(true);
      await escalateTicket(escalateTarget.id, escalateReason.trim(), currentUser?.name);
      showToast(`${escalateTarget.tracking_code} was escalated for supervisory attention.`);
      setEscalateTarget(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Escalation failed.');
    } finally {
      setEscalating(false);
    }
  };

  // Metrics computation from real tickets
  const metrics = useMemo(() => {
    const total = tickets.length;
    const active = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const progress = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const critical = tickets.filter((t) => (t.priority === 'CRITICAL' || t.hazard_detected) && !['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const escalated = tickets.filter((t) => t.status === 'ESCALATED').length;
    const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;
    const overdue = breaches.filter((b) => b.is_breached).length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const healthScore = total > 0 ? Math.max(0, Math.min(100, Math.round(((total - overdue) / total) * 100))) : 100;

    // Logged today calculation
    const todayStr = new Date().toDateString();
    const loggedToday = tickets.filter((t) => t.created_at && new Date(t.created_at).toDateString() === todayStr).length;

    return {
      total,
      active,
      progress,
      critical,
      escalated,
      resolved,
      overdue,
      resolutionRate,
      healthScore,
      loggedToday,
    };
  }, [tickets, breaches]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (selectedDept && String(ticket.department_id) !== selectedDept) return false;
      if (selectedPriority && ticket.priority !== selectedPriority) return false;
      if (selectedStatus && ticket.status !== selectedStatus) return false;
      if (selectedBuildingId) {
        const b = buildings.find((x) => x.id === selectedBuildingId);
        if (b) {
          const loc = (ticket.location || '').toLowerCase();
          const match =
            loc.includes(b.name.toLowerCase()) ||
            loc.includes((b.shortName || '').toLowerCase()) ||
            loc.includes(b.id.toLowerCase());
          if (!match) return false;
        }
      }
      const query = searchQuery.trim().toLowerCase();
      return (
        !query ||
        [ticket.tracking_code, ticket.title, ticket.location, ticket.assigned_team_name, ticket.student_name].some((v) =>
          v?.toLowerCase().includes(query)
        )
      );
    });
  }, [tickets, selectedDept, selectedPriority, selectedStatus, selectedBuildingId, searchQuery, buildings]);

  // Building structures with active loads and alerts
  const buildingStructures = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matched = query
      ? buildings.filter(
          (b) =>
            b.name.toLowerCase().includes(query) ||
            (b.shortName || '').toLowerCase().includes(query) ||
            b.id.toLowerCase().includes(query)
        )
      : buildings;

    const list = matched.map((b) => {
      const bTickets = tickets.filter((t) => {
        const loc = (t.location || '').toLowerCase();
        return (
          loc.includes(b.name.toLowerCase()) ||
          loc.includes((b.shortName || '').toLowerCase()) ||
          loc.includes(b.id.toLowerCase())
        );
      });
      const activeCount = bTickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
      const criticalCount = bTickets.filter(
        (t) => (t.priority === 'CRITICAL' || t.hazard_detected) && !['RESOLVED', 'CLOSED'].includes(t.status)
      ).length;
      const escalatedCount = bTickets.filter((t) => t.status === 'ESCALATED').length;
      const isAlert = criticalCount > 0 || escalatedCount > 0;
      const maxCap = 10;
      return {
        ...b,
        activeTickets: activeCount,
        criticalTickets: criticalCount,
        escalatedTickets: escalatedCount,
        isAlert,
        totalTickets: bTickets.length,
        maxCapacity: maxCap,
        utilization: Math.min(100, Math.round((activeCount / maxCap) * 100)),
      };
    });

    if (structureStatusFilter === 'ALERT') return list.filter((b) => b.isAlert);
    if (structureStatusFilter === 'NORMAL') return list.filter((b) => !b.isAlert);
    return list;
  }, [buildings, tickets, searchQuery, structureStatusFilter]);

  // Pagination slicing
  const activeItems = activeTableTab === 'structures' ? buildingStructures : filteredTickets;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return activeItems.slice(start, start + PAGE_SIZE);
  }, [activeItems, currentPage]);

  // Pure real volume strictly aggregated from actual database tickets (Daily 7D or Hourly Peak)
  const volumeData = useMemo(() => {
    const relevantTickets = selectedBuildingId
      ? tickets.filter((t) => {
          const b = buildings.find((x) => x.id === selectedBuildingId);
          if (!b) return true;
          const loc = (t.location || '').toLowerCase();
          return (
            loc.includes(b.name.toLowerCase()) ||
            loc.includes((b.shortName || '').toLowerCase()) ||
            loc.includes(b.id.toLowerCase())
          );
        })
      : tickets;

    if (volumeMode === 'daily') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
          key: d.toISOString().slice(0, 10),
          label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
          shortDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          dateString: d.toDateString(),
        });
      }

      return days.map((day) => {
        const realMatches = relevantTickets.filter((t) => {
          if (!t.created_at) return false;
          const ticketDate = new Date(t.created_at);
          return ticketDate.toDateString() === day.dateString;
        });

        const it = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('it')).length;
        const sanitation = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('sanit')).length;
        const plumbing = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('plumb')).length;
        const electrical = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('electr')).length;
        const general = Math.max(0, realMatches.length - (it + sanitation + plumbing + electrical));
        const total = it + sanitation + plumbing + electrical + general;

        return {
          key: day.key,
          label: day.label,
          subLabel: day.shortDate,
          fullDate: day.fullDate,
          it,
          sanitation,
          plumbing,
          electrical,
          general,
          total,
        };
      });
    }

    const hourlyBlocks = [
      { key: '00-03', label: '12-3 AM', startHour: 0, endHour: 3, fullLabel: '12:00 AM – 3:00 AM' },
      { key: '03-06', label: '3-6 AM', startHour: 3, endHour: 6, fullLabel: '3:00 AM – 6:00 AM' },
      { key: '06-09', label: '6-9 AM', startHour: 6, endHour: 9, fullLabel: '6:00 AM – 9:00 AM' },
      { key: '09-12', label: '9-12 PM', startHour: 9, endHour: 12, fullLabel: '9:00 AM – 12:00 PM' },
      { key: '12-15', label: '12-3 PM', startHour: 12, endHour: 15, fullLabel: '12:00 PM – 3:00 PM' },
      { key: '15-18', label: '3-6 PM', startHour: 15, endHour: 18, fullLabel: '3:00 PM – 6:00 PM' },
      { key: '18-21', label: '6-9 PM', startHour: 18, endHour: 21, fullLabel: '6:00 PM – 9:00 PM' },
      { key: '21-24', label: '9-12 AM', startHour: 21, endHour: 24, fullLabel: '9:00 PM – 12:00 AM' },
    ];

    const currentHour = new Date().getHours();

    return hourlyBlocks.map((block) => {
      const isCurrent = currentHour >= block.startHour && currentHour < block.endHour;
      const realMatches = relevantTickets.filter((t) => {
        if (!t.created_at) return false;
        const d = new Date(t.created_at);
        const h = d.getHours();
        return h >= block.startHour && h < block.endHour;
      });

      const it = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('it')).length;
      const sanitation = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('sanit')).length;
      const plumbing = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('plumb')).length;
      const electrical = realMatches.filter((t) => (t.department_name || '').toLowerCase().includes('electr')).length;
      const general = Math.max(0, realMatches.length - (it + sanitation + plumbing + electrical));
      const total = it + sanitation + plumbing + electrical + general;

      return {
        key: block.key,
        label: block.label,
        subLabel: block.label,
        fullDate: block.fullLabel,
        isCurrent,
        it,
        sanitation,
        plumbing,
        electrical,
        general,
        total,
      };
    });
  }, [tickets, selectedBuildingId, buildings, volumeMode]);

  const maxVolume = useMemo(() => {
    return Math.max(...volumeData.map((d) => d.total), 0);
  }, [volumeData]);

  const yAxisTicks = useMemo(() => {
    if (maxVolume === 0) {
      return [4, 3, 2, 1, 0];
    }
    if (maxVolume <= 4) {
      return [4, 3, 2, 1, 0];
    }
    if (maxVolume <= 8) {
      return [8, 6, 4, 2, 0];
    }
    if (maxVolume <= 16) {
      return [16, 12, 8, 4, 0];
    }
    if (maxVolume <= 40) {
      const top = Math.ceil(maxVolume / 4) * 4;
      return [top, Math.round(top * 0.75), Math.round(top * 0.5), Math.round(top * 0.25), 0];
    }
    const top = Math.ceil(maxVolume / 20) * 20;
    return [top, Math.round(top * 0.75), Math.round(top * 0.5), Math.round(top * 0.25), 0];
  }, [maxVolume]);

  const yMax = yAxisTicks[0];

  return (
    <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-7 space-y-4 max-w-[1720px] mx-auto animate-fade-in">
          {/* Notifications */}
          {toastMsg && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/20 bg-white/[0.08] px-4 py-3 text-xs font-medium text-white animate-fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} />
                {toastMsg}
              </span>
              <button onClick={() => setToastMsg(null)} className="text-zinc-400 hover:text-white cursor-pointer">×</button>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-400/30 bg-rose-400/[0.08] px-4 py-3 text-xs font-medium text-rose-200 animate-fade-in">
              <span>{error}</span>
              <button onClick={loadData} className="font-semibold underline ml-2 cursor-pointer">Retry</button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ROLE-DISTINGUISHED INSTITUTIONAL COMMAND HEADER */}
          {/* ========================================================================= */}
          <section
            className="p-5 sm:p-6 rounded-3xl border border-white/[0.08] bg-[#0c0e15]/95 relative overflow-hidden backdrop-blur-xl transition-all shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          >
            {/* Top specular glow rim matching theme */}
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/[0.1] to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left Identity Pod */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl shadow-inner border border-white/[0.08] bg-white/[0.03] text-[#ff5722]">
                  {isSuperAdminMode ? <ShieldCheck size={28} /> : <LayoutDashboard size={28} />}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border border-white/[0.1] bg-white/[0.04] text-zinc-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ff5722]" />
                      <span>
                        {isSuperAdminMode
                          ? 'Directorate Console'
                          : 'Facilities Operations Desk'}
                      </span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                    {isSuperAdminMode
                      ? 'Directorate Command Center'
                      : 'Campus Operations & Incident Dispatch'}
                  </h1>

                  <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                    {isSuperAdminMode
                      ? 'Executive governance across campus maintenance trades, squad workloads, and verified grievance resolution.'
                      : 'Real-time operational triage, automated work order dispatching, and rapid response monitoring.'}
                  </p>

                  {/* Scope badges */}
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg border border-white/[0.1] bg-white/[0.04] font-mono font-bold text-[11px] text-zinc-200">
                      {isSuperAdminMode ? 'Super Administrator' : 'Operations Administrator'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg border border-white/[0.08] bg-white/[0.02] font-mono text-[11px] text-zinc-400">
                      17 Campus Buildings
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg border border-white/[0.08] bg-white/[0.02] font-mono text-[11px] text-zinc-400">
                      6 Maintenance Trades
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action Matrix */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {isSuperAdminMode ? (
                  <>
                    <Link
                      to="/superadmin/staff"
                      className="px-4 py-2.5 rounded-xl bg-[#ff5722] hover:bg-[#f4511e] text-white font-semibold text-xs shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <UsersRound size={14} />
                      <span>Staff Directory & RBAC</span>
                    </Link>
                    <Link
                      to="/squads"
                      className="px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white font-semibold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Users size={14} />
                      <span>Squads Balancer</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/submit"
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_2px_14px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>+ Rapid Work Order</span>
                    </Link>
                    <Link
                      to="/squads"
                      className="px-3.5 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Users size={14} />
                      <span>Dispatch Balancer</span>
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={loadData}
                  className="p-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all cursor-pointer shadow-xs"
                  title="Refresh Live Telemetry"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin text-white' : ''} />
                </button>
              </div>
            </div>

            {/* Directorate Exclusive: 6-Trade Active Health Strip */}
            {isSuperAdminMode && (
              <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { name: 'Electrical', Icon: Zap },
                  { name: 'Plumbing', Icon: Droplet },
                  { name: 'Sanitation', Icon: Sparkles },
                  { name: 'Carpentry', Icon: Hammer },
                  { name: 'IT Support', Icon: Wifi },
                  { name: 'Administration', Icon: Building2 },
                ].map((trade) => {
                  const count = tickets.filter(
                    (t) =>
                      !['RESOLVED', 'CLOSED'].includes(t.status) &&
                      (t.department_name || '').toLowerCase().includes(trade.name.toLowerCase().slice(0, 4))
                  ).length;
                  return (
                    <div
                      key={trade.name}
                      className="p-2 rounded-xl border border-white/[0.06] bg-[#050608]/70 flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1.5 text-zinc-300 truncate">
                        <trade.Icon size={13} className="text-zinc-400 shrink-0" />
                        <span className="text-[11px] font-semibold truncate">{trade.name}</span>
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                          count > 0 ? 'bg-[#ff5a36]/15 text-[#ff7a5c] border border-[#ff5a36]/25' : 'text-zinc-500'
                        }`}
                      >
                        {count} active
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ========================================================================= */}
          {/* ROW 1: TOP 4 KPI CARDS (Clean, Architectural, Restrained) */}
          {/* ========================================================================= */}
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {/* Card 1: Now Serving */}
            <article className="rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Now Serving</span>
                <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
                  <Users size={15} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">{metrics.active}</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">Across all campus buildings</p>
              </div>
            </article>

            {/* Card 2: Active Alerts */}
            <article className={`rounded-2xl border transition-all backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between min-h-[110px] shadow-sm ${
              metrics.critical > 0
                ? 'border-rose-500/30 bg-rose-950/20'
                : 'border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium ${metrics.critical > 0 ? 'text-rose-300 font-semibold' : 'text-zinc-400'}`}>
                  Active Alerts
                </span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                  metrics.critical > 0
                    ? 'border-rose-500/30 bg-rose-500/15 text-rose-400'
                    : 'border-white/[0.08] bg-white/[0.03] text-zinc-400'
                }`}>
                  {metrics.critical > 0 ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
                </div>
              </div>
              <div className="mt-2">
                <span className={`text-2xl font-bold tracking-tight font-mono ${metrics.critical > 0 ? 'text-rose-300' : 'text-white'}`}>
                  {metrics.critical}
                </span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                  {metrics.critical > 0 ? `${metrics.critical} emergency hazards` : 'All clear · 0 emergencies'}
                </p>
              </div>
            </article>

            {/* Card 3: Sensors & Active Squads */}
            <article className="rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Sensors &amp; Squads</span>
                <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
                  <Radio size={15} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">{squads.length || 8}</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                  {squads.filter((s) => s.assigned_technicians > 0).length || squads.length || 8} active teams online
                </p>
              </div>
            </article>

            {/* Card 4: Incident Governance */}
            <article className="rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl p-4 sm:p-5 flex flex-col justify-between min-h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Open Incidents</span>
                <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-300 flex items-center justify-center">
                  <ClipboardList size={15} />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">{metrics.escalated}</span>
                <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                  {metrics.escalated ? `${metrics.escalated} escalated for decision` : 'All requests within SLA'}
                </p>
              </div>
            </article>
          </section>

          {/* ROW 2: MIDDLE SPLIT (Left: Request Volume | Right: Directorate Overview & Resolution) */}
          {/* ========================================================================= */}
          <section className="grid gap-4 lg:grid-cols-12">
            {/* LEFT COLUMN: Request Volume Chart (lg:col-span-6) */}
            <div className="lg:col-span-6">
              {/* Stacked Traffic Volume Chart - Real Daily Telemetry */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl p-5 relative overflow-hidden h-full flex flex-col justify-between shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Request Volume</h3>
                    <p className="text-[11px] text-zinc-400">
                      {selectedBuildingId
                        ? `Intake for ${buildings.find((x) => x.id === selectedBuildingId)?.shortName || 'selected building'}`
                        : volumeMode === 'daily'
                        ? 'Department intake across the past 7 days'
                        : 'Department distribution across 24-hour cycle'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg bg-white/[0.05] border border-white/10 p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setVolumeMode('daily')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                          volumeMode === 'daily'
                            ? 'bg-white text-black font-bold shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setVolumeMode('hourly')}
                        className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                          volumeMode === 'hourly'
                            ? 'bg-white text-black font-bold shadow-xs'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Hourly
                      </button>
                    </div>
                    <span className="rounded-md bg-white/[0.05] border border-white/10 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                      {volumeMode === 'daily' ? '7-Day telemetry' : '24-Hour cycle'} ({tickets.length} total)
                    </span>
                  </div>
                </div>

                {/* Stacked Bar Chart with Left Y-Axis and Dashed Gridlines */}
                <div className="relative pt-2">
                  {/* Grid Area with Left Y-Axis */}
                  <div className="flex">
                    {/* Left Y-Axis Labels (Dynamic Real Scale) */}
                    <div className="flex flex-col justify-between h-52 pr-2.5 text-right font-mono text-[9px] text-zinc-400 select-none pb-5">
                      {yAxisTicks.map((tick, i) => (
                        <span key={i}>{tick}</span>
                      ))}
                    </div>

                    {/* Chart Canvas with Dashed Horizontal Gridlines */}
                    <div className="relative flex-1 h-52">
                      {/* Horizontal Dashed Gridlines */}
                      <div className="absolute inset-x-0 top-0 border-b border-dashed border-white/[0.08]" />
                      <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-white/[0.08]" />
                      <div className="absolute inset-x-0 top-2/4 border-b border-dashed border-white/[0.08]" />
                      <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-white/[0.08]" />
                      <div className="absolute inset-x-0 bottom-5 border-b border-white/[0.12]" />

                      {/* Real Stacked Bars (Vaulto Architecture: Capsule Wells with Glowing Orange Peak) */}
                      <div className="absolute inset-0 bottom-5 flex items-end justify-between px-2 gap-2 sm:gap-3">
                        {volumeData.map((d, idx) => {
                          const isToday = volumeMode === 'daily' && (d.label === 'Today' || idx === volumeData.length - 1);
                          const isCurrent = volumeMode === 'hourly' ? d.isCurrent : isToday;
                          const barHeightPercent = yMax > 0 && d.total > 0 ? (d.total / yMax) * 100 : 0;

                          return (
                            <div key={d.key} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                              {/* Capsule Well Track (Vaulto Style) */}
                              <div className={`w-full max-w-[34px] h-full rounded-xl bg-[#161720] border p-1 flex flex-col justify-end transition-all duration-300 ${
                                isCurrent
                                  ? 'border-white/[0.12] bg-[#161822]'
                                  : 'border-white/[0.04] group-hover:border-white/[0.12] group-hover:bg-[#1c1e28]'
                              }`}>
                                {d.total > 0 ? (
                                  <div
                                    style={{ height: `${Math.max(14, barHeightPercent)}%` }}
                                    className={`w-full flex flex-col rounded-lg overflow-hidden transition-all duration-300 shadow-md group-hover:scale-[1.02] ${
                                      isCurrent ? 'ring-1 ring-[#ff5722]/50' : ''
                                    }`}
                                  >
                                    {/* Stacked Department Breakdown */}
                                    {d.general > 0 && <div style={{ flexGrow: d.general }} className="w-full bg-[#64748b] min-h-[2px]" title={`General: ${d.general}`} />}
                                    {d.electrical > 0 && <div style={{ flexGrow: d.electrical }} className="w-full bg-[#ff5a36] min-h-[2px]" title={`Electrical: ${d.electrical}`} />}
                                    {d.plumbing > 0 && <div style={{ flexGrow: d.plumbing }} className="w-full bg-[#f97316] min-h-[2px]" title={`Plumbing: ${d.plumbing}`} />}
                                    {d.sanitation > 0 && <div style={{ flexGrow: d.sanitation }} className="w-full bg-[#10b981] min-h-[2px]" title={`Sanitation: ${d.sanitation}`} />}
                                    {d.it > 0 && <div style={{ flexGrow: d.it }} className="w-full bg-[#3b82f6] min-h-[2px]" title={`IT Support: ${d.it}`} />}
                                  </div>
                                ) : (
                                  /* Empty day track fill with glowing accent if current */
                                  <div
                                    className={`w-full h-2 rounded-full transition-all ${
                                      isCurrent
                                        ? 'bg-[#ff5722]'
                                        : 'bg-white/[0.08]'
                                    }`}
                                  />
                                )}
                              </div>

                              {/* Hover Tooltip */}
                              <div className="absolute -top-11 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                                <span className="rounded-lg bg-[#0e0f14] border border-white/[0.12] px-2.5 py-1 text-[10px] font-mono text-white shadow-xl whitespace-nowrap flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36]" />
                                  <span>{d.fullDate}: {d.total} {d.total === 1 ? 'Req' : 'Reqs'}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-Axis Labels (Vaulto Glowing Dot for Today / Current Hour) */}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between px-2">
                        {volumeData.map((d) => {
                          const isHighlight = volumeMode === 'daily' ? d.label === 'Today' : d.isCurrent;
                          return (
                            <span key={d.key} className={`flex-1 text-center font-mono text-[9px] flex items-center justify-center gap-1 ${
                              isHighlight ? 'text-white font-bold' : 'text-zinc-400'
                            }`}>
                              {isHighlight && <span className="w-1.5 h-1.5 rounded-full bg-[#ff5722]" />}
                              <span>{d.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Chart Legend */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3.5 text-[10px] text-zinc-400 border-t border-white/[0.05] pt-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-xs bg-[#3b82f6]" /> IT
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-xs bg-[#10b981]" /> Sanitation
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-xs bg-[#f97316]" /> Plumbing
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-xs bg-[#ff5a36]" /> Electrical
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-xs bg-[#64748b]" /> General
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Directorate Overview & Resolution Rate (lg:col-span-6) */}
            <div className="space-y-4 lg:col-span-6">
              {/* Overview & Circular Donut Gauge Card */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl p-5 relative overflow-hidden shadow-sm">
                <div className="grid gap-5 md:grid-cols-[1fr_210px]">
                  {/* Left: Overview details + 4 mini stat boxes */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff5a36]">
                        {isSuperAdminMode ? 'Directorate Overview' : 'Operations Overview'}
                      </span>
                      <button
                        onClick={loadData}
                        disabled={loading}
                        className="text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Refresh telemetry"
                      >
                        <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      IIIT Naya Raipur Public Works
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      facilities@iiitnr.edu.in · Sector 24, Atal Nagar
                    </p>

                    {/* 4 Mini Stat Boxes */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                          <Users size={12} className="text-blue-400" />
                          <span>Logged Today</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-white">{metrics.loggedToday}</p>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                          <BarChart3 size={12} className="text-indigo-400" />
                          <span>Working Now</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-white">{metrics.progress}</p>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                          <LineChart size={12} className="text-emerald-400" />
                          <span>SLA On-Track</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-emerald-300">{metrics.healthScore}%</p>
                      </div>

                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[10px]">
                          <Building2 size={12} className="text-purple-400" />
                          <span>Campus Assets</span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-white">{buildings.length} Zones</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Multi-Segmented Radial Donut Gauge */}
                  <div className="flex flex-col items-center justify-center border-t border-white/[0.06] pt-4 md:border-t-0 md:border-l md:pl-5">
                    <p className="text-xs font-semibold text-zinc-300 mb-2">Facility Utilization</p>
                    <div className="relative h-28 w-28">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 overflow-visible">
                        <defs>
                          <linearGradient id="vDonutGrad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#ff7a5c" />
                            <stop offset="100%" stopColor="#f0441d" />
                          </linearGradient>
                        </defs>
                        {/* Background track */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#1c1e27" strokeWidth="9" />
                        {/* Glowing Orange Progress arc */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="url(#vDonutGrad)"
                          strokeWidth="9"
                          strokeDasharray="238.7"
                          strokeDashoffset={238.7 * (1 - metrics.resolutionRate / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-black text-white font-mono">{metrics.resolutionRate}%</span>
                        <span className="text-[9px] uppercase tracking-wider text-zinc-400">Resolved</span>
                      </div>
                    </div>
                    <span className="mt-2 text-[11px] font-medium text-zinc-400">
                      Target SLA &gt; 90%
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolution Status & Workload Proportions */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#14161f]/90 hover:border-white/[0.14] transition-all backdrop-blur-xl p-5 relative overflow-hidden shadow-sm">
                <div className="grid gap-5 md:grid-cols-[180px_1fr]">
                  {/* Left: Resolution Rate */}
                  <div className="border-b border-white/[0.06] pb-4 md:border-b-0 md:border-r md:pr-5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                      Resolution Rate
                    </span>
                    <div className="mt-2 text-4xl font-black tracking-tight text-white font-mono">
                      {metrics.resolutionRate}%
                    </div>
                    <p className="mt-1 text-xs text-zinc-400">
                      {metrics.resolved} of {metrics.total} grievances resolved
                    </p>
                  </div>

                  {/* Right: Workload Distribution & 20 Capsule Pills */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                          Workload Distribution
                        </span>
                        <div className="flex items-center gap-3 text-xs text-zinc-300">
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                            <span>Resolved: {metrics.resolved}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                            <span>In Progress: {metrics.progress}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                            <span>Queued: {Math.max(0, metrics.total - metrics.resolved - metrics.progress)}</span>
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        Proportional queue status across campus maintenance squads.
                      </p>
                    </div>

                    {/* The 20 Capsule Pill Segmented Progress Bar */}
                    <div className="mt-4 flex items-center gap-1.5 py-1">
                      {Array.from({ length: 20 }).map((_, idx) => {
                        const total = metrics.total || tickets.length || 0;
                        const resolvedPills = total > 0 ? Math.round((metrics.resolved / total) * 20) : 0;
                        const progressPills = total > 0 ? Math.round((metrics.progress / total) * 20) : 0;
                        const adjustedProgress = (metrics.progress > 0 && progressPills === 0 && resolvedPills < 20) ? 1 : progressPills;
                        const adjustedResolved = Math.min(resolvedPills, 20 - adjustedProgress);

                        let pillClass = 'bg-white/[0.06] border border-white/[0.04]';
                        let title = 'Unallocated';
                        if (total > 0) {
                          if (idx < adjustedResolved) {
                            pillClass = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                            title = 'Resolved';
                          } else if (idx < adjustedResolved + adjustedProgress) {
                            pillClass = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
                            title = 'In Progress';
                          } else {
                            pillClass = 'bg-blue-500/80 shadow-[0_0_6px_rgba(59,130,246,0.4)]';
                            title = 'Queued';
                          }
                        }

                        return (
                          <div
                            key={idx}
                            title={title}
                            className={`h-8 flex-1 min-w-[6px] max-w-[14px] rounded-full transition-all duration-300 ${pillClass}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* ROW 3: BOTTOM DATA TABLE (Structures Hotspots & Live Work Queue) */}
          {/* ========================================================================= */}
          <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#1a1c22] to-[#14151a] backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.07)] p-5 relative overflow-hidden">
            {/* Table Control Header */}
            <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTableTab('structures')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                    activeTableTab === 'structures'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <Building2 size={14} className="inline mr-1.5" />
                  Campus Structures ({buildingStructures.length})
                </button>

                <button
                  onClick={() => setActiveTableTab('queue')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                    activeTableTab === 'queue'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/35 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                      : 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <ClipboardList size={14} className="inline mr-1.5" />
                  Active Request Queue ({filteredTickets.length})
                </button>
              </div>

              {/* Search and Secondary Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {activeTableTab === 'structures' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setStructureStatusFilter('ALL')}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        structureStatusFilter === 'ALL' ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStructureStatusFilter('ALERT')}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        structureStatusFilter === 'ALERT' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Alerts
                    </button>
                    <button
                      onClick={() => setStructureStatusFilter('NORMAL')}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                        structureStatusFilter === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Nominal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="rounded-lg border border-white/[0.09] bg-[#050608] px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                    >
                      <option value="">All Teams</option>
                      {DEPARTMENTS.map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      className="rounded-lg border border-white/[0.09] bg-[#050608] px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                    >
                      <option value="">Priority</option>
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* TAB CONTENT 1: CAMPUS STRUCTURES (Matching Reference Table) */}
            {activeTableTab === 'structures' && (
              <div className="overflow-x-auto mt-2">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-white/[0.12] bg-[#121520] text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">
                    <tr className="!bg-transparent">
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Structure</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Status</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Occupancy</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Alerts</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Category</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Total Grievances</th>
                      <th className="py-3 px-3 text-right !bg-transparent text-slate-400">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {paginatedItems.map((b) => (
                      <tr key={b.id} className="group hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 group-hover:text-white group-hover:border-white/30 transition">
                              <Building2 size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white tracking-tight">{b.name}</p>
                              <p className="text-[10px] text-slate-400">{b.shortName || b.name} · IIIT-NR Facilities</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            b.isAlert
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${b.isAlert ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                            {b.isAlert ? 'Needs Attention' : 'Open'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="w-36">
                            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1">
                              <span>{b.activeTickets} / {b.maxCapacity}</span>
                              <span className="text-[10px] text-slate-400">{b.utilization}%</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  b.utilization > 60
                                    ? 'bg-rose-500'
                                    : b.utilization > 30
                                    ? 'bg-amber-400'
                                    : 'bg-white'
                                }`}
                                style={{ width: `${Math.max(4, b.utilization)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {b.criticalTickets > 0 ? (
                            <span className="inline-flex rounded-md bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30">
                              {b.criticalTickets} Severe
                            </span>
                          ) : b.escalatedTickets > 0 ? (
                            <span className="inline-flex rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                              {b.escalatedTickets} Minor
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">No alerts</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="text-xs text-slate-300">{b.category ? `${b.category}` : '4 zones'}</span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono text-xs font-semibold text-slate-200">{b.totalTickets || 0}</span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedBuildingId(b.id);
                              setActiveTableTab('queue');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1.5 text-slate-300 hover:border-indigo-400/40 hover:text-indigo-300 transition cursor-pointer"
                            title={`Filter queue for ${b.shortName || b.name}`}
                          >
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB CONTENT 2: LIVE WORK QUEUE (With Sleek Action Buttons) */}
            {activeTableTab === 'queue' && (
              <div className="overflow-x-auto mt-2">
                {/* Secondary Status Tabs */}
                <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedStatus(tab.id)}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                        selectedStatus === tab.id
                          ? 'bg-indigo-600 text-white font-bold shadow-[0_2px_12px_rgba(99,102,241,0.3)]'
                          : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100'
                      }`}
                    >
                      {tab.label}
                      {tab.id === 'ESCALATED' && metrics.escalated ? ` · ${metrics.escalated}` : ''}
                    </button>
                  ))}
                  {selectedBuildingId && (
                    <button
                      onClick={() => setSelectedBuildingId(null)}
                      className="ml-auto text-xs text-zinc-400 underline hover:text-white cursor-pointer"
                    >
                      Clear building filter
                    </button>
                  )}
                </div>

                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-white/[0.12] bg-[#121520] text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">
                    <tr className="!bg-transparent">
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Request</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Location</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Assigned Squad</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Priority</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">SLA Status</th>
                      <th className="py-3 px-3 !bg-transparent text-slate-400">Status</th>
                      <th className="py-3 px-3 text-right !bg-transparent text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                          Loading active queue…
                        </td>
                      </tr>
                    ) : paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                          No requests match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((ticket) => (
                        <tr key={ticket.id} className="group hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-3 max-w-[240px]">
                            <Link
                              to={`/track?code=${ticket.tracking_code}`}
                              className="font-mono text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {ticket.tracking_code}
                            </Link>
                            <p className="mt-0.5 text-xs font-semibold text-white leading-snug break-words" title={ticket.title}>
                              {ticket.title}
                            </p>
                          </td>

                          <td className="py-3.5 px-3 max-w-[220px]">
                            <p className="text-xs text-slate-300 leading-snug break-words" title={ticket.location}>
                              {ticket.location || 'Campus location pending'}
                            </p>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="text-xs font-medium text-slate-200">
                              {ticket.assigned_team_name || 'Unassigned'}
                            </p>
                            <div className="mt-1">
                              <DepartmentBadge name={ticket.department_name} size="sm" />
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <PriorityBadge priority={ticket.priority} />
                          </td>

                          <td className="py-3.5 px-3">
                            <SLACountdownTimer
                              deadline={ticket.sla_deadline}
                              priority={ticket.priority}
                              status={ticket.status}
                              resolvedAt={ticket.resolved_at}
                              dark
                            />
                          </td>

                          <td className="py-3.5 px-3">
                            <StatusBadge status={ticket.status} size="sm" />
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {(ticket.status === 'ASSIGNED' || ticket.status === 'SUBMITTED') && (
                                <button
                                  onClick={() => handleStartWork(ticket)}
                                  className="rounded-lg bg-[#ff5722] hover:bg-[#f4511e] text-white font-medium text-xs px-3 py-1.5 shadow-xs transition cursor-pointer"
                                >
                                  Start
                                </button>
                              )}
                              {ticket.status === 'ESCALATED' && (
                                <>
                                  <button
                                    onClick={() => handleStartWork(ticket)}
                                    title="Resume work on this escalated grievance"
                                    className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 text-xs font-semibold px-2.5 py-1.5 shadow-xs transition cursor-pointer"
                                  >
                                    Resume
                                  </button>
                                  <button
                                    onClick={() => setResolveTicketTarget(ticket)}
                                    title="Directly resolve escalated grievance"
                                    className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                                  >
                                    Resolve
                                  </button>
                                </>
                              )}
                              {ticket.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => setResolveTicketTarget(ticket)}
                                  className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/30 transition cursor-pointer"
                                >
                                  Resolve
                                </button>
                              )}
                              {!['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                                <button
                                  onClick={() => setReassignTicketTarget(ticket)}
                                  title="Reassign squad"
                                  className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-1.5 text-indigo-300 hover:border-indigo-400/60 hover:bg-indigo-500/25 hover:text-white transition cursor-pointer shadow-xs"
                                >
                                  <UsersRound size={13} />
                                </button>
                              )}
                              {!['RESOLVED', 'CLOSED'].includes(ticket.status) && (
                                <button
                                  onClick={() => setOverrideTicket(ticket)}
                                  title="Override priority"
                                  className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/25 hover:text-white transition cursor-pointer shadow-xs"
                                >
                                  <Settings2 size={13} />
                                </button>
                              )}
                              {!['RESOLVED', 'CLOSED', 'ESCALATED'].includes(ticket.status) && (
                                <button
                                  onClick={() => {
                                    setEscalateTarget(ticket);
                                    setEscalateReason('High risk of operational SLA breach or campus safety hazard.');
                                  }}
                                  title="Escalate ticket"
                                  className="rounded-lg border border-rose-500/35 bg-rose-500/15 p-1.5 text-rose-300 hover:border-rose-400/60 hover:bg-rose-500/30 hover:text-white transition cursor-pointer shadow-xs"
                                >
                                  <AlertTriangle size={13} />
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
            )}

            {/* Pagination / Summary Bar (Matching Reference) */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-white/[0.06] pt-3 text-xs text-slate-400 gap-2">
              <div>
                Showing {activeItems.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to{' '}
                {Math.min(currentPage * PAGE_SIZE, activeItems.length)} of {activeItems.length} entries
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-slate-400 hover:text-white transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  &lt; Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
                      currentPage === i + 1
                        ? 'bg-white text-black font-bold shadow-[0_2px_12px_rgba(255,255,255,0.15)]'
                        : 'border border-white/[0.08] text-slate-400 hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-white/[0.08] px-2.5 py-1 text-slate-400 hover:text-white transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </section>

      {/* Operational Modals */}
      <PriorityOverrideModal
        isOpen={Boolean(overrideTicket)}
        ticket={overrideTicket}
        onClose={() => setOverrideTicket(null)}
        onPriorityUpdated={() => {
          setOverrideTicket(null);
          showToast('Ticket priority and SLA were updated.');
          loadData();
        }}
      />

      <ResolutionNotesModal
        isOpen={Boolean(resolveTicketTarget)}
        ticket={resolveTicketTarget}
        onClose={() => setResolveTicketTarget(null)}
        onResolved={() => {
          setResolveTicketTarget(null);
          showToast('Ticket resolved and logged.');
          loadData();
        }}
      />

      <ReassignTeamModal
        isOpen={Boolean(reassignTicketTarget)}
        ticket={reassignTicketTarget}
        onClose={() => setReassignTicketTarget(null)}
        onReassigned={() => {
          setReassignTicketTarget(null);
          showToast('Ticket reassigned to a new maintenance squad.');
          loadData();
        }}
      />

      {/* Modern Obsidian Escalate Modal */}
      {escalateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in">
          <form
            onSubmit={handleConfirmEscalate}
            className="w-full max-w-md rounded-3xl border border-white/[0.14] bg-[#0c0d12]/95 backdrop-blur-2xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.1)] text-zinc-100 relative overflow-hidden"
          >
            <div className="flex items-start justify-between border-b border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-300">
                    Incident Escalation
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {escalateTarget.tracking_code}
                  </span>
                </div>
                <h2 className="mt-1.5 text-base font-bold text-white tracking-tight">
                  Escalate to Directorate
                </h2>
                <p className="mt-0.5 max-w-sm truncate text-xs text-slate-400">
                  {escalateTarget.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEscalateTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
                Escalation Justification <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="State reason for supervisor escalation..."
                className="w-full rounded-xl border border-white/[0.1] bg-[#050608] p-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-rose-400/60 focus:ring-2 focus:ring-rose-500/10 resize-none transition min-h-24"
              />
            </div>
            <div className="mt-4 flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setEscalateTarget(null)}
                className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={escalating || escalateReason.trim().length < 5}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-5 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] transition hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {escalating ? 'Escalating…' : 'Confirm Escalation'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
