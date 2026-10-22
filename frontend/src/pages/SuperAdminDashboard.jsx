/**
 * SmartComplaintHandler - Campus Facilities Directorate Overview
 * Style: Dark Enterprise Operations Dashboard (Command Center)
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

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

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

  // Department distribution with authentic health score
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
        category: b.category || 'FACILITY',
        color: b.trace?.color || b.mapPin?.color || '#00B386',
        total: matchedTickets.length,
        active,
      };
    });
    return list.sort((a, b) => b.total - a.total);
  }, [buildings, tickets]);

  const handleFacilityClick = (building) => {
    navigate(`/track?search=${encodeURIComponent(building.shortName)}`);
  };

  return (
    <div
      className="w-full min-h-screen bg-[#0D1117] text-[#F1F5F9] font-sans antialiased box-border transition-colors duration-200"
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
      {/* 4. Page Heading Section: full width, 32-36px gutters on 1120px, 36-50px on wide desktop */}
      <header className="w-full bg-[#161C24] border-b border-[#252D38] px-5 sm:px-8 lg:px-10 xl:px-12 py-4">
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-[5px] bg-[#0B3029] border border-[#00B386]/30 text-[#00B386]">
                INSTITUTIONAL DIRECTORATE COMMAND
              </span>
              <span className="text-[#64748B] text-xs">•</span>
              <span className="text-xs font-mono text-[#94A3B8]">
                Executive Oversight
              </span>
              {lastUpdated && (
                <>
                  <span className="text-[#64748B] text-xs">•</span>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Telemetry Synced {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
              className="px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[#F1F5F9] bg-[#1C2430] border border-[#252D38] hover:border-[#343E4B] hover:bg-[#252D38] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin inline-block text-xs' : 'text-xs'}>🔄</span>
              <span>{loading ? 'Refreshing...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Full-Width Content Container: exact same horizontal gutter px-5 sm:px-8 lg:px-10 xl:px-12 */}
      <main className="w-full max-w-none px-5 sm:px-8 lg:px-10 xl:px-12 py-5 sm:py-6 space-y-5 sm:space-y-6">
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

        {/* 5. KPI Strip: 6 compact cards in ONE desktop row, 3 on tablet, 2 on mobile */}
        <section aria-label="Executive KPIs">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
            {/* KPI 1: Total Grievances */}
            <div className="bg-[#161C24] border border-[#252D38] rounded-[12px] p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#343E4B] transition-colors">
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
            </div>

            {/* KPI 2: Active Operations */}
            <div className="bg-[#161C24] border border-[#252D38] rounded-[12px] p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#343E4B] transition-colors">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Active Operations
              </span>
              <div className="my-0.5">
                <span className={`text-2xl sm:text-[26px] font-bold leading-none block font-mono ${activeLoad > 0 ? 'text-[#FBBF24]' : 'text-[#F1F5F9]'}`}>
                  {loading ? '—' : activeLoad}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium block truncate">
                {pendingTickets} Pending • {inProgressTickets} In-Work
              </span>
            </div>

            {/* KPI 3: Resolution Rate */}
            <div className="bg-[#161C24] border border-[#252D38] rounded-[12px] p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#343E4B] transition-colors">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Resolution Rate
              </span>
              <div className="my-0.5">
                <span className={`text-2xl sm:text-[26px] font-bold leading-none block font-mono ${resolutionRate >= 80 ? 'text-[#00B386]' : 'text-[#FBBF24]'}`}>
                  {loading ? '—' : `${resolutionRate}%`}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium block truncate">
                {resolvedTickets} Closed Tickets
              </span>
            </div>

            {/* KPI 4: SLA Compliance */}
            <div className="bg-[#161C24] border border-[#252D38] rounded-[12px] p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#343E4B] transition-colors">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                SLA Compliance
              </span>
              <div className="my-0.5">
                <span className={`text-2xl sm:text-[26px] font-bold leading-none block font-mono ${overdueBreaches === 0 ? 'text-[#00B386]' : 'text-[#F87171]'}`}>
                  {loading ? '—' : `${slaCompliance}%`}
                </span>
              </div>
              <span className={`text-[11px] font-medium block truncate ${overdueBreaches > 0 ? 'text-[#F87171] font-bold' : 'text-[#00B386]'}`}>
                {overdueBreaches > 0 ? `⚠️ ${overdueBreaches} Overdue` : '✓ Zero Overdue'}
              </span>
            </div>

            {/* KPI 5: Field Squads */}
            <div className="bg-[#161C24] border border-[#252D38] rounded-[12px] p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#343E4B] transition-colors">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Field Squads
              </span>
              <div className="my-0.5">
                <span className="text-2xl sm:text-[26px] font-bold text-[#F1F5F9] leading-none block font-mono">
                  {loading ? '—' : teams.length}
                </span>
              </div>
              <span className="text-[11px] text-[#38BDF8] font-medium block truncate">
                Active Trade Balancing
              </span>
            </div>

            {/* KPI 6: Staff & Admins */}
            <div className="bg-[#161C24] border border-[#252D38] rounded-[12px] p-3 sm:p-3.5 flex flex-col justify-between min-h-[76px] max-h-[84px] hover:border-[#343E4B] transition-colors">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#64748B] tracking-wider truncate block">
                Staff &amp; Admins
              </span>
              <div className="my-0.5">
                <span className="text-2xl sm:text-[26px] font-bold text-[#F1F5F9] leading-none block font-mono">
                  {loading ? '—' : admins.length}
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] font-medium block truncate">
                6 Operational Trades
              </span>
            </div>
          </div>
        </section>

        {/* 6. Quick-Access Operational Shortcut Cards: 3 equal cards, unified surface styling */}
        <section aria-label="Operational Shortcuts">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
            {/* Shortcut A: Operations Console */}
            <Link
              to="/operations"
              className="bg-[#161C24] border border-[#252D38] hover:border-[#343E4B] hover:bg-[#1C2430] rounded-[12px] px-3.5 h-[58px] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#1C2430] border border-[#252D38] flex items-center justify-center shrink-0 text-sm">
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
              className="bg-[#161C24] border border-[#252D38] hover:border-[#343E4B] hover:bg-[#1C2430] rounded-[12px] px-3.5 h-[58px] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#1C2430] border border-[#252D38] flex items-center justify-center shrink-0 text-sm">
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
              className="bg-[#161C24] border border-[#252D38] hover:border-[#343E4B] hover:bg-[#1C2430] rounded-[12px] px-3.5 h-[58px] flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-[7px] bg-[#1C2430] border border-[#252D38] flex items-center justify-center shrink-0 text-sm">
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

        {/* 7. Departmental Infrastructure Health & Operational Radar (3x2 Grid) */}
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
                  className="bg-[#161C24] border border-[#252D38] hover:border-[#343E4B] rounded-[12px] p-3.5 sm:p-4 flex flex-col justify-between transition-colors min-h-[114px]"
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
                        width: `${dept.health}%`,
                        backgroundColor: healthColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 8. Campus Digital Twin Infrastructure Density (4-column grid spanning the full width) */}
        <section className="space-y-3" aria-label="Campus Digital Twin">
          <div>
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[#F1F5F9] tracking-tight">
              Campus Digital Twin Infrastructure Density
            </h2>
            <p className="text-[11px] sm:text-xs text-[#94A3B8] mt-0.5">
              Fault distribution and complaint density across academic buildings, hostels, amenity centers, and sports grounds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
            {buildingStats.map((b) => {
              const catStyle = CATEGORY_COLORS[b.category] || CATEGORY_COLORS.FACILITY || {
                bg: '#1C2430',
                border: '#343E4B',
                text: '#94A3B8',
              };

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
                  className="bg-[#161C24] border border-[#252D38] hover:border-[#343E4B] hover:bg-[#1C2430] rounded-[10px] p-3 flex flex-col justify-between transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#00B386] min-h-[74px]"
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

                  <div className="space-y-0.5 pt-1.5 border-t border-[#252D38]/60 text-xs">
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

        {/* 9. SLA Exception Radar & Escalation Gate: wide panel with 3 metric cards */}
        <section className="bg-[#161C24] border border-[#252D38] rounded-[12px] p-4 sm:p-5 space-y-3.5" aria-label="SLA Escalation Radar">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#252D38]">
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
              className="bg-[#0D1117] border border-[#252D38] hover:border-[#343E4B] rounded-[10px] p-3 sm:p-3.5 flex flex-col justify-between transition-colors group cursor-pointer min-h-[80px] max-h-[88px]"
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
              className="bg-[#0D1117] border border-[#252D38] hover:border-[#343E4B] rounded-[10px] p-3 sm:p-3.5 flex flex-col justify-between transition-colors group cursor-pointer min-h-[80px] max-h-[88px]"
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
              className="bg-[#0D1117] border border-[#252D38] hover:border-[#343E4B] rounded-[10px] p-3 sm:p-3.5 flex flex-col justify-between transition-colors group cursor-pointer min-h-[80px] max-h-[88px]"
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
      </main>
    </div>
  );
}
