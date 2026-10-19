/**
 * SmartComplaintHandler - Super Administrator Control Console
 * Flush Edge-to-Edge Master Directorate Console with Full-Width Adaptive Theme Support
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAdmins, createAdmin, deleteAdmin, purgeTickets } from '../api/auth';
import { fetchSquadWorkloads } from '../api/assignment';
import { fetchComplaints } from '../api/complaints';

const CAMPUS_DEPARTMENTS = [
  'Electrical',
  'Plumbing',
  'Sanitation',
  'Carpentry',
  'IT Support',
  'General Administration',
];

export default function SuperAdminDashboard() {
  const { currentUser, isSuperAdmin } = useAuth();
  const { isDark } = useTheme();

  const [admins, setAdmins] = useState([]);
  const [teams, setTeams] = useState([]);
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adminList, teamList, tickets] = await Promise.all([
        fetchAdmins().catch(() => []),
        fetchSquadWorkloads().catch(() => []),
        fetchComplaints({ limit: 100 }).catch(() => []),
      ]);
      setAdmins(adminList);
      setTeams(teamList);
      setTicketCount(tickets.length);
    } catch (err) {
      setError('Failed to load administrative telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
              <span>👑 Master Administration Console</span>
            </div>
            <h1
              className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
                isDark ? 'text-zinc-100' : 'text-slate-900'
              }`}
            >
              Campus Facilities Directorate
            </h1>
            <p
              className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
                isDark ? 'text-zinc-400' : 'text-slate-600'
              }`}
            >
              International Institute of Information Technology, Naya Raipur. Manage department staff, configure facility supervisors, and maintain system integrity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/superadmin/editor"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>✏️ Campus &amp; Ticket Data Studio</span>
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
              onClick={() => setIsAddModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl border font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                isDark
                  ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-emerald-400 hover:text-emerald-300'
                  : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-emerald-800'
              }`}
            >
              <span>+ Add Facility Admin</span>
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
        {/* Alerts */}
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

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm'
                : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Campus Staff / Admins
            </div>
            <div className={`text-3xl font-black mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{admins.length}</div>
            <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Active Institutional Accounts
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm'
                : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Facilities Departments
            </div>
            <div className={`text-3xl font-black mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {CAMPUS_DEPARTMENTS.length}
            </div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Taxonomy Categories
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm'
                : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Maintenance Squads
            </div>
            <div className={`text-3xl font-black mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
              {teams.length || 7}
            </div>
            <div className={`text-[11px] font-semibold mt-1 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              Field Response Units
            </div>
          </div>

          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-sm'
                : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-2xs'
            }`}
          >
            <div className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
              Active Complaints
            </div>
            <div className={`text-3xl font-black mt-1 ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>{ticketCount}</div>
            <div className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {ticketCount === 0 ? 'Pristine Zero-State' : 'Live Registered Tickets'}
            </div>
          </div>
        </div>

        {/* Section 1: Campus Administrative Staff Table */}
        <div
          className={`rounded-2xl border overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl'
              : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <div
            className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#e2e8f0]/60 border-slate-300'
            }`}
          >
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Administrative &amp; Supervisory Staff Directory
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Authorized personnel with access to Operations Desks, Squad Dispatches, and Facilities Maintenance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <span>+ Add Admin / Staff</span>
            </button>
          </div>

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
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y text-xs ${
                  isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-slate-200 text-slate-800'
                }`}
              >
                {loading ? (
                  <tr>
                    <td colSpan="6" className={`text-center py-10 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      Loading administrative personnel...
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className={`text-center py-10 ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                      No administrative personnel loaded.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => {
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

        {/* Section 2: Campus Facilities Squad Roster */}
        <div
          className={`rounded-2xl border p-6 space-y-4 transition-colors ${
            isDark
              ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-xl'
              : 'bg-[#f1f5f9] border-slate-300 text-slate-900 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-base font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Departmental Maintenance Squads Roster
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Live automated assignment units with active workload distribution.
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                isDark
                  ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  : 'bg-[#e2e8f0] text-slate-700 border-slate-300'
              }`}
            >
              {teams.length} Registered Units
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {teams.map((t) => (
              <div
                key={t.team_id || t.id}
                className={`p-4 rounded-xl border space-y-2 transition-colors ${
                  isDark
                    ? 'bg-[#0e1117] border-zinc-800 text-zinc-200'
                    : 'bg-[#e2e8f0] border-slate-300 text-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    {t.team_name || t.name}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                </div>
                <div className={`text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Department ID: #{t.department_id}
                </div>
                <div
                  className={`flex items-center justify-between pt-2 border-t text-xs ${
                    isDark ? 'border-zinc-800' : 'border-slate-300'
                  }`}
                >
                  <span className={isDark ? 'text-zinc-400' : 'text-slate-600'}>Assigned Load:</span>
                  <span className={`font-mono font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {t.active_ticket_count || 0} tickets
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Add Admin */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className={`rounded-2xl max-w-lg w-full shadow-2xl border overflow-hidden ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
                : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
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
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-500 text-xs font-semibold">
                  {addError}
                </div>
              )}

              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Rajesh Sharma"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                  }`}
                />
              </div>

              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  Institutional Email (@iiitnr.edu.in):
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.admin@iiitnr.edu.in"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                  }`}
                />
                <span className={`text-[11px] mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  Must end with @iiitnr.edu.in institutional domain.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-zinc-300' : 'text-slate-700'
                    }`}
                  >
                    Role / Authority:
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-700 text-zinc-100'
                        : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                    }`}
                  >
                    <option value="ADMIN" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                      ADMIN (Facilities Supervisor)
                    </option>
                    <option value="TECHNICIAN" className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                      TECHNICIAN (Squad Field Lead)
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                      isDark ? 'text-zinc-300' : 'text-slate-700'
                    }`}
                  >
                    Department:
                  </label>
                  <select
                    value={adminDept}
                    onChange={(e) => setAdminDept(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold focus:outline-none ${
                      isDark
                        ? 'bg-[#0e1117] border-zinc-700 text-zinc-100'
                        : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
                    }`}
                  >
                    {CAMPUS_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className={isDark ? 'bg-[#161b22] text-zinc-100' : 'bg-white text-slate-900'}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-bold uppercase tracking-wider mb-1 ${
                    isDark ? 'text-zinc-300' : 'text-slate-700'
                  }`}
                >
                  Contact Phone / Extension (Optional):
                </label>
                <input
                  type="text"
                  placeholder="+91-771-2474100"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono focus:outline-none transition-all ${
                    isDark
                      ? 'bg-[#0e1117] border-zinc-700 text-zinc-100 focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-600 shadow-2xs'
                  }`}
                />
              </div>

              <div
                className={`pt-4 flex items-center justify-end space-x-3 border-t ${
                  isDark ? 'border-zinc-800' : 'border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                      : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdmin}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {submittingAdmin ? <span>Registering...</span> : <span>Confirm &amp; Add Admin</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Purge Tickets */}
      {isPurgeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
          <div
            className={`rounded-2xl max-w-md w-full shadow-2xl border overflow-hidden p-6 space-y-4 ${
              isDark
                ? 'bg-[#161b22] border-zinc-800 text-zinc-100'
                : 'bg-[#f1f5f9] border-slate-300 text-slate-900'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mx-auto border ${
                isDark
                  ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                  : 'bg-rose-100 border-rose-300 text-rose-700'
              }`}
            >
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                Sanitize Database Records?
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                This action will delete all complaint tickets from the SQLite database and reset all maintenance squad active ticket counters to zero. Real, authentic complaints filed by students will restart from a clean slate.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setIsPurgeConfirmOpen(false)}
                className={`px-4 py-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#0e1117] hover:bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white'
                    : 'bg-[#e2e8f0] hover:bg-[#cbd5e1] border-slate-300 text-slate-800'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurgeTickets}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {purging ? <span>Sanitizing...</span> : <span>Yes, Purge All Tickets</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
