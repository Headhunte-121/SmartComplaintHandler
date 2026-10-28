/**
 * SmartComplaintHandler - Staff Directory & RBAC Access Management
 * High-Density Obsidian Command Desk Standard:
 *  - Deep Space Obsidian canvas (#090d14)
 *  - Directorate Staff & RBAC Governance Grid with multi-level role badges
 *  - Instant search & role filter with staff count telemetry
 *  - Glass Add Staff modal with institutional email validation
 *  - Secure data purge drawer with double confirmation
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAdmins, createAdmin, deleteAdmin, purgeTickets } from '../api/auth';
import {
  Users, Shield, UserPlus, RefreshCw, Search, Trash2,
  AlertTriangle, CheckCircle2, X, Phone, Mail, Building,
} from 'lucide-react';

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
  const { currentUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('ADMIN');
  const [staffDept, setStaffDept] = useState(CAMPUS_DEPARTMENTS[0]);
  const [staffPhone, setStaffPhone] = useState('');
  const [submittingStaff, setSubmittingStaff] = useState(false);
  const [addError, setAddError] = useState(null);

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
      showToast(err.response?.data?.detail || err.message || 'Failed to revoke staff credentials.');
    }
  };

  const handlePurgeTickets = async () => {
    setPurging(true);
    try {
      const res = await purgeTickets();
      showToast(res.message || 'Database complaints purged successfully.');
      setIsPurgeConfirmOpen(false);
    } catch (err) {
      showToast(err.response?.data?.detail || err.message || 'Purge failed.');
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
    <div className="w-full min-h-screen bg-[#050608] text-zinc-100 font-sans antialiased selection:bg-white/20 selection:text-white p-4 sm:p-6 lg:p-8 space-y-6 relative">
      {/* Subtle specular ambient sheen */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_60%)]" />

      {/* Header Bar */}
      <div className="p-6 sm:p-7 rounded-3xl border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400">
                Institutional Governance
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-mono text-zinc-400">
                {admins.length} Registered Staff Members
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Staff Directory &amp; RBAC Access Control
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Authorize facility supervisors, assign squad leads, manage technician credentials, and configure institutional access permissions across IIIT Naya Raipur.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_2px_12px_rgba(59,130,246,0.25)] border border-blue-400/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <UserPlus size={14} />
              <span>Provision Staff Account</span>
            </button>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-bold text-emerald-300 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg(null)} className="cursor-pointer text-zinc-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-rose-800/80 bg-rose-950/60 text-xs font-semibold text-rose-300 flex items-center gap-2 shadow-xl">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Header */}
      <div className="p-4 rounded-2xl border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email, department, or phone..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs font-medium placeholder-zinc-500 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
            />
            <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
          </div>
          <button
            type="button"
            onClick={loadStaff}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-mono shrink-0 cursor-pointer border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-white' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs font-medium focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
          >
            <option value="ALL">All Roles ({admins.length})</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN (Directorate)</option>
            <option value="ADMIN">ADMIN (Facility Lead)</option>
            <option value="TECHNICIAN">TECHNICIAN (Field Crew)</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-3xl border border-white/[0.12] bg-[#0c0d12]/90 backdrop-blur-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                <th className="py-3.5 px-4 font-bold">Staff Member</th>
                <th className="py-3.5 px-4 font-bold">Role Hierarchy</th>
                <th className="py-3.5 px-4 font-bold">Assigned Department / Squad</th>
                <th className="py-3.5 px-4 font-bold">Official Email</th>
                <th className="py-3.5 px-4 font-bold">Contact Phone</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-zinc-500">
                    No staff members match the selected search or role criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => {
                  const isSelf = staff.email?.toLowerCase() === currentUser?.email?.toLowerCase();

                  return (
                    <tr key={staff.id || staff.email} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white/[0.14] bg-white/[0.05] text-white">
                            {(staff.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {staff.name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.12] text-white border border-white/25">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] block font-mono text-zinc-500">
                              ID: #{staff.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${
                          staff.role === 'SUPER_ADMIN'
                            ? 'bg-white/[0.12] text-white border-white/30'
                            : staff.role === 'ADMIN'
                            ? 'bg-white/[0.06] text-zinc-200 border-white/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {staff.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-zinc-200">
                          {staff.department_name || staff.department?.name || 'General Operations'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-300">
                        {staff.email}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400">
                        {staff.phone || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isSelf && staff.role !== 'SUPER_ADMIN' ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff.id, staff.name)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
                          >
                            Revoke
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-600">
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
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 transition-colors shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Directorate System Purge &amp; Data Hygiene</span>
            </h3>
            <p className="text-xs mt-1 text-zinc-400">
              Sanitize test tickets and reset the campus complaints queue to zero while preserving departments, squads, and staff credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPurgeConfirmOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/20 shrink-0"
          >
            Purge All Complaint Tickets
          </button>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-white/[0.14] bg-[#0c0d12]/95 text-zinc-100 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.1)] space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Provision New Staff Account</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="cursor-pointer text-zinc-400 hover:text-white">
                <X size={15} />
              </button>
            </div>

            {addError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-zinc-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="e.g. Er. Manoj Verma"
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-zinc-300">Institutional Email (@iiitnr.edu.in)</label>
                <input
                  type="email"
                  required
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="name@iiitnr.edu.in"
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs font-mono focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-zinc-300">Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="TECHNICIAN">TECHNICIAN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-zinc-300">Department</label>
                  <select
                    value={staffDept}
                    onChange={(e) => setStaffDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
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
                <label className="block font-semibold mb-1 text-zinc-300">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+91-771-2474..."
                  className="w-full px-3 py-2 rounded-xl border border-white/[0.1] bg-[#050608] text-white text-xs font-mono focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/10"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingStaff}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer shadow-[0_2px_12px_rgba(59,130,246,0.25)] border border-blue-400/30 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl border border-rose-800/80 bg-[#0c1017]/95 text-zinc-100 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
            <h3 className="text-base font-bold text-rose-400">Confirm Database Ticket Purge</h3>
            <p className="text-xs leading-relaxed text-zinc-400">
              Are you sure you want to sanitize the database and delete all complaint tickets? This will purge all active and resolved complaints. User accounts and department records will be preserved.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setIsPurgeConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurgeTickets}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/20"
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
