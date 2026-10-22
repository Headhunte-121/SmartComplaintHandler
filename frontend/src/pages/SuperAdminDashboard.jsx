/**
 * SmartComplaintHandler - Campus Facilities Directorate Overview (v2 Refresh)
 * Style: Dark Enterprise Command Center with Ambient Cyan/Emerald Lighting & Modern Typography
 * Reference: Executive Oversight telemetry, departmental operational stability,
 * building fault density, and SLA exception monitoring across IIIT Naya Raipur.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchAdmins } from '../api/auth';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import { fetchDirectorateTelemetry } from '../api/superadmin';
import { fetchAndCacheCampusBuildings, getCampusBuildings } from '../data/iiitnrCampusData';

// ============================================================================
// Constants & Configuration
// ============================================================================

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

// Facility Category Badges with consistent subdued dark enterprise tones
const CATEGORY_COLORS = {
  ACADEMIC: { bg: '#1C2430', border: '#343E4B', text: '#38BDF8' },
  HOSTEL: { bg: '#1C2430', border: '#343E4B', text: '#00B386' },
  DINING: { bg: '#1C2430', border: '#343E4B', text: '#FBBF24' },
  CULTURE: { bg: '#1C2430', border: '#343E4B', text: '#C084FC' },
  SPORTS: { bg: '#1C2430', border: '#343E4B', text: '#2DD4BF' },
  AMENITY: { bg: '#1C2430', border: '#343E4B', text: '#94A3B8' },
  ADMIN: { bg: '#1C2430', border: '#343E4B', text: '#F1F5F9' },
};

// ============================================================================
// Helper Formatting & Normalization Functions
// ============================================================================

function normStatus(status) {
  return String(status || '').toUpperCase().trim();
}

function isResolvedStatus(status) {
  return ['RESOLVED', 'CLOSED'].includes(normStatus(status));
}

function isCancelledStatus(status) {
  return ['CANCELLED', 'REJECTED'].includes(normStatus(status));
}

function isActiveStatus(status) {
  return !isResolvedStatus(status) && !isCancelledStatus(status);
}

function isPendingStatus(status) {
  return ['SUBMITTED', 'PENDING', 'ASSIGNED'].includes(normStatus(status));
}

function isInProgressStatus(status) {
  return ['IN_PROGRESS', 'ESCALATED', 'ON_HOLD'].includes(normStatus(status));
}

function isCriticalTicket(t) {
  const p = normStatus(t.priority);
  return (p === 'CRITICAL' || Boolean(t.hazard_detected)) && isActiveStatus(t.status);
}

function getTicketTitle(ticket) {
  return (
    ticket.title ||
    ticket.issue_title ||
    ticket.subject ||
    ticket.description ||
    ticket.complaint ||
    'Maintenance request'
  );
}

function getTicketId(ticket, index) {
  return (
    ticket.tracking_code ||
    ticket.ticket_code ||
    ticket.complaint_code ||
    ticket.code ||
    ticket.id ||
    ticket._id ||
    `#${String(index + 1).padStart(4, '0')}`
  );
}

function getTicketDepartmentName(ticket) {
  if (ticket.department_name) return ticket.department_name;
  if (typeof ticket.department === 'string') return ticket.department;
  if (ticket.department && typeof ticket.department === 'object') {
    return ticket.department.name || '';
  }
  if (ticket.department_id) {
    const DEPT_MAP = {
      1: 'Electrical',
      2: 'Plumbing',
      3: 'Sanitation',
      4: 'Carpentry',
      5: 'IT Support',
      6: 'General Administration',
    };
    return DEPT_MAP[ticket.department_id] || '';
  }
  return '';
}

function matchDept(ticket, dept) {
  const tDept = String(getTicketDepartmentName(ticket) || '').toLowerCase().trim();
  const target = String(dept || '').toLowerCase().trim();
  return tDept === target || tDept.includes(target) || target.includes(tDept);
}

function formatTicketDate(ticket) {
  const value = ticket.created_at || ticket.createdAt || ticket.submitted_at || ticket.submittedAt;
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusLabel(status) {
  return String(status || 'SUBMITTED')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusBadgeClass(status) {
  const value = normStatus(status);
  if (['RESOLVED', 'CLOSED'].includes(value)) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  if (['IN_PROGRESS', 'ESCALATED'].includes(value)) {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
  }
  if (['ASSIGNED'].includes(value)) {
    return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  }
  if (['ON_HOLD'].includes(value)) {
    return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
  }
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
}

function getPriorityBadgeClass(priority) {
  const value = normStatus(priority || 'MEDIUM');
  if (value === 'CRITICAL') return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
  if (value === 'HIGH') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  if (value === 'LOW') return 'border-slate-600 bg-slate-800 text-slate-300';
  return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [telemetry, setTelemetry] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [telemetryRes, adminList, teamList, ticketList, breachList, buildingList] =
        await Promise.all([
          fetchDirectorateTelemetry().catch(() => null),
          fetchAdmins().catch(() => []),
          fetchSquadWorkloads().catch(() => []),
          fetchComplaints({ limit: 1000 }).catch(() => []),
          fetchActiveBreaches(0.20).catch(() => []),
          fetchAndCacheCampusBuildings().catch(() => getCampusBuildings()),
        ]);

      if (telemetryRes) {
        setTelemetry(telemetryRes);
      }
      setAdmins(Array.isArray(adminList) ? adminList : adminList?.admins || adminList?.users || []);
      setTeams(Array.isArray(teamList) ? teamList : teamList?.workloads || teamList?.teams || []);
      setTickets(Array.isArray(ticketList) ? ticketList : ticketList?.tickets || ticketList?.data || []);
      setBreaches(Array.isArray(breachList) ? breachList : breachList?.breaches || []);
      if (Array.isArray(buildingList) && buildingList.length > 0) {
        setBuildings(buildingList);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to refresh directorate executive telemetry:', err);
      setError('Failed to refresh directorate executive telemetry. Check network connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Executive KPI Calculations
  const serverTotal = telemetry?.kpis?.total_tickets;
  const clientTotal = tickets.length;
  const totalTickets = typeof serverTotal === 'number' ? Math.max(serverTotal, clientTotal) : clientTotal;

  const clientPending = tickets.filter((t) => isPendingStatus(t.status)).length;
  const clientInProgress = tickets.filter((t) => isInProgressStatus(t.status)).length;
  const clientResolved = tickets.filter((t) => isResolvedStatus(t.status)).length;

  const pendingTickets =
    typeof telemetry?.kpis?.pending_tickets === 'number'
      ? telemetry.kpis.pending_tickets
      : clientPending;

  const inProgressTickets =
    typeof telemetry?.kpis?.in_progress_tickets === 'number'
      ? telemetry.kpis.in_progress_tickets
      : clientInProgress;

  const resolvedTickets =
    typeof telemetry?.kpis?.resolved_tickets === 'number'
      ? telemetry.kpis.resolved_tickets
      : clientResolved;

  const activeLoad =
    typeof telemetry?.kpis?.active_load === 'number'
      ? telemetry.kpis.active_load
      : pendingTickets + inProgressTickets;

  const resolutionRate =
    typeof telemetry?.kpis?.resolution_rate === 'number'
      ? telemetry.kpis.resolution_rate
      : totalTickets > 0
      ? Math.round((resolvedTickets / totalTickets) * 100)
      : 100;

  const clientCritical = tickets.filter((t) => isCriticalTicket(t)).length;
  const criticalTickets =
    typeof telemetry?.kpis?.critical_tickets === 'number'
      ? telemetry.kpis.critical_tickets
      : clientCritical;

  // Breach tracking
  const apiOverdue = breaches.filter(
    (b) => b.is_breached || b.breached || (b.overdue_seconds && b.overdue_seconds > 0)
  ).length;

  const apiApproaching = breaches.filter(
    (b) => !b.is_breached && !b.breached && (b.remaining_seconds && b.remaining_seconds > 0)
  ).length;

  const ticketOverdue = tickets.filter((t) => {
    if (!isActiveStatus(t.status)) return false;
    const dl = t.sla_deadline || t.target_resolution_date;
    if (!dl) return false;
    const dlTime = new Date(dl).getTime();
    return !Number.isNaN(dlTime) && dlTime < Date.now();
  }).length;

  const ticketApproaching = tickets.filter((t) => {
    if (!isActiveStatus(t.status)) return false;
    const dl = t.sla_deadline || t.target_resolution_date;
    if (!dl) return false;
    const dlTime = new Date(dl).getTime();
    const diff = dlTime - Date.now();
    return !Number.isNaN(dlTime) && diff > 0 && diff <= 12 * 3600 * 1000;
  }).length;

  const overdueBreaches =
    typeof telemetry?.kpis?.overdue_breaches === 'number'
      ? telemetry.kpis.overdue_breaches
      : Math.max(apiOverdue, ticketOverdue);

  const approachingBreaches =
    typeof telemetry?.kpis?.approaching_breaches === 'number'
      ? telemetry.kpis.approaching_breaches
      : Math.max(apiApproaching, ticketApproaching);

  const slaCompliance =
    typeof telemetry?.kpis?.sla_compliance === 'number'
      ? telemetry.kpis.sla_compliance
      : totalTickets > 0
      ? Math.max(0, Math.min(100, Math.round(((totalTickets - overdueBreaches) / totalTickets) * 100)))
      : 100;

  const fieldSquadsCount =
    typeof telemetry?.kpis?.field_squads_count === 'number'
      ? telemetry.kpis.field_squads_count
      : teams.length > 0
      ? teams.length
      : 8;

  const staffCount =
    typeof telemetry?.kpis?.staff_count === 'number'
      ? telemetry.kpis.staff_count
      : admins.length > 0
      ? admins.length
      : 11;

  // Department distribution with server synchronization and authentic health calculation
  const departmentStats = useMemo(() => {
    return CAMPUS_DEPARTMENTS.map((dept) => {
      const serverDept = telemetry?.department_stats?.find((d) => d.name === dept);

      const deptTickets = tickets.filter((t) => matchDept(t, dept));
      const clientDeptTotal = deptTickets.length;
      const clientDeptActive = deptTickets.filter((t) => isActiveStatus(t.status)).length;
      const clientDeptResolved = deptTickets.filter((t) => isResolvedStatus(t.status)).length;

      const total =
        typeof serverDept?.total === 'number'
          ? Math.max(serverDept.total, clientDeptTotal)
          : clientDeptTotal;
      const active =
        typeof serverDept?.active === 'number' ? serverDept.active : clientDeptActive;
      const resolved =
        typeof serverDept?.resolved === 'number' ? serverDept.resolved : clientDeptResolved;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : (serverDept?.rate ?? 100);

      // Health calculation: 100 if zero active faults, reduced based on open backlog severity
      const penalty = active * 6 + (active > 3 ? 12 : 0);
      const health =
        typeof serverDept?.health === 'number'
          ? serverDept.health
          : Math.max(55, Math.min(100, 100 - penalty));

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
  }, [tickets, telemetry]);

  // Campus building distribution
  const buildingStats = useMemo(() => {
    const list = buildings.map((b) => {
      const matchedTickets = tickets.filter((t) => {
        const loc = (t.location || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const bShort = (b.shortName || b.short_name || '').toLowerCase();
        const bId = (b.id || '').toLowerCase();
        return (
          (bName && loc.includes(bName)) ||
          (bShort && loc.includes(bShort)) ||
          (bId && loc.includes(bId)) ||
          (bShort.includes('ramanujan') && loc.includes('ramanujan')) ||
          (bShort.includes('bose') && (loc.includes('bose') || loc.includes('h1') || loc.includes('hostel 1'))) ||
          (bShort.includes('bhabha') && (loc.includes('bhabha') || loc.includes('h2') || loc.includes('hostel 2'))) ||
          (bShort.includes('academic') && (loc.includes('academic') || loc.includes('science') || loc.includes('lab')))
        );
      });
      const active = matchedTickets.filter((t) => isActiveStatus(t.status)).length;
      return {
        id: b.id,
        name: b.name,
        shortName: b.shortName || b.short_name || b.name,
        category: b.category || 'FACILITY',
        color: b.trace?.color || b.mapPin?.color || b.color || '#00B386',
        trace: b.trace,
        mapPin: b.mapPin || b.map_pin,
        total: matchedTickets.length,
        active,
      };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [buildings, tickets]);

  const handleFacilityClick = (building) => {
    navigate(`/track?search=${encodeURIComponent(building.shortName)}`);
  };

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || a.submitted_at || 0).getTime();
        const dateB = new Date(b.created_at || b.createdAt || b.submitted_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [tickets]);

  return (
    <div
      className="modern-directorate w-full min-h-screen bg-[#0D1117] text-[#F1F5F9] font-sans antialiased box-border transition-colors duration-200"
      style={{
        '--page-bg': '#0D1117',
        '--navigation-bg': '#0B0F14',
        '--surface': '#161C24',
        '--surface-raised': '#1C2430',
        '--border': '#252D38',
        '--border-strong': '#343E4B',
        '--text-primary': '#F1F5F9',
        '--text-secondary': '#94A3B8',
        '--text-muted': '#64748B',
        '--accent': '#00B386',
        '--accent-hover': '#00C795',
        '--accent-soft': '#0B3029',
        '--critical': '#F87171',
        '--critical-soft': '#351B23',
        '--warning': '#FBBF24',
        '--warning-soft': '#352A17',
        '--info': '#38BDF8',
        '--healthy': '#2DD4BF',
      }}
    >
      <style>{`
/* Modern Command Center refresh — scoped to the two dashboard roots */
.modern-directorate, .modern-operations {
  --modern-bg: #080d18;
  --modern-panel: rgba(17, 25, 40, .88);
  --modern-panel-2: #111c2d;
  --modern-border: rgba(148, 163, 184, .16);
  --modern-muted: #91a0b8;
  --modern-text: #f4f7fb;
  --modern-accent: #62e6b5;
  background:
    radial-gradient(ellipse at 82% -10%, rgba(16, 185, 129, .13), transparent 34%),
    radial-gradient(ellipse at 0% 20%, rgba(59, 130, 246, .08), transparent 30%),
    var(--modern-bg) !important;
  color: var(--modern-text) !important;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
  letter-spacing: -.01em;
}
.modern-directorate *, .modern-operations * { box-sizing: border-box; }
.modern-directorate header, .modern-operations > div:first-child {
  background: linear-gradient(135deg, rgba(17, 28, 45, .97), rgba(11, 19, 32, .93)) !important;
  border-color: var(--modern-border) !important;
  position: relative;
}
.modern-directorate header::after, .modern-operations > div:first-child::after {
  content: "";
  position: absolute;
  left: 0; right: 0; bottom: -1px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(98,230,181,.6), rgba(96,165,250,.3), transparent);
  pointer-events: none;
}
.modern-directorate h1, .modern-operations h1 {
  letter-spacing: -.045em !important;
  line-height: 1.08 !important;
  font-weight: 760 !important;
}
.modern-directorate main, .modern-operations main {
  max-width: 1680px !important;
  margin: 0 auto !important;
  padding-top: 28px !important;
  padding-bottom: 44px !important;
}
.modern-directorate section > div > div[class*="bg-[#161C24]"],
.modern-directorate section > div > div[class*="bg-[#161c24]"] {
  background: linear-gradient(145deg, rgba(21,32,49,.96), rgba(13,21,35,.96)) !important;
  border: 1px solid var(--modern-border) !important;
  border-radius: 16px !important;
  box-shadow: 0 12px 30px rgba(0,0,0,.14), inset 0 1px 0 rgba(255,255,255,.025) !important;
  transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease !important;
}
.modern-directorate section > div > div[class*="bg-[#161C24]"]:hover,
.modern-directorate section > div > div[class*="bg-[#161c24]"]:hover {
  transform: translateY(-2px);
  border-color: rgba(98,230,181,.34) !important;
  box-shadow: 0 16px 34px rgba(0,0,0,.24) !important;
}
.modern-directorate a[href], .modern-operations a[href] {
  transition: transform .18s ease, border-color .18s ease, background .18s ease !important;
}
.modern-directorate a[href]:hover, .modern-operations a[href]:hover {
  border-color: rgba(98,230,181,.4) !important;
}
.modern-operations [class*="rounded-2xl"][class*="border"],
.modern-operations [class*="rounded-xl"][class*="border"],
.modern-operations [class*="rounded-2xl"][class*="shadow"] {
  border-color: var(--modern-border) !important;
  box-shadow: 0 12px 32px rgba(0,0,0,.13) !important;
}
.modern-operations button, .modern-directorate button {
  transition: transform .16s ease, filter .16s ease, border-color .16s ease !important;
}
.modern-operations button:hover:not(:disabled), .modern-directorate button:hover:not(:disabled) {
  filter: brightness(1.12);
}
.modern-operations button:active:not(:disabled), .modern-directorate button:active:not(:disabled) {
  transform: translateY(1px);
}
.modern-directorate table, .modern-operations table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
}
.modern-directorate thead, .modern-operations thead {
  letter-spacing: .075em !important;
}
.modern-directorate tbody tr, .modern-operations tbody tr {
  transition: background .15s ease !important;
}
.modern-directorate input, .modern-directorate select, .modern-directorate textarea,
.modern-operations input, .modern-operations select, .modern-operations textarea {
  border-radius: 10px !important;
}
@media (max-width: 640px) {
  .modern-directorate main, .modern-operations main { padding: 18px 14px 30px !important; }
  .modern-directorate h1, .modern-operations h1 { font-size: 1.6rem !important; }
}
      `}</style>

      {/* Page Heading Section: full width flush header with ambient glow underline */}
      <header className="w-full bg-gradient-to-r from-[#111923] via-[#121B27] to-[#101720] border-b border-[#243243] px-5 sm:px-8 lg:px-10 xl:px-12 py-3.5">
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-[5px] bg-[#0B3029] border border-[#00B386]/30 text-[#00B386]">
                INSTITUTIONAL DIRECTORATE COMMAND
              </span>
              <span className="text-[#64748B] text-xs">•</span>
              <span className="text-xs font-mono text-[#94A3B8]">Executive Oversight</span>
              {lastUpdated && (
                <>
                  <span className="text-[#64748B] text-xs">•</span>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Telemetry Synced{' '}
                    {lastUpdated.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-[#F1F5F9] tracking-tight leading-tight">
              Campus Facilities Directorate Overview
            </h1>
            <p className="text-[12px] text-[#94A3B8] mt-1 leading-normal max-w-4xl">
              Campus-wide complaint monitoring, departmental operations stability, building fault density, and contractual SLA oversight across IIIT Naya Raipur.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#F1F5F9] bg-[#1C2430] border border-[#263545] hover:border-[#343E4B] hover:bg-[#252D38] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin inline-block text-xs' : 'text-xs'}>🔄</span>
              <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container */}
      <main className="w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-9 py-5 sm:py-6 space-y-5">
        {/* Error notification banner if any */}
        {error && (
          <div className="p-3.5 rounded-[10px] bg-[#351B23] border border-[#F87171]/40 text-[#F87171] text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="underline text-[11px] hover:text-white font-mono cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* 6-Card KPI Strip */}
        <section aria-label="Executive KPIs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
            {/* KPI 1: Total Grievances */}
            <Link
              to="/operations"
              className="bg-gradient-to-br from-[#151E29] to-[#111821] border border-[#253344] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#3A5065] hover:bg-[#162330] transition-all group block"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Total Grievances
              </span>
              <div className="my-0.5">
                <span className="text-2xl sm:text-[26px] font-bold text-[#F1F5F9] leading-none block font-mono">
                  {loading ? '—' : totalTickets}
                </span>
              </div>
              <span className="text-[11px] text-[#2DD4BF] font-medium block truncate">
                Institutional Lifetime
              </span>
            </Link>

            {/* KPI 2: Active Operations */}
            <Link
              to="/operations"
              className="bg-gradient-to-br from-[#151E29] to-[#111821] border border-[#253344] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#3A5065] hover:bg-[#162330] transition-all group block"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Active Operations
              </span>
              <div className="my-0.5">
                <span
                  className={`text-2xl sm:text-[26px] font-bold leading-none block font-mono ${
                    activeLoad > 0 ? 'text-[#FBBF24]' : 'text-[#F1F5F9]'
                  }`}
                >
                  {loading ? '—' : activeLoad}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium block truncate">
                {pendingTickets} Pending • {inProgressTickets} In-Work
              </span>
            </Link>

            {/* KPI 3: Resolution Rate */}
            <Link
              to="/operations"
              className="bg-gradient-to-br from-[#151E29] to-[#111821] border border-[#253344] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#3A5065] hover:bg-[#162330] transition-all group block"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Resolution Rate
              </span>
              <div className="my-0.5">
                <span
                  className={`text-2xl sm:text-[26px] font-bold leading-none block font-mono ${
                    resolutionRate >= 80 ? 'text-[#00B386]' : 'text-[#FBBF24]'
                  }`}
                >
                  {loading ? '—' : `${resolutionRate}%`}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium block truncate">
                {resolvedTickets} Closed Tickets
              </span>
            </Link>

            {/* KPI 4: SLA Compliance */}
            <Link
              to="/operations"
              className="bg-gradient-to-br from-[#151E29] to-[#111821] border border-[#253344] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#3A5065] hover:bg-[#162330] transition-all group block"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                SLA Compliance
              </span>
              <div className="my-0.5">
                <span
                  className={`text-2xl sm:text-[26px] font-bold leading-none block font-mono ${
                    overdueBreaches === 0 ? 'text-[#00B386]' : 'text-[#F87171]'
                  }`}
                >
                  {loading ? '—' : `${slaCompliance}%`}
                </span>
              </div>
              <span
                className={`text-[11px] font-medium block truncate ${
                  overdueBreaches > 0 ? 'text-[#F87171] font-bold' : 'text-[#00B386]'
                }`}
              >
                {overdueBreaches > 0 ? `⚠️ ${overdueBreaches} Overdue` : '✓ Zero Overdue'}
              </span>
            </Link>

            {/* KPI 5: Field Squads */}
            <Link
              to="/squads"
              className="bg-gradient-to-br from-[#151E29] to-[#111821] border border-[#253344] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#3A5065] hover:bg-[#162330] transition-all group block"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Field Squads
              </span>
              <div className="my-0.5">
                <span className="text-2xl sm:text-[26px] font-bold text-[#F1F5F9] leading-none block font-mono">
                  {loading ? '—' : fieldSquadsCount}
                </span>
              </div>
              <span className="text-[11px] text-[#38BDF8] font-medium block truncate">
                Active Trade Balancing
              </span>
            </Link>

            {/* KPI 6: Staff & Admins */}
            <Link
              to="/superadmin/staff"
              className="bg-gradient-to-br from-[#151E29] to-[#111821] border border-[#253344] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#3A5065] hover:bg-[#162330] transition-all group block"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Staff &amp; Admins
              </span>
              <div className="my-0.5">
                <span className="text-2xl sm:text-[26px] font-bold text-[#F1F5F9] leading-none block font-mono">
                  {loading ? '—' : staffCount}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium block truncate">
                6 Operational Trades
              </span>
            </Link>
          </div>
        </section>

        {/* Quick-Access Operational Shortcut Cards: 3 equal cards */}
        <section aria-label="Operational Shortcuts">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
            {/* Shortcut A: Operations Console */}
            <Link
              to="/operations"
              className="bg-gradient-to-br from-[#17212D] to-[#121922] border border-[#273748] hover:border-[#00B386]/50 hover:bg-[#182431] rounded-xl px-3.5 h-[58px] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#1C2430] border border-[#263545] flex items-center justify-center shrink-0 text-sm">
                  🚨
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-[#F1F5F9] group-hover:text-[#00B386] transition-colors truncate">
                    Operations Console
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    Live queue triage, priority overrides, and incident dispatch.
                  </p>
                </div>
              </div>
              <span className="text-[#64748B] text-xs font-semibold pl-2 group-hover:text-[#00B386] group-hover:translate-x-0.5 transition-all shrink-0">
                →
              </span>
            </Link>

            {/* Shortcut B: Squads & Dispatch */}
            <Link
              to="/squads"
              className="bg-gradient-to-br from-[#17212D] to-[#121922] border border-[#273748] hover:border-[#00B386]/50 hover:bg-[#182431] rounded-xl px-3.5 h-[58px] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#1C2430] border border-[#263545] flex items-center justify-center shrink-0 text-sm">
                  🛠️
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-[#F1F5F9] group-hover:text-[#00B386] transition-colors truncate">
                    Squads &amp; Dispatch
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    Workload balancing and team dispatch.
                  </p>
                </div>
              </div>
              <span className="text-[#64748B] text-xs font-semibold pl-2 group-hover:text-[#00B386] group-hover:translate-x-0.5 transition-all shrink-0">
                →
              </span>
            </Link>

            {/* Shortcut C: Staff & RBAC Directory */}
            <Link
              to="/superadmin/staff"
              className="bg-gradient-to-br from-[#17212D] to-[#121922] border border-[#273748] hover:border-[#00B386]/50 hover:bg-[#182431] rounded-xl px-3.5 h-[58px] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#1C2430] border border-[#263545] flex items-center justify-center shrink-0 text-sm">
                  👥
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-bold text-[#F1F5F9] group-hover:text-[#00B386] transition-colors truncate">
                    Staff &amp; RBAC Directory
                  </h3>
                  <p className="text-[11px] text-[#94A3B8] truncate">
                    Staff management, permissions, and access administration.
                  </p>
                </div>
              </div>
              <span className="text-[#64748B] text-xs font-semibold pl-2 group-hover:text-[#00B386] group-hover:translate-x-0.5 transition-all shrink-0">
                →
              </span>
            </Link>
          </div>
        </section>

        {/* Departmental Infrastructure Health & Operational Radar (3x2 Grid) */}
        <section className="space-y-3" aria-label="Departmental Health">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h2 className="text-[15px] sm:text-[16px] font-bold text-[#F1F5F9] tracking-tight">
                Departmental Infrastructure Health &amp; Operational Radar
              </h2>
              <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5">
                Cross-functional telemetry tracking complaint volume, resolution percentages, and service stability across all 6 campus trades.
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#0B3029] border border-[#00B386]/30 text-[#00B386] flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00B386] animate-pulse" />
              Live Radar Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
            {departmentStats.map((dept) => {
              const isHealthy = dept.health >= 85;
              const isDegraded = dept.health >= 70 && dept.health < 85;
              const healthColor = isHealthy ? '#00B386' : isDegraded ? '#FBBF24' : '#F87171';

              return (
                <div
                  key={dept.name}
                  className="bg-[#141D27] border border-[#263545] hover:border-[#343E4B] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between transition-colors min-h-[114px]"
                >
                  <div>
                    {/* Header Row: Dept Icon + Name + Health Score */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{dept.icon}</span>
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-bold text-[#F1F5F9] truncate leading-tight">
                            {dept.name}
                          </h3>
                          <span className="text-[10px] font-mono text-[#64748B]">
                            {dept.total} Total Grievances
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-[5px]"
                          style={{
                            color: healthColor,
                            backgroundColor: isHealthy ? '#0B3029' : isDegraded ? '#352A17' : '#351B23',
                            border: `1px solid ${healthColor}40`,
                          }}
                        >
                          {dept.health}/100 Health
                        </span>
                      </div>
                    </div>

                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2.5">
                      <div>
                        <span className="text-[#64748B] text-[11px] block">Active Workload</span>
                        <span className={`font-mono font-bold text-[12px] ${dept.active > 0 ? 'text-[#FBBF24]' : 'text-[#00B386]'}`}>
                          {dept.active} Active Faults
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#64748B] text-[11px] block">Resolved on Campus</span>
                        <span className="font-mono font-bold text-[12px] text-[#F1F5F9]">
                          {dept.resolved} ({dept.rate}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Thin horizontal progress bar (4px high) */}
                  <div className="w-full h-[4px] rounded-full bg-[#1C2430] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, dept.health)}%`,
                        backgroundColor: healthColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Campus Digital Twin Infrastructure Density */}
        <section className="space-y-3" aria-label="Campus Digital Twin">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h2 className="text-[15px] sm:text-[16px] font-bold text-[#F1F5F9] tracking-tight">
                Campus Digital Twin Infrastructure Density
              </h2>
              <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5">
                Fault distribution and complaint density across academic buildings, hostels, amenity centers, and sports grounds.
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-semibold text-[#00B386] hover:text-[#00C795] flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Explore Interactive 3D Map</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {buildingStats.map((b) => {
              const catStyle = CATEGORY_COLORS[b.category] || CATEGORY_COLORS.AMENITY;

              return (
                <div
                  key={b.id}
                  onClick={() => handleFacilityClick(b)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleFacilityClick(b);
                    }
                  }}
                  className="bg-[#141D27] border border-[#263545] hover:border-[#343E4B] hover:bg-[#1C2430] rounded-[10px] p-3 flex flex-col justify-between transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#00B386] min-h-[74px]"
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: b.color }}
                      />
                      <h4
                        className="text-xs font-bold text-[#F1F5F9] truncate group-hover:text-[#00B386] transition-colors"
                        title={b.name}
                      >
                        {b.shortName}
                      </h4>
                    </div>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-[4px] border shrink-0 uppercase"
                      style={{
                        backgroundColor: catStyle.bg,
                        borderColor: catStyle.border,
                        color: catStyle.text,
                      }}
                    >
                      {b.category}
                    </span>
                  </div>

                  <div className="space-y-0.5 pt-1.5 border-t border-[#263545]/60 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#64748B]">Total Tickets</span>
                      <span className="font-mono font-bold text-[#F1F5F9]">
                        {b.total}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#64748B]">Active Faults</span>
                      <span
                        className={`font-mono font-bold ${
                          b.active > 0 ? 'text-[#FBBF24]' : 'text-[#00B386]'
                        }`}
                      >
                        {b.active}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SLA Exception Radar & Escalation Gate */}
        <section className="bg-[#141D27] border border-[#263545] rounded-xl p-4 sm:p-5 space-y-3.5" aria-label="SLA Escalation Radar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#263545]">
            <div>
              <h2 className="text-[15px] sm:text-[16px] font-bold text-[#F1F5F9] tracking-tight">
                SLA Exception Radar &amp; Escalation Gate
              </h2>
              <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5">
                Real-time monitoring of campus tickets nearing or breaching contractual SLA limits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                  overdueBreaches === 0
                    ? 'bg-[#0B3029] text-[#00B386] border-[#00B386]/30'
                    : 'bg-[#351B23] text-[#F87171] border-[#F87171]/40 animate-pulse font-bold'
                }`}
              >
                {overdueBreaches === 0 ? (
                  <>
                    <span>✓</span>
                    <span>Zero SLA Breaches</span>
                  </>
                ) : (
                  <>
                    <span>⚠️</span>
                    <span>{overdueBreaches} Overdue Beyond SLA</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 pt-0.5">
            {/* SLA Card 1 */}
            <Link
              to="/operations"
              className="bg-[#0B1119] border border-[#263545] hover:border-[#343E4B] rounded-[10px] p-3 sm:p-3.5 flex flex-col justify-between transition-colors group cursor-pointer min-h-[80px] max-h-[88px]"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider block">
                Overdue Beyond SLA
              </span>
              <div className="my-0.5">
                <span
                  className={`text-2xl sm:text-[26px] font-bold font-mono block leading-none ${
                    overdueBreaches > 0 ? 'text-[#F87171]' : 'text-[#00B386]'
                  }`}
                >
                  {loading ? '—' : overdueBreaches}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] block truncate">
                Active breaches requiring supervisory intervention
              </span>
            </Link>

            {/* SLA Card 2 */}
            <Link
              to="/operations"
              className="bg-[#0B1119] border border-[#263545] hover:border-[#343E4B] rounded-[10px] p-3 sm:p-3.5 flex flex-col justify-between transition-colors group cursor-pointer min-h-[80px] max-h-[88px]"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider block">
                Approaching Breach Window
              </span>
              <div className="my-0.5">
                <span
                  className={`text-2xl sm:text-[26px] font-bold font-mono block leading-none ${
                    approachingBreaches > 0 ? 'text-[#FBBF24]' : 'text-[#94A3B8]'
                  }`}
                >
                  {loading ? '—' : approachingBreaches}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] block truncate">
                Tickets with &lt; 20% remaining SLA duration
              </span>
            </Link>

            {/* SLA Card 3 */}
            <Link
              to="/operations"
              className="bg-[#0B1119] border border-[#263545] hover:border-[#343E4B] rounded-[10px] p-3 sm:p-3.5 flex flex-col justify-between transition-colors group cursor-pointer min-h-[80px] max-h-[88px]"
            >
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider block">
                Critical Safety Breakdowns
              </span>
              <div className="my-0.5">
                <span
                  className={`text-2xl sm:text-[26px] font-bold font-mono block leading-none ${
                    criticalTickets > 0 ? 'text-[#F87171]' : 'text-[#00B386]'
                  }`}
                >
                  {loading ? '—' : criticalTickets}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] block truncate">
                Immediate hazards or emergency campus breakdowns
              </span>
            </Link>
          </div>
        </section>

        {/* Recent Maintenance Requests Queue Table */}
        <section className="rounded-xl border border-[#263545] bg-[#141D27] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#263545]">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-[7px] bg-[#1C2430] border border-[#263545] flex items-center justify-center shrink-0 text-xs">
                📋
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9]">Recent Maintenance Requests</h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Latest facility complaints across academic buildings, hostels, and amenities.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#94A3B8] font-mono">{totalTickets} total</span>
              <Link
                to="/operations"
                className="px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#F1F5F9] bg-[#1C2430] border border-[#263545] hover:border-[#00B386] hover:text-[#00B386] transition-colors"
              >
                View Operations Queue →
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-[#101720] text-[10px] uppercase font-mono text-[#64748B] border-b border-[#263545]">
                <tr>
                  <th className="px-4 py-2.5">Code</th>
                  <th className="px-4 py-2.5">Issue</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Department</th>
                  <th className="px-4 py-2.5">Priority</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263545]/60 text-xs text-[#94A3B8]">
                {recentTickets.length > 0 ? (
                  recentTickets.map((t, idx) => {
                    const code = getTicketId(t, idx);
                    return (
                      <tr key={t.id || code} className="hover:bg-[#182330] transition-colors">
                        <td className="px-4 py-2.5 font-mono text-[#F1F5F9]">
                          <Link
                            to={`/track?search=${encodeURIComponent(code)}`}
                            className="hover:underline hover:text-[#00B386]"
                          >
                            {code}
                          </Link>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-[#F1F5F9] max-w-xs truncate" title={getTicketTitle(t)}>
                          {getTicketTitle(t)}
                        </td>
                        <td className="px-4 py-2.5 text-slate-300 max-w-[160px] truncate">
                          {t.location || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {getTicketDepartmentName(t) || '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-mono border ${getPriorityBadgeClass(t.priority)}`}>
                            {String(t.priority || 'MEDIUM').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-mono border ${getStatusBadgeClass(t.status)}`}>
                            {getStatusLabel(t.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap text-[#64748B]">
                          {formatTicketDate(t)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-xs text-[#64748B]">
                      {loading ? 'Loading requests...' : 'No maintenance requests logged yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
