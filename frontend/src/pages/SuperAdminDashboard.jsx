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
// Helper Formatting Functions
// ============================================================================

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
    ticket.ticket_code ||
    ticket.complaint_code ||
    ticket.code ||
    ticket.id ||
    ticket._id ||
    `#${String(index + 1).padStart(4, '0')}`
  );
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
  const value = String(status || '').toUpperCase();
  if (['RESOLVED', 'CLOSED'].includes(value)) {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  if (['IN_PROGRESS', 'ESCALATED'].includes(value)) {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
  }
  if (['ASSIGNED'].includes(value)) {
    return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  }
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
}

function getPriorityBadgeClass(priority) {
  const value = String(priority || 'MEDIUM').toUpperCase();
  if (value === 'CRITICAL') return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
  if (value === 'HIGH') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  if (value === 'LOW') return 'border-slate-600 bg-slate-800 text-slate-300';
  return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
}

// ============================================================================
// Subcomponents
// ============================================================================

/**
 * Left Sidebar navigation rail
 */
function SidebarNav({ facilitySearch, setFacilitySearch, lastUpdated }) {
  return (
    <aside className="directorate-sidebar border-r border-[#202D3A] bg-[#0D141D] px-3 py-4 flex flex-col gap-4">
      {/* Brand header */}
      <div className="flex items-center gap-3 px-2 pb-4 border-b border-[#22303E]">
        <div className="h-10 w-10 rounded-xl border border-[#2A3A4A] bg-[#172330] flex items-center justify-center text-xl">
          🏛️
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold text-white">Campus Facilities</div>
          <div className="text-[10px] text-slate-400 mt-1">IIIT Naya Raipur</div>
        </div>
      </div>

      {/* Facility Search Input */}
      <div className="rounded-lg border border-[#243241] bg-[#101821] px-2.5 py-2 flex items-center gap-2">
        <span className="text-slate-500">⌕</span>
        <input
          aria-label="Search campus facilities"
          value={facilitySearch}
          onChange={(e) => setFacilitySearch(e.target.value)}
          placeholder="Search campus..."
          className="w-full min-w-0 bg-transparent text-[10px] text-slate-200 outline-none placeholder:text-slate-500"
        />
      </div>

      {/* Command Center Navigation */}
      <nav className="space-y-1 text-[11px]">
        <div className="px-2 pb-1 text-[9px] uppercase tracking-[.16em] text-slate-500 font-semibold">
          Command Center
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 px-3 py-2.5">
          <span>▦</span>
          <span className="font-semibold">Directorate Overview</span>
        </div>

        <Link
          to="/operations"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span>◈</span>
          <span>Operations Console</span>
        </Link>

        <Link
          to="/squads"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span>⚒</span>
          <span>Squads &amp; Dispatch</span>
        </Link>

        <Link
          to="/superadmin/staff"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span>♙</span>
          <span>Staff &amp; RBAC</span>
        </Link>

        <Link
          to="/map"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span>⌖</span>
          <span>Campus Map</span>
        </Link>

        <Link
          to="/track"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span>⌕</span>
          <span>Track Status</span>
        </Link>

        <Link
          to="/submit"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span>＋</span>
          <span>Submit Request</span>
        </Link>
      </nav>

      {/* Quick Actions Shortcuts */}
      <div className="border-t border-[#22303E] pt-4">
        <div className="px-2 mb-2 text-[9px] uppercase tracking-[.16em] text-slate-500 font-semibold">
          Quick Actions
        </div>

        <Link
          to="/submit"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span className="h-6 w-6 rounded-md bg-[#1C2A37] border border-[#2A3B4B] grid place-items-center text-xs">
            ＋
          </span>
          <span>New Request</span>
        </Link>

        <Link
          to="/operations"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span className="h-6 w-6 rounded-md bg-[#1C2A37] border border-[#2A3B4B] grid place-items-center text-xs">
            ▤
          </span>
          <span>View All Requests</span>
        </Link>

        <Link
          to="/operations"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[11px] text-slate-300 hover:bg-[#172330] hover:text-white transition-colors"
        >
          <span className="h-6 w-6 rounded-md bg-[#1C2A37] border border-[#2A3B4B] grid place-items-center text-xs">
            ◉
          </span>
          <span>Live Radar</span>
        </Link>
      </div>

      {/* Footer System Status */}
      <div className="mt-auto border-t border-[#22303E] pt-3 px-2">
        <div className="flex items-center gap-2 text-[10px] text-emerald-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Online</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-1">
          {lastUpdated
            ? `Last sync: ${lastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}`
            : 'Waiting for telemetry'}
        </div>
      </div>
    </aside>
  );
}

/**
 * Top Page Header with Eyebrow and Refresh Telemetry action
 */
function HeaderSection({ lastUpdated, loading, onRefresh }) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center flex-wrap gap-2 mb-1.5">
          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-mono tracking-wide text-emerald-300">
            INSTITUTIONAL DIRECTORATE COMMAND
          </span>
          <span className="text-slate-600 text-xs">•</span>
          <span className="text-[10px] text-slate-400">Executive Oversight</span>
          {lastUpdated && (
            <>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] font-mono text-slate-500">
                Telemetry synced{' '}
                {lastUpdated.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-50">
          Campus Facilities Directorate Overview
        </h1>
        <p className="mt-1 text-[11px] text-slate-400">
          Campus-wide complaint monitoring, departmental operations stability, building fault density,
          and contractual SLA oversight across IIIT Naya Raipur.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="shrink-0 self-start lg:self-center flex items-center gap-2 rounded-lg border border-[#2B3A49] bg-[#15202B] px-3 py-2 text-[11px] font-semibold text-slate-200 hover:border-emerald-500/40 hover:bg-[#1E2B38] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
      >
        <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
        <span>{loading ? 'Refreshing…' : 'Refresh Telemetry'}</span>
      </button>
    </header>
  );
}

/**
 * 6-Card KPI Strip
 */
function KpiStrip({ kpiList }) {
  return (
    <section aria-label="Executive KPIs" className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-6 gap-2.5">
      {kpiList.map((kpi) => (
        <div
          key={kpi.label}
          className="min-w-0 rounded-xl border border-[#243241] bg-gradient-to-br from-[#141E29] to-[#101720] p-3 flex items-center gap-3 shadow-[0_8px_24px_#00000012] hover:border-[#334658] transition-colors"
        >
          <div
            className="h-9 w-9 shrink-0 rounded-lg border border-[#2A3C4D] bg-[#1A2937] grid place-items-center text-lg"
            style={{ color: kpi.color }}
          >
            {kpi.icon}
          </div>
          <div className="min-w-0">
            <div className="text-[9px] font-mono uppercase tracking-wider text-slate-400 truncate">
              {kpi.label}
            </div>
            <div className="text-[23px] font-bold leading-tight mt-0.5" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">{kpi.note}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

/**
 * Campus Digital Twin Schematic Map Panel
 */
function CampusTwinMapPanel({ filteredBuildings, totalBuildings, onFacilityClick }) {
  return (
    <div className="rounded-xl border border-[#243241] bg-[#101821] overflow-hidden min-w-0">
      <div className="flex items-center justify-between gap-2 border-b border-[#22303E] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-300 grid place-items-center">
            ⌖
          </span>
          <div>
            <h2 className="text-xs font-bold">Campus Digital Twin</h2>
            <p className="text-[9px] text-slate-500 mt-0.5">Facility locations &amp; fault density</p>
          </div>
        </div>
        <Link to="/map" className="text-[10px] text-emerald-300 hover:text-emerald-200">
          Open Full Map →
        </Link>
      </div>

      <div
        className="relative h-[245px] overflow-hidden bg-[#0C151F]"
        style={{
          backgroundImage:
            'linear-gradient(#20324455 1px, transparent 1px), linear-gradient(90deg, #20324455 1px, transparent 1px), radial-gradient(ellipse at 48% 45%, #12383a 0%, #0c151f 70%)',
          backgroundSize: '28px 28px, 28px 28px, 100% 100%',
        }}
      >
        {/* Schematic road network */}
        <div className="map-road" style={{ width: '125%', height: 12, left: '-8%', top: '38%', transform: 'rotate(-23deg)' }} />
        <div className="map-road" style={{ width: '115%', height: 8, left: '-6%', top: '66%', transform: 'rotate(17deg)' }} />
        <div className="map-road" style={{ width: '90%', height: 10, left: '17%', top: '18%', transform: 'rotate(64deg)' }} />
        <div className="map-road" style={{ width: '80%', height: 7, left: '26%', top: '53%', transform: 'rotate(-54deg)' }} />
        <div className="map-road" style={{ width: '90%', height: 6, left: '5%', top: '82%', transform: 'rotate(-4deg)' }} />

        {/* Facility Pin Markers */}
        {filteredBuildings.slice(0, 20).map((building, index) => {
          const xPos = 8 + ((index * 37 + 13) % 82);
          const yPos = 10 + ((index * 29 + 17) % 78);
          return (
            <button
              key={building.id}
              type="button"
              title={`${building.name}: ${building.total} tickets, ${building.active} active`}
              onClick={() => onFacilityClick(building)}
              className="absolute group cursor-pointer"
              style={{
                left: `${xPos}%`,
                top: `${yPos}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span
                className="relative flex h-3 w-3 rounded-full border-2 border-[#08111A] shadow-[0_0_0_3px_#0c151f88] group-hover:scale-125 transition-transform"
                style={{
                  backgroundColor: building.active ? '#FB7185' : building.color || '#00C99A',
                }}
              />
              <span className="absolute left-4 top-[-5px] whitespace-nowrap rounded border border-[#314457] bg-[#101A25]/95 px-1.5 py-1 text-[8px] text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-md">
                {building.shortName}
              </span>
            </button>
          );
        })}

        {/* Map Legend */}
        <div className="absolute bottom-3 left-3 rounded-md border border-[#344657] bg-[#101A25]/90 px-2 py-1 text-[9px] text-slate-400">
          <span>● Healthy</span>
          <span className="text-rose-300 ml-2">● Active faults</span>
        </div>

        <div className="absolute bottom-3 right-3 rounded-md border border-[#344657] bg-[#101A25]/90 px-2 py-1 text-[9px] text-slate-400">
          {totalBuildings} campus facilities
        </div>
      </div>
    </div>
  );
}

/**
 * Department Workload & Health Panel
 */
function DepartmentHealthPanel({ departmentStats }) {
  return (
    <div className="rounded-xl border border-[#243241] bg-[#101821] overflow-hidden min-w-0">
      <div className="flex items-center justify-between border-b border-[#22303E] px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-300 grid place-items-center">
            ▥
          </span>
          <div>
            <h2 className="text-xs font-bold">Department Workload &amp; Health</h2>
            <p className="text-[9px] text-slate-500 mt-0.5">Live status across six trades</p>
          </div>
        </div>
        <Link to="/squads" className="text-[10px] text-emerald-300 hover:text-emerald-200">
          View Details →
        </Link>
      </div>

      <div className="px-3.5 pb-1">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_55px_48px] gap-2 py-2 text-[9px] text-slate-500 border-b border-[#22303E]">
          <span>Department</span>
          <span>Active Workload</span>
          <span className="text-center">Health</span>
          <span className="text-right">Resolved</span>
        </div>

        {departmentStats.map((dept) => (
          <div
            key={dept.name}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_55px_48px] items-center gap-2 py-2.5 border-b border-[#1E2B38] last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm shrink-0">{dept.icon}</span>
              <span className="text-[10px] font-medium truncate">{dept.name}</span>
            </div>

            <div className="min-w-0">
              <div className="text-[9px] text-slate-400 mb-1">{dept.active} Active</div>
              <div className="h-1.5 rounded-full bg-[#263442] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(5, dept.health)}%`,
                    background: dept.active ? '#F59E0B' : '#00C99A',
                  }}
                />
              </div>
            </div>

            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[9px] text-center px-1 py-1 font-mono">
              {dept.health}/100
            </span>

            <span className="text-[9px] text-right text-slate-300 font-mono">
              {dept.resolved} ({dept.rate}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * SLA & Resolution Overview Panel with circular chart and ticket breakdown
 */
function SlaOverviewPanel({
  slaCompliance,
  overdueBreaches,
  approachingBreaches,
  openRequestsCount,
  resolvedTickets,
  pendingTickets,
  inProgressTickets,
  criticalTickets,
  totalTickets,
  loading,
}) {
  const statusBars = [
    { label: 'Pending', value: pendingTickets, color: '#F59E0B' },
    { label: 'In Work', value: inProgressTickets, color: '#38BDF8' },
    { label: 'Resolved', value: resolvedTickets, color: '#00C99A' },
    { label: 'Critical', value: criticalTickets, color: '#FB7185' },
  ];

  return (
    <div className="rounded-xl border border-[#243241] bg-[#101821] p-3.5 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-300 grid place-items-center">
          ◉
        </span>
        <div>
          <h2 className="text-xs font-bold">SLA &amp; Resolution Overview</h2>
          <p className="text-[9px] text-slate-500 mt-0.5">Current compliance snapshot</p>
        </div>
      </div>

      {/* Compliance Ring & Metric breakdown */}
      <div className="flex items-center gap-3 border-b border-[#22303E] pb-3">
        <div
          className="h-[104px] w-[104px] shrink-0 rounded-full grid place-items-center"
          style={{
            background: `conic-gradient(#FB7185 0 ${100 - slaCompliance}%, #00C99A ${100 - slaCompliance}% 100%)`,
          }}
        >
          <div className="h-[78px] w-[78px] rounded-full bg-[#101821] flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-mono">
              {loading ? '—' : `${slaCompliance}%`}
            </span>
            <span className="text-[8px] text-slate-400">SLA Compliance</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 text-[9px] min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
            <span className="text-slate-400 flex-1 truncate">Overdue Beyond SLA</span>
            <b className="text-rose-300 font-mono">{overdueBreaches}</b>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-slate-400 flex-1 truncate">Approaching Breach</span>
            <b className="text-amber-300 font-mono">{approachingBreaches}</b>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
            <span className="text-slate-400 flex-1 truncate">Open Requests</span>
            <b className="text-sky-300 font-mono">{openRequestsCount}</b>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-500 shrink-0" />
            <span className="text-slate-400 flex-1 truncate">Resolved</span>
            <b className="font-mono">{resolvedTickets}</b>
          </div>
        </div>
      </div>

      {/* Ticket Status Bar Distribution */}
      <div className="pt-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-semibold">Ticket Status Distribution</h3>
          <span className="text-[9px] text-slate-500">All requests</span>
        </div>

        <div className="flex items-end gap-1.5 h-[58px]">
          {statusBars.map((item) => {
            const heightPercent = totalTickets > 0 ? (item.value / totalTickets) * 100 : 0;
            return (
              <div key={item.label} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                <div
                  className="w-full max-w-8 rounded-t-sm min-h-[3px] transition-all duration-300"
                  style={{
                    height: `${Math.max(5, heightPercent)}%`,
                    background: item.color,
                  }}
                />
                <span className="text-[8px] text-slate-500">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Recent Maintenance Requests Table
 */
function RecentRequestsTable({ recentTickets, totalTickets, loading }) {
  return (
    <section className="rounded-xl border border-[#243241] bg-[#101821] overflow-hidden">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3 px-3.5 py-3 border-b border-[#22303E]">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-300 grid place-items-center">
            ▤
          </span>
          <div>
            <h2 className="text-xs font-bold">Recent Maintenance Requests</h2>
            <p className="text-[9px] text-slate-500 mt-0.5">
              Latest facility issues across campus buildings, hostels, and amenities
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] text-slate-400">{totalTickets} total requests</span>
          <Link
            to="/operations"
            className="rounded-lg border border-[#2B3A49] bg-[#172330] px-3 py-1.5 text-[10px] text-slate-200 hover:border-emerald-500/40 hover:bg-[#1E2B38] transition-colors"
          >
            View All Requests →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto dir-scrollbar">
        <table className="w-full min-w-[850px] text-left">
          <thead className="bg-[#131E29] text-[9px] text-slate-400">
            <tr>
              <th className="px-3.5 py-2.5 font-medium">Ticket</th>
              <th className="px-3.5 py-2.5 font-medium">Request / Issue</th>
              <th className="px-3.5 py-2.5 font-medium">Location</th>
              <th className="px-3.5 py-2.5 font-medium">Department</th>
              <th className="px-3.5 py-2.5 font-medium">Priority</th>
              <th className="px-3.5 py-2.5 font-medium">Status</th>
              <th className="px-3.5 py-2.5 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket, index) => (
                <tr
                  key={ticket.id || ticket._id || getTicketId(ticket, index)}
                  className="border-t border-[#202D3A] hover:bg-[#162330] transition-colors"
                >
                  <td className="px-3.5 py-2.5 text-[10px] font-mono text-slate-400">
                    {getTicketId(ticket, index)}
                  </td>
                  <td
                    className="px-3.5 py-2.5 text-[10px] font-medium text-slate-100 max-w-[260px] truncate"
                    title={getTicketTitle(ticket)}
                  >
                    {getTicketTitle(ticket)}
                  </td>
                  <td className="px-3.5 py-2.5 text-[10px] text-slate-300 max-w-[180px] truncate">
                    {ticket.location || ticket.building_name || ticket.building || '—'}
                  </td>
                  <td className="px-3.5 py-2.5 text-[10px] text-slate-300">
                    {ticket.department_name || ticket.department || '—'}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-[9px] ${getPriorityBadgeClass(
                        ticket.priority
                      )}`}
                    >
                      {String(ticket.priority || 'MEDIUM').replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-[9px] ${getStatusBadgeClass(
                        ticket.status
                      )}`}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-[10px] text-slate-400 whitespace-nowrap font-mono">
                    {formatTicketDate(ticket)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center">
                  <div className="text-2xl mb-2">▤</div>
                  <p className="text-xs text-slate-300">
                    {loading ? 'Loading maintenance requests…' : 'No maintenance requests found'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Requests will appear here when they are submitted.
                  </p>
                  <Link
                    to="/submit"
                    className="inline-flex mt-3 rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-semibold text-[#04130F] hover:bg-emerald-400 transition-colors"
                  >
                    ＋ Submit Request
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[#22303E] px-3.5 py-2 text-[9px] text-slate-500">
        <span>
          Showing {recentTickets.length ? 1 : 0}–{recentTickets.length} of {totalTickets} requests
        </span>
        <Link to="/operations" className="text-emerald-300 hover:text-emerald-200">
          Open operations queue →
        </Link>
      </div>
    </section>
  );
}

/**
 * Campus Infrastructure Health & Operational Radar Grid
 */
function FacilityRadarGrid({ buildingStats, onFacilityClick }) {
  return (
    <section className="rounded-xl border border-[#243241] bg-[#101821] p-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-300 grid place-items-center">
            ⚠
          </span>
          <div>
            <h2 className="text-xs font-bold">Campus Infrastructure Health &amp; Operational Radar</h2>
            <p className="text-[9px] text-slate-500 mt-0.5">
              Fault distribution across academic buildings, hostels, amenities, and sports grounds.
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] text-emerald-300 flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Radar Active</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
        {buildingStats.map((building) => {
          const categoryStyle = CATEGORY_COLORS[building.category] || CATEGORY_COLORS.AMENITY;
          return (
            <button
              key={building.id}
              type="button"
              onClick={() => onFacilityClick(building)}
              className="min-w-0 rounded-lg border border-[#243241] bg-[#131E29] px-2.5 py-2 text-left hover:border-emerald-500/30 hover:bg-[#182635] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: building.color }}
                  />
                  <span className="text-[10px] font-semibold truncate text-[#E8EDF5]">
                    {building.shortName}
                  </span>
                </div>
                <span
                  className="text-[8px] uppercase rounded border px-1 py-0.5 shrink-0 font-mono"
                  style={{
                    color: categoryStyle.text,
                    borderColor: categoryStyle.border,
                    backgroundColor: categoryStyle.bg,
                  }}
                >
                  {building.category}
                </span>
              </div>

              <div className="flex gap-3 mt-1.5 text-[9px] text-slate-500">
                <span>
                  Total: <b className="text-slate-300 font-mono">{building.total}</b>
                </span>
                <span>
                  Active:{' '}
                  <b className={`font-mono ${building.active ? 'text-amber-300' : 'text-emerald-300'}`}>
                    {building.active}
                  </b>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // State
  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [facilitySearch, setFacilitySearch] = useState('');

  // Data Fetching
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

  // Executive KPI Calculations
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

  const openRequests = tickets.filter(
    (t) => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(String(t.status || '').toUpperCase())
  );

  // Department distribution with authentic health calculation
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

      // Health calculation: 100 if zero active faults, reduced based on open backlog severity
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

  const filteredBuildings = buildingStats.filter((b) =>
    `${b.name} ${b.shortName} ${b.category}`.toLowerCase().includes(facilitySearch.toLowerCase())
  );

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort((a, b) => {
        const dateA = new Date(a.created_at || a.createdAt || a.submitted_at || 0);
        const dateB = new Date(b.created_at || b.createdAt || b.submitted_at || 0);
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [tickets]);

  // 6 KPI definition list
  const kpiList = [
    {
      label: 'Total Grievances',
      value: loading ? '—' : totalTickets,
      note: 'Institutional Lifetime',
      color: '#F1F5F9',
      icon: '▤',
    },
    {
      label: 'Active Operations',
      value: loading ? '—' : activeLoad,
      note: `${pendingTickets} Pending • ${inProgressTickets} In-Work`,
      color: activeLoad ? '#FBBF24' : '#F1F5F9',
      icon: '⌁',
    },
    {
      label: 'Resolution Rate',
      value: loading ? '—' : `${resolutionRate}%`,
      note: `${resolvedTickets} Closed Tickets`,
      color: resolutionRate >= 80 ? '#00C99A' : '#FBBF24',
      icon: '▥',
    },
    {
      label: 'SLA Compliance',
      value: loading ? '—' : `${slaCompliance}%`,
      note: overdueBreaches ? `⚠ ${overdueBreaches} Overdue` : '✓ Zero Overdue',
      color: overdueBreaches ? '#FB7185' : '#00C99A',
      icon: '⚠',
    },
    {
      label: 'Field Squads',
      value: loading ? '—' : teams.length,
      note: 'Active Trade Balancing',
      color: '#38BDF8',
      icon: '♟',
    },
    {
      label: 'Staff & Admins',
      value: loading ? '—' : admins.length,
      note: '6 Operational Trades',
      color: '#F1F5F9',
      icon: '♙',
    },
  ];

  return (
    <div
      className="min-h-screen w-full bg-[#0A0F15] text-slate-100 antialiased"
      style={{
        '--surface': '#101821',
        '--surface2': '#141E29',
        '--line': '#243241',
        '--muted': '#8FA3B8',
        '--teal': '#00C99A',
      }}
    >
      <style>{`
        .dir-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .dir-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 8px;
        }
        .map-road {
          position: absolute;
          background: #273748;
          border: 1px solid #34485d;
          transform-origin: center;
          border-radius: 5px;
          opacity: 0.8;
        }
        .map-block {
          position: absolute;
          border: 1px solid #2a5260;
          box-shadow: 0 0 20px #00b38618;
          transform: rotate(-12deg);
          border-radius: 4px;
        }
        @media (max-width: 1100px) {
          .directorate-layout {
            grid-template-columns: 1fr !important;
          }
          .directorate-sidebar {
            display: none;
          }
          .directorate-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="directorate-layout grid grid-cols-[194px_minmax(0,1fr)] min-h-[calc(100vh-46px)]">
        {/* Left Sidebar Navigation */}
        <SidebarNav
          facilitySearch={facilitySearch}
          setFacilitySearch={setFacilitySearch}
          lastUpdated={lastUpdated}
        />

        {/* Main Dashboard Workspace */}
        <div className="min-w-0 px-4 sm:px-5 xl:px-6 py-4 space-y-3.5">
          {/* Header Section */}
          <HeaderSection
            lastUpdated={lastUpdated}
            loading={loading}
            onRefresh={loadData}
          />

          {/* Error Banner */}
          {error && (
            <div className="flex items-center justify-between rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              <span>⚠ {error}</span>
              <button type="button" onClick={loadData} className="underline cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {/* 6-Card KPI Strip */}
          <KpiStrip kpiList={kpiList} />

          {/* 3-Column Operational Center Grid */}
          <section className="directorate-main-grid grid grid-cols-[1.2fr_1fr_0.82fr] gap-2.5 min-w-0">
            {/* Column 1: Campus Digital Twin Schematic Map */}
            <CampusTwinMapPanel
              filteredBuildings={filteredBuildings}
              totalBuildings={buildingStats.length}
              onFacilityClick={handleFacilityClick}
            />

            {/* Column 2: Department Workload & Health */}
            <DepartmentHealthPanel departmentStats={departmentStats} />

            {/* Column 3: SLA & Resolution Overview */}
            <SlaOverviewPanel
              slaCompliance={slaCompliance}
              overdueBreaches={overdueBreaches}
              approachingBreaches={approachingBreaches}
              openRequestsCount={openRequests.length}
              resolvedTickets={resolvedTickets}
              pendingTickets={pendingTickets}
              inProgressTickets={inProgressTickets}
              criticalTickets={criticalTickets}
              totalTickets={totalTickets}
              loading={loading}
            />
          </section>

          {/* Recent Maintenance Requests Data Table */}
          <RecentRequestsTable
            recentTickets={recentTickets}
            totalTickets={totalTickets}
            loading={loading}
          />

          {/* Campus Infrastructure Health & Operational Radar Grid */}
          <FacilityRadarGrid
            buildingStats={buildingStats}
            onFacilityClick={handleFacilityClick}
          />
        </div>
      </div>
    </div>
  );
}
