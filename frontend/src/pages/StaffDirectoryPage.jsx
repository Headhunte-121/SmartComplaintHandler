/**
 * SmartComplaintHandler - Staff Directory & RBAC Access Management
 * Dedicated SuperAdmin portal for managing institutional Facility Admins, Squad Leads, and Field Technicians.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAdmins, createAdmin, deleteAdmin, purgeTickets } from '../api/auth';

const CAMPUS_DEPARTMENTS = [
  'Electrical',
  'Plumbing',
  'Sanitation',
  'Carpentry',
  'IT Support',
  'General Administration',
  'Office of the Director',
];

export default function StaffDirectoryPage() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Search & Role Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('ADMIN');
  const [staffDept, setStaffDept] = useState(CAMPUS_DEPARTMENTS[0]);
  const [staffPhone, setStaffPhone] = useState('');
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [addError, setAddError] = useState(null);

  // Purge Tickets Confirmation Modal
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdmins();
      setAdmins(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load institutional staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setAddError(null);

    const cleanEmail = staffEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@iiitnr.edu.in')) {
      setAddError('Staff email must belong to the official @iiitnr.edu.in institutional domain.');
      return;
    }

    setSubmittingStaff(true);
    try {
      await createAdmin({
        name: staffName.trim(),
        email: cleanEmail,
        role: staffRole,
        department_name: staffDept,
        phone: staffPhone.trim() || undefined,
      });

      showToast(`Provisioned new ${staffRole}: ${cleanEmail}`);
      setIsAddModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      loadStaff();
    } catch (err) {
      setAddError(err.response?.data?.detail || err.message || 'Failed to create staff account.');
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (!window.confirm(`Revoke institutional credentials and delete account for "${name}"?`)) {
      return;
    }
    try {
      await deleteAdmin(staffId);
      showToast(`Staff credentials for ${name} revoked.`);
      loadStaff();
    } catch (err) {
      showToast(err.response?.data?.detail || err.message || 'Failed to revoke staff credentials.', 'error');
    }
  };

  const handlePurgeTickets = async () => {
    setPurging(true);
    try {
      const res = await purgeTickets();
      showToast(res.message || 'Database complaints purged successfully.');
      setIsPurgeConfirmOpen(false);
    } catch (err) {
      showToast(err.response?.data?.detail || err.message || 'Purge failed.', 'error');
    } finally {
      setPurging(false);
    }
  };

  const filteredStaff = useMemo(() => {
    return admins.filter((a) => {
      const matchRole = roleFilter === 'ALL' || a.role === roleFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        a.name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q) ||
        a.department_name?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q);
      return matchRole && matchSearch;
    });
  }, [admins, roleFilter, searchQuery]);

  return (
    <div
      className={`w-full min-h-screen flex flex-col space-y-0 animate-fade-in transition-colors duration-200 ${
        isDark ? 'bg-[#0e1117] text-zinc-100' : 'bg-white text-slate-800'
      }`}
    >
      {/* Hero Header */}
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
                Institutional Governance
              </span>
              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>•</span>
              <span className={`text-xs font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {admins.length} Registered Staff Members
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Staff Directory &amp; RBAC Access Control
            </h1>
            <p className={`text-xs mt-1 max-w-2xl ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Authorize facility supervisors, assign squad leads, manage technician credentials, and configure institutional access permissions across IIIT Naya Raipur.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm flex items-center gap-2"
            >
              <span>+ Provision Staff Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 space-y-6">
        {toastMsg && (
          <div
            className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs ${
              isDark ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>✓ {toastMsg}</span>
            <button type="button" onClick={() => setToastMsg(null)} className="font-bold cursor-pointer hover:opacity-75">
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-xl border text-xs font-bold ${
            isDark ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            ⚠️ {error}
          </div>
        )}

        {/* Filter & Search Header */}
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
          isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-[#f1f5f9] border-slate-300'
        }`}>
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, department, or phone..."
              className={`w-full px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            />
            <button
              type="button"
              onClick={loadStaff}
              disabled={loading}
              className={`px-3 py-2 rounded-xl text-xs font-mono shrink-0 cursor-pointer border transition-colors ${
                isDark ? 'bg-[#0e1117] hover:bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
              }`}
            >
              🔄 Refresh
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900 shadow-2xs'
              }`}
            >
              <option value="ALL">All Roles ({admins.length})</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="ADMIN">ADMIN (Facility Lead)</option>
              <option value="TECHNICIAN">TECHNICIAN (Field Crew)</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className={`rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#161b22] border-zinc-800' : 'bg-white border-slate-300 shadow-xs'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                  isDark ? 'bg-[#0e1117]/60 border-zinc-800 text-zinc-400' : 'bg-[#f1f5f9] border-slate-300 text-slate-600'
                }`}>
                  <th className="py-3.5 px-4 font-bold">Staff Member</th>
                  <th className="py-3.5 px-4 font-bold">Role Hierarchy</th>
                  <th className="py-3.5 px-4 font-bold">Assigned Department / Squad</th>
                  <th className="py-3.5 px-4 font-bold">Official Email</th>
                  <th className="py-3.5 px-4 font-bold">Contact Phone</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-zinc-800/80 text-zinc-200' : 'divide-slate-200 text-slate-800'}`}>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      No staff members match the selected search or role criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((staff) => {
                    const isSelf = staff.email?.toLowerCase() === currentUser?.email?.toLowerCase();

                    return (
                      <tr key={staff.id || staff.email} className={`transition-colors ${
                        isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-slate-50'
                      }`}>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${
                              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                            }`}>
                              {(staff.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                                  {staff.name}
                                </span>
                                {isSelf && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className={`text-[11px] block font-mono ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                                ID: #{staff.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                            staff.role === 'SUPER_ADMIN'
                              ? isDark ? 'bg-purple-950/60 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-800 border-purple-300'
                              : staff.role === 'ADMIN'
                              ? isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-800 border-blue-300'
                              : isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}>
                            {staff.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium">
                            {staff.department_name || staff.department?.name || 'General Operations'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {staff.email}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {staff.phone || '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {!isSelf && staff.role !== 'SUPER_ADMIN' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(staff.id, staff.name)}
                              className="text-[11px] font-bold px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className={`text-[11px] ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
                              Protected
                            </span>
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

        {/* Danger Zone: Database Sanitize / Purge */}
        <div className={`p-6 rounded-2xl border transition-colors ${
          isDark ? 'bg-[#161b22] border-rose-900/40' : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2">
                <span>⚠️</span>
                <span>Directorate System Purge &amp; Data Hygiene</span>
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                Sanitize test tickets and reset the campus complaints queue to zero while preserving departments, squads, and staff credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-xs shrink-0"
            >
              Purge All Complaint Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 animate-scale-up ${
            isDark ? 'bg-[#161b22] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <h3 className="text-base font-bold">Provision New Staff Account</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="cursor-pointer text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Er. Manoj Verma"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Institutional Email (@iiitnr.edu.in)</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="name@iiitnr.edu.in"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                      isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Department</label>
                  <select
                    value={staffDept}
                    onChange={(e) => setStaffDept(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                      isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
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
                <label className="block font-bold mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+91-771-2474..."
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#0e1117] border-zinc-700 text-zinc-100' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm"
                >
                  {submittingStaff ? 'Provisioning...' : 'Confirm & Authorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purge Confirmation Modal */}
      {isPurgeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 animate-scale-up ${
            isDark ? 'bg-[#161b22] border-rose-800 text-zinc-100' : 'bg-white border-rose-300 text-slate-900'
          }`}>
            <h3 className="text-base font-bold text-rose-500">Confirm Database Ticket Purge</h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Are you sure you want to sanitize the database and delete all complaint tickets? This will purge all active and resolved complaints. User accounts and department records will be preserved.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-inherit">
              <button
                type="button"
                onClick={() => setIsPurgeConfirmOpen(false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurgeTickets}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-sm"
              >
                {purging ? 'Purging...' : 'Yes, Purge All Complaints'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
