/**
 * SmartComplaintHandler - Super Administrator Control Console
 * Flush Edge-to-Edge Master Directorate Console with Full-Width Adaptive Theme Support
 * Executive Overview, Campus Infrastructure Health, Live Grievance Telemetry, Squad Balancing, and RBAC
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAdmins, createAdmin, deleteAdmin, purgeTickets } from '../api/auth';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';
import { fetchActiveBreaches } from '../api/sla';
import { getCampusBuildings } from '../data/iiitnrCampusData';
import PriorityBadge from '../components/PriorityBadge';
import PriorityOverrideModal from '../components/PriorityOverrideModal';
import ReassignTeamModal from '../components/ReassignTeamModal';
import ResolutionNotesModal from '../components/ResolutionNotesModal';
import TeamWorkloadView from '../components/TeamWorkloadView';

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
  const { currentUser, isSuperAdmin } = useAuth();
  const { isDark } = useTheme();

  // Active Main Directorate Tab
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'INCIDENTS' | 'SQUADS' | 'STAFF'

  // Master Data States
  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [breaches, setBreaches] = useState([]);
  const [buildings, setBuildings] = useState(() => getCampusBuildings());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Incidents Filter States
  const [incidentSearch, setIncidentSearch] = useState('');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('ALL');
  const [incidentPriorityFilter, setIncidentPriorityFilter] = useState('ALL');
  const [incidentDeptFilter, setIncidentDeptFilter] = useState('ALL');

  // Staff Search & Filter States
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('ALL');

  // Modals for supervisory intervention
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideTicket, setOverrideTicket] = useState(null);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTicket, setReassignTicket] = useState(null);

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveTicket, setResolveTicket] = useState(null);

  // New Admin Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('ADMIN');
  const [adminDept, setAdminDept] = useState(CAMPUS_DEPARTMENTS[0]);
  const [adminPhone, setAdminPhone] = useState('');
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [addError, setAddError] = useState(null);

  // Purge Dialog State
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  // Load live data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminList, teamList, ticketList, breachList] = await Promise.all([
        fetchAdmins().catch(() => []),
        fetchSquadWorkloads().catch(() => []),
        fetchComplaints({ limit: 500 }).catch(() => []),
        fetchActiveBreaches().catch(() => []),
      ]);
      setAdmins(Array.isArray(adminList) ? adminList : []);
      setTeams(Array.isArray(teamList) ? teamList : []);
      setTickets(Array.isArray(ticketList) ? ticketList : []);
      setBreaches(Array.isArray(breachList) ? breachList : []);
    } catch (err) {
      setError('Failed to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ================= EXECUTIVE KPIS & ANALYTICS =================
  const totalTickets = tickets.length;
  const pendingTickets = tickets.filter((t) => t.status === 'PENDING').length;
  const inProgressTickets = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const activeLoad = pendingTickets + inProgressTickets;
  const resolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 100;

  const criticalTickets = tickets.filter(
    (t) => (t.priority === 'CRITICAL' || t.hazard_detected) && t.status !== 'RESOLVED' && t.status !== 'CLOSED'
  ).length;

  const overdueBreaches = breaches.filter((b) => b.is_breached).length;
  const approachingBreaches = breaches.filter((b) => !b.is_breached).length;
  const slaCompliance = totalTickets > 0 ? Math.max(0, Math.round(((totalTickets - overdueBreaches) / totalTickets) * 100)) : 100;

  // Department distribution
  const departmentStats = useMemo(() => {
    return CAMPUS_DEPARTMENTS.map((dept) => {
      const deptTickets = tickets.filter((t) => t.department_name === dept);
      const active = deptTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
      const resolved = deptTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      const total = deptTickets.length;
      const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
      // Health score is 100 minus penalty for active tickets
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
      const active = matchedTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;
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

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus = incidentStatusFilter === 'ALL' || t.status === incidentStatusFilter;
      const matchPriority = incidentPriorityFilter === 'ALL' || t.priority === incidentPriorityFilter;
      const matchDept = incidentDeptFilter === 'ALL' || t.department_name === incidentDeptFilter;
      const q = incidentSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.tracking_code?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q) ||
        t.location?.toLowerCase().includes(q) ||
        t.student_name?.toLowerCase().includes(q) ||
        t.department_name?.toLowerCase().includes(q);
      return matchStatus && matchPriority && matchDept && matchSearch;
    });
  }, [tickets, incidentStatusFilter, incidentPriorityFilter, incidentDeptFilter, incidentSearch]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return admins.filter((a) => {
      const matchRole = staffRoleFilter === 'ALL' || a.role === staffRoleFilter;
      const q = staffSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.department_name?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [admins, staffRoleFilter, staffSearch]);

  // ================= ACTIONS =================
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAddError(null);

    const cleanEmail = adminEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@iiitnr.edu.in')) {
      setAddError('Admin email must belong to the official @iiitnr.edu.in institutional domain.');
      return;
    }

    if (!adminName.trim()) {
      setAddError('Please specify the administrator’s full name.');
      return;
    }

    setSubmittingAdmin(true);
    try {
      await createAdmin({
        name: adminName.trim(),
        email: cleanEmail,
        role: adminRole,
        department_name: adminDept,
        phone: adminPhone.trim() || undefined,
      });

      setSuccessMsg(`Successfully registered ${adminName} as ${adminRole}!`);
      setIsAddModalOpen(false);
      setAdminName('');
      setAdminEmail('');
      setAdminPhone('');
      await loadData();
    } catch (err) {
      setAddError(err.response?.data?.detail || err.message || 'Failed to create staff account.');
    } finally {
      setSubmittingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    if (admin.role === 'SUPER_ADMIN') {
      alert('The root Super Administrator account cannot be removed.');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke administrative access for ${admin.name} (${admin.email})?`)) {
      return;
    }

    try {
      await deleteAdmin(admin.id);
      setSuccessMsg(`Revoked administrative access for ${admin.name}.`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to revoke administrator.');
    }
  };

  const handlePurgeTickets = async () => {
    setPurging(true);
    try {
      const res = await purgeTickets();
      setSuccessMsg(`Database Sanitized: All ticket complaints purged successfully (${res.purged_count || 0} cleared).`);
      setIsPurgeConfirmOpen(false);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to purge database records.');
    } finally {
      setPurging(false);
    }
  };

  const handleExportReport = () => {
    const reportData = {
      institution: 'International Institute of Information Technology, Naya Raipur',
      report_title: 'Campus Facilities Directorate - Executive Operational & Telemetry Audit',
      generated_at: new Date().toISOString(),
      generated_by: currentUser?.name || 'SuperAdmin Directorate',
      executive_kpis: {
        total_tickets: totalTickets,
        active_load: activeLoad,
        pending: pendingTickets,
        in_progress: inProgressTickets,
        resolved: resolvedTickets,
        resolution_rate_percent: resolutionRate,
        sla_compliance_rate_percent: slaCompliance,
        critical_hazards: criticalTickets,
        overdue_sla_breaches: overdueBreaches,
        approaching_breaches: approachingBreaches,
        total_authorized_staff: admins.length,
        total_maintenance_squads: teams.length,
      },
      departmental_telemetry: departmentStats,
      building_distribution: buildingStats,
      squad_workloads: teams.map((s) => ({
        team_name: s.team_name,
        department: s.department_name,
        active_tickets: s.active_ticket_count,
      })),
      staff_directory: admins.map((a) => ({
        name: a.name,
        email: a.email,
        role: a.role,
        department: a.department_name,
        phone: a.phone || 'N/A',
      })),
      active_incidents_sample: tickets.slice(0, 100).map((t) => ({
        tracking_code: t.tracking_code,
        title: t.title,
        department: t.department_name,
        location: t.location,
        priority: t.priority,
        status: t.status,
        created_at: t.created_at,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iiitnr_directorate_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSuccessMsg('Exported Institutional Directorate Telemetry Report!');
  };

  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Flush Command Deck Header */}
      <div
        className={`w-full border-b px-4 sm:px-8 lg:px-12 py-8 relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
            : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-xs'
        }`}
      >
        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div
              className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>👑 Master Administration Console · Directorate Level</span>
            </div>
            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-slate-900'
              }`}
            >
              Campus Facilities Directorate
            </h1>
            <p
              className={`text-xs sm:text-sm max-w-3xl leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}
            >
              International Institute of Information Technology, Naya Raipur. Executive command center for institutional facilities governance, cross-departmental operations, maintenance telemetry, and staff access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/superadmin/editor"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>✏️ Data Studio</span>
            </Link>
            <Link
              to="/map"
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
              }`}
            >
              <span>🗺️ Digital Twin Map</span>
            </Link>
            <button
              type="button"
              onClick={handleExportReport}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
              }`}
              title="Download full executive report JSON"
            >
              <span>📥 Export Audit Report</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-emerald-400 hover:text-emerald-300'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-emerald-800'
              }`}
            >
              <span>+ Add Staff</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Sanitize Tickets</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Full-Width Content Container */}
      <div className={`w-full px-4 sm:px-8 lg:px-12 py-8 sm:py-10 space-y-8 ${isDark ? 'bg-[#0e1117]' : 'bg-white'}`}>
        {/* Toast Alerts */}
        {successMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs ${
              isDark
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold">✓</span>
              <span>{successMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="font-bold text-base cursor-pointer hover:opacity-75"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div
            className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs ${
              isDark
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold">⚠️</span>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="font-bold text-base cursor-pointer hover:opacity-75"
            >
              ×
            </button>
          </div>
        )}

        {/* Executive Scorecard Overview: 6 Bento Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Total Grievances */}
          <div
            className={`p-4.5 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Total Grievances
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {totalTickets}
            </div>
            <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Institutional Lifetime
            </div>
          </div>

          {/* Card 2: Active Load */}
          <div
            className={`p-4.5 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Active Operations
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${activeLoad > 0 ? (isDark ? 'text-amber-400' : 'text-amber-700') : (isDark ? 'text-emerald-400' : 'text-emerald-700')}`}>
              {activeLoad}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {pendingTickets} Pending · {inProgressTickets} In-Work
            </div>
          </div>

          {/* Card 3: Resolution Rate */}
          <div
            className={`p-4.5 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Resolution Rate
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {resolutionRate}%
            </div>
            <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {resolvedTickets} Closed Tickets
            </div>
          </div>

          {/* Card 4: SLA Compliance */}
          <div
            className={`p-4.5 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              SLA Compliance
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${overdueBreaches > 0 ? 'text-rose-500' : isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {slaCompliance}%
            </div>
            <div className={`text-[11px] mt-1 ${overdueBreaches > 0 ? 'text-rose-400 font-bold' : isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {overdueBreaches > 0 ? `⚠️ ${overdueBreaches} Overdue` : '0 Breaches'}
            </div>
          </div>

          {/* Card 5: Field Squads */}
          <div
            className={`p-4.5 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Field Squads
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {teams.length}
            </div>
            <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Active Balancing
            </div>
          </div>

          {/* Card 6: Staff & Admins */}
          <div
            className={`p-4.5 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-[10px] font-mono font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Staff &amp; Admins
            </div>
            <div className={`text-2xl font-black font-mono mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {admins.length}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              6 Departments
            </div>
          </div>
        </div>

        {/* Master Directorate Navigation Tabs */}
        <div className={`flex items-center gap-2 border-b pb-2 overflow-x-auto ${isDark ? 'border-zinc-800' : 'border-slate-300'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'OVERVIEW'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>📊 Executive Overview &amp; Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INCIDENTS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'INCIDENTS'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>🚨 Live Grievance Monitor &amp; Triage</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-[#0e1117] text-zinc-300' : 'bg-white text-slate-700'}`}>
              {tickets.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SQUADS')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'SQUADS'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>🛠️ Maintenance Squads &amp; Workload</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-[#0e1117] text-zinc-300' : 'bg-white text-slate-700'}`}>
              {teams.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'STAFF'
                ? isDark
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-800 shadow-xs'
                  : 'bg-[#e2e8f0] text-emerald-800 border border-emerald-300 shadow-xs'
                : isDark
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#cbd5e1]/40'
            }`}
          >
            <span>👥 Staff Directory &amp; RBAC Access</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-[#0e1117] text-zinc-300' : 'bg-white text-slate-700'}`}>
              {admins.length}
            </span>
          </button>
        </div>

        {/* ================= TAB 1: EXECUTIVE OVERVIEW & TELEMETRY ================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 animate-fade-in">
            {/* Row 1: Campus Infrastructure Health Index & Department Telemetry */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Departmental Infrastructure Health &amp; Operational Radar
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Cross-functional telemetry tracking complaint volume, resolution percentages, and service stability across all 6 departments.
                  </p>
                </div>
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                  isDark ? 'bg-[#161b22] border-zinc-800 text-emerald-400' : 'bg-[#f1f5f9] border-slate-300 text-emerald-800'
                }`}>
                  Live Telemetry Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentStats.map((dept) => (
                  <div
                    key={dept.name}
                    className={`p-5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-[#161b22] border-zinc-800 hover:border-zinc-700 text-zinc-100'
                        : 'bg-[#f1f5f9] border-slate-300 hover:border-slate-400 text-slate-900 shadow-2xs'
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
                            {dept.active === 0 ? 'Zero active faults' : `${dept.active} active tickets in queue`}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          dept.active === 0
                            ? isDark
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : dept.active > 3
                            ? isDark
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                            : isDark
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {dept.health}% Health
                      </span>
                    </div>

                    {/* Progress Bar: Resolved vs Total */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>
                          Resolution Efficiency
                        </span>
                        <span className={`font-mono font-bold ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                          {dept.resolved} / {dept.total} resolved ({dept.rate}%)
                        </span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-slate-300'}`}>
                        <div
                          className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${dept.rate}%` }}
                        />
                      </div>
                    </div>

                    <div className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] ${
                      isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-300 text-slate-600'
                    }`}>
                      <span>Active Load: <strong className={isDark ? 'text-zinc-200' : 'text-slate-900'}>{dept.active}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setIncidentDeptFilter(dept.name);
                          setActiveTab('INCIDENTS');
                        }}
                        className={`font-semibold hover:underline cursor-pointer ${
                          isDark ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      >
                        Inspect Department →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Campus Building & Zone Ticket Distribution */}
            <div className="space-y-4">
              <div>
                <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Campus Facilities &amp; Building Zone Distribution
                </h2>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  Spatial distribution of complaints across student hostels, academic lecture blocks, dining pavilions, and campus infrastructure.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {buildingStats.slice(0, 8).map((b) => (
                  <div
                    key={b.id}
                    className={`p-4 rounded-xl border space-y-2 transition-all ${
                      isDark
                        ? 'bg-[#161b22] border-zinc-800 hover:border-zinc-700'
                        : 'bg-[#f1f5f9] border-slate-300 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
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
                        isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-400' : 'bg-white border-slate-300 text-slate-600'
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

            {/* Row 3: SLA Breach Radar & Safety Hazard Alert Banner */}
            <div className={`p-6 rounded-2xl border transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-inherit">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    SLA Exception Radar &amp; Escalation Gate
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Real-time monitoring of campus tickets nearing or breaching target operational SLA turnaround limits.
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
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    Overdue Breached Tickets
                  </span>
                  <span className="text-2xl font-black font-mono text-rose-500 block mt-1">
                    {overdueBreaches}
                  </span>
                  <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Requires immediate supervisory intervention
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    Approaching Breach Window (&lt;2h)
                  </span>
                  <span className={`text-2xl font-black font-mono block mt-1 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    {approachingBreaches}
                  </span>
                  <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    Prioritized in field squad dispatch
                  </span>
                </div>

                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0] border-slate-300'
                }`}>
                  <span className={`text-[10px] font-mono uppercase block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                    Critical Incidents &amp; Hazards
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
        )}

        {/* ================= TAB 2: LIVE GRIEVANCE MONITOR & TRIAGE ================= */}
        {activeTab === 'INCIDENTS' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filter & Search Header */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
            }`}>
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <input
                  type="text"
                  value={incidentSearch}
                  onChange={(e) => setIncidentSearch(e.target.value)}
                  placeholder="Search by code, room, building, student, title..."
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={loadData}
                  className={`px-3 py-2 rounded-lg text-xs font-mono shrink-0 cursor-pointer border transition-colors ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                      : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-800 border-slate-300'
                  }`}
                  title="Reload complaints"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Multi-Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={incidentStatusFilter}
                  onChange={(e) => setIncidentStatusFilter(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>

                <select
                  value={incidentPriorityFilter}
                  onChange={(e) => setIncidentPriorityFilter(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">CRITICAL (2h)</option>
                  <option value="HIGH">HIGH (8h)</option>
                  <option value="MEDIUM">MEDIUM (24h)</option>
                  <option value="LOW">LOW (72h)</option>
                </select>

                <select
                  value={incidentDeptFilter}
                  onChange={(e) => setIncidentDeptFilter(e.target.value)}
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="ALL">All Departments</option>
                  {CAMPUS_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <span className={`text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border ${
                  isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-400' : 'bg-[#e2e8f0] border-slate-300 text-slate-700'
                }`}>
                  {filteredIncidents.length} Tickets
                </span>
              </div>
            </div>

            {/* Incidents Master Table */}
            <div className={`rounded-2xl border overflow-hidden transition-colors ${
              isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-white'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b font-mono uppercase text-[10px] transition-colors ${
                    isDark ? 'border-zinc-800 bg-[#0e1117] text-zinc-400' : 'border-slate-300 bg-[#e2e8f0] text-slate-700'
                  }`}>
                    <tr>
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-4">Issue Title &amp; Details</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Department &amp; Squad</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Supervisory Triage</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-slate-200'}`}>
                    {filteredIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={`py-10 text-center ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          No complaints match the specified search and filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredIncidents.map((ticket) => (
                        <tr
                          key={ticket.id || ticket.tracking_code}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-zinc-800/40 text-zinc-200' : 'hover:bg-[#cbd5e1]/40 text-slate-800'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-500 whitespace-nowrap">
                            {ticket.tracking_code || `#${ticket.id}`}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <span className={`font-semibold block truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                              {ticket.title}
                            </span>
                            <span className={`text-[11px] truncate block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                              {ticket.description}
                            </span>
                          </td>
                          <td className={`py-3.5 px-4 max-w-[200px] ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                            <span className="block truncate font-medium">{ticket.location || 'Campus'}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className={`block font-semibold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                              {ticket.department_name || 'General'}
                            </span>
                            <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                              {ticket.assigned_team_name || 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <PriorityBadge priority={ticket.priority} />
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                                  ? isDark
                                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : ticket.status === 'IN_PROGRESS'
                                  ? isDark
                                    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                  : isDark
                                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                  : 'bg-slate-200 text-slate-800 border-slate-300'
                              }`}
                            >
                              {ticket.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setOverrideTicket(ticket);
                                  setOverrideModalOpen(true);
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                                  isDark
                                    ? 'bg-[#0e1117] hover:bg-zinc-800 text-amber-300 border-amber-800/80'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                }`}
                                title="Adjust Priority"
                              >
                                Priority
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReassignTicket(ticket);
                                  setReassignModalOpen(true);
                                }}
                                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                                  isDark
                                    ? 'bg-[#0e1117] hover:bg-zinc-800 text-indigo-300 border-indigo-800/80'
                                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-300'
                                }`}
                                title="Reassign Squad"
                              >
                                Squad
                              </button>
                              {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResolveTicket(ticket);
                                    setResolveModalOpen(true);
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border ${
                                    isDark
                                      ? 'bg-[#0e1117] hover:bg-zinc-800 text-emerald-300 border-emerald-800/80'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  }`}
                                  title="Resolve Incident"
                                >
                                  Resolve
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
          </div>
        )}

        {/* ================= TAB 3: MAINTENANCE SQUADS & BALANCING ================= */}
        {activeTab === 'SQUADS' && (
          <div className="space-y-6 animate-fade-in">
            {/* Embedded Responsive Team Workload Component */}
            <TeamWorkloadView />
          </div>
        )}

        {/* ================= TAB 4: STAFF DIRECTORY & RBAC ACCESS ================= */}
        {activeTab === 'STAFF' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filter & Action Header */}
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
            }`}>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff by name, email, department..."
                  className={`enterprise-input text-xs ${
                    isDark ? 'bg-[#0e1117] border-zinc-800 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {['ALL', 'SUPER_ADMIN', 'ADMIN', 'TECHNICIAN'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setStaffRoleFilter(role)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                        staffRoleFilter === role
                          ? isDark
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isDark
                          ? 'bg-[#0e1117] text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                          : 'bg-[#e2e8f0] text-slate-600 hover:text-slate-900 border border-slate-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-botanical-primary"
                >
                  + Add Staff / Admin
                </button>
              </div>
            </div>

            {/* Staff Directory Table */}
            <div className={`rounded-2xl border overflow-hidden transition-colors ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl' : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-mono font-bold uppercase tracking-wider ${
                        isDark
                          ? 'border-zinc-800 bg-[#0e1117] text-zinc-400'
                          : 'border-slate-300 bg-[#e2e8f0] text-slate-700'
                      }`}
                    >
                      <th className="py-3.5 px-6">Staff Member</th>
                      <th className="py-3.5 px-6">Institutional Email</th>
                      <th className="py-3.5 px-6">Role &amp; Authority</th>
                      <th className="py-3.5 px-6">Department</th>
                      <th className="py-3.5 px-6">Contact / Phone</th>
                      <th className="py-3.5 px-6 text-right">Access Control</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y text-xs ${
                      isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-slate-200 text-slate-800'
                    }`}
                  >
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan="6" className={`text-center py-10 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                          No staff accounts match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((admin) => {
                        const isRoot = admin.role === 'SUPER_ADMIN';
                        return (
                          <tr
                            key={admin.id || admin.email}
                            className={`transition-colors ${
                              isDark ? 'hover:bg-zinc-800/40' : 'hover:bg-[#cbd5e1]/30'
                            }`}
                          >
                            <td className="py-4 px-6 font-bold">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                                    admin.role === 'SUPER_ADMIN'
                                      ? isDark
                                        ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                                        : 'bg-amber-100 border-amber-300 text-amber-800'
                                      : admin.role === 'ADMIN'
                                      ? isDark
                                        ? 'bg-indigo-950/60 border-indigo-800 text-indigo-400'
                                        : 'bg-indigo-100 border-indigo-300 text-indigo-800'
                                      : isDark
                                      ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                      : 'bg-slate-200 border-slate-300 text-slate-700'
                                  }`}
                                >
                                  {admin.role === 'SUPER_ADMIN' ? '👑' : admin.role === 'ADMIN' ? '🛡️' : '🔧'}
                                </div>
                                <div>
                                  <span className={`block font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                                    {admin.name}
                                  </span>
                                  <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                    ID: #{admin.id || 'N/A'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className={`py-4 px-6 font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                              {admin.email}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  admin.role === 'SUPER_ADMIN'
                                    ? isDark
                                      ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                                      : 'bg-amber-100 border-amber-300 text-amber-800'
                                    : admin.role === 'ADMIN'
                                    ? isDark
                                      ? 'bg-indigo-950/60 border-indigo-800 text-indigo-400'
                                      : 'bg-indigo-100 border-indigo-300 text-indigo-800'
                                    : isDark
                                    ? 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                    : 'bg-slate-200 border-slate-300 text-slate-700'
                                }`}
                              >
                                {admin.role}
                              </span>
                            </td>
                            <td className={`py-4 px-6 font-medium ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                              {admin.department_name || 'General Administration'}
                            </td>
                            <td className={`py-4 px-6 font-mono text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                              {admin.phone || 'Campus Ext.'}
                            </td>
                            <td className="py-4 px-6 text-right">
                              {isRoot ? (
                                <span className={`text-[11px] font-medium italic ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                                  Root Protected
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(admin)}
                                  className="px-3 py-1.5 rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-800 transition-colors font-bold text-xs cursor-pointer"
                                  title="Revoke Admin Access"
                                >
                                  Revoke Access
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODALS ================= */}

      {/* MODAL 1: ADD ADMIN / STAFF */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className={`rounded-2xl max-w-lg w-full shadow-2xl border overflow-hidden ${
              isDark ? 'bg-[#161b22] border-zinc-800 text-zinc-100' : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
            }`}
          >
            <div
              className={`p-6 border-b flex items-center justify-between ${
                isDark ? 'border-zinc-800 bg-[#161b22]' : 'border-slate-300 bg-[#e2e8f0]/60'
              }`}
            >
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  Directorate Action
                </span>
                <h3 className={`text-base font-bold mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                  Register New Campus Admin / Staff
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {addError && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-300 text-rose-800'
                  }`}
                >
                  {addError}
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Institutional Email (@iiitnr.edu.in) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="username@iiitnr.edu.in"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={`w-full rounded-xl border p-2.5 text-xs font-mono focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Role Authority <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  >
                    <option value="ADMIN">ADMIN (Facilities Supervisor)</option>
                    <option value="TECHNICIAN">TECHNICIAN (Field Workstation)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Executive Console)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={adminDept}
                    onChange={(e) => setAdminDept(e.target.value)}
                    className={`w-full rounded-xl border p-2.5 text-xs focus:outline-none focus:ring-2 ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 focus:border-emerald-500 focus:ring-emerald-500/20'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  >
                    {CAMPUS_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                  Contact Extension / Phone <span className={`text-[10px] font-normal ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. +91 771 2474000 or Ext. 104"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className={`w-full rounded-xl border p-2.5 text-xs font-mono focus:outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              <div
                className={`p-4 -mx-6 -mb-6 border-t flex items-center justify-end space-x-2 ${
                  isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/60 border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#161b22] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdmin}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingAdmin ? 'Registering...' : 'Confirm Account Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PURGE / SANITIZE TICKETS */}
      {isPurgeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className={`rounded-2xl max-w-md w-full shadow-2xl border p-6 space-y-4 ${
              isDark ? 'bg-[#161b22] border-rose-900/50 text-zinc-100' : 'bg-[#f1f5f9] border-rose-300 text-slate-900'
            }`}
          >
            <div className="flex items-center space-x-3 text-rose-500">
              <span className="text-3xl">⚠️</span>
              <h3 className={`text-base font-bold uppercase tracking-wider font-mono ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Sanitize Ticket Database
              </h3>
            </div>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Are you sure you want to purge all complaints and grievances? This will irrevocably clear all student tickets, resolution logs, SLA breach entries, and reset squad queues to zero.
            </p>
            <div className={`p-4 -mx-6 -mb-6 border-t flex items-center justify-end space-x-2 ${
              isDark ? 'bg-[#0e1117] border-zinc-800' : 'bg-[#e2e8f0]/60 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => setIsPurgeConfirmOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#161b22] hover:bg-zinc-800 text-zinc-300 border-zinc-700'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurgeTickets}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {purging ? 'Sanitizing Database...' : 'Yes, Purge All Tickets'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRIORITY OVERRIDE MODAL */}
      <PriorityOverrideModal
        ticket={overrideTicket}
        isOpen={overrideModalOpen}
        onClose={() => {
          setOverrideModalOpen(false);
          setOverrideTicket(null);
        }}
        onPriorityUpdated={(updated) => {
          setSuccessMsg(`Priority updated for ${updated.tracking_code || `#${updated.id}`}`);
          loadData();
        }}
      />

      {/* MODAL 4: REASSIGN TEAM MODAL */}
      <ReassignTeamModal
        ticket={reassignTicket}
        isOpen={reassignModalOpen}
        onClose={() => {
          setReassignModalOpen(false);
          setReassignTicket(null);
        }}
        onReassigned={() => {
          setSuccessMsg(`Reassigned squad for ticket successfully.`);
          loadData();
        }}
      />

      {/* MODAL 5: RESOLUTION NOTES MODAL */}
      <ResolutionNotesModal
        ticket={resolveTicket}
        isOpen={resolveModalOpen}
        onClose={() => {
          setResolveModalOpen(false);
          setResolveTicket(null);
        }}
        onResolved={() => {
          setSuccessMsg(`Ticket resolved successfully.`);
          loadData();
        }}
      />
    </div>
  );
}
