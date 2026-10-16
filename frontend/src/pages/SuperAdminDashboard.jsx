/**
 * SmartComplaintHandler - Super Administrator Control Console
 * Role: Master control panel for the Directorate of IIIT Naya Raipur.
 *       Enables registering/revoking facility admins, inspecting staff taxonomy,
 *       purging ticket queues for pristine demonstration, and auditing campus facility telemetry.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <span>👑 Master Administration Console</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Campus Facilities Directorate
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              International Institute of Information Technology, Naya Raipur. Manage department staff, configure facility supervisors, and maintain system integrity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/superadmin/editor"
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2"
            >
              <span>✏️ Campus &amp; Ticket Data Studio</span>
            </Link>
            <Link
              to="/map"
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center space-x-2"
            >
              <span>🗺️ Campus Map Studio</span>
            </Link>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Facility Admin</span>
            </button>
            <button
              onClick={() => setIsPurgeConfirmOpen(true)}
              className="px-5 py-3 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 font-bold text-xs transition-all flex items-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Sanitize Tickets (0 Fake Data)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="text-base">✓</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campus Staff / Admins</div>
          <div className="text-3xl font-black text-slate-900">{admins.length}</div>
          <div className="text-[11px] text-emerald-600 font-semibold">Active Institutional Accounts</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Facilities Departments</div>
          <div className="text-3xl font-black text-indigo-600">{CAMPUS_DEPARTMENTS.length}</div>
          <div className="text-[11px] text-slate-500">Taxonomy Categories</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Maintenance Squads</div>
          <div className="text-3xl font-black text-purple-600">{teams.length || 7}</div>
          <div className="text-[11px] text-purple-600 font-semibold">Field Response Units</div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Complaints</div>
          <div className="text-3xl font-black text-slate-800">{ticketCount}</div>
          <div className="text-[11px] text-slate-500">{ticketCount === 0 ? 'Pristine Zero-State' : 'Live Registered Tickets'}</div>
        </div>
      </div>

      {/* Section 1: Campus Administrative Staff Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Administrative & Supervisory Staff Directory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Authorized personnel with access to Operations Desks, Squad Dispatches, and Facilities Maintenance.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>+ Add Admin / Staff</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-6">Institutional Email</th>
                <th className="py-3.5 px-6">Role & Authority</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Contact / Phone</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">Loading administrative personnel...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">No administrative personnel loaded.</td>
                </tr>
              ) : (
                admins.map((admin) => {
                  const isRoot = admin.role === 'SUPER_ADMIN';
                  return (
                    <tr key={admin.id || admin.email} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            admin.role === 'SUPER_ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : admin.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {admin.role === 'SUPER_ADMIN' ? '👑' : admin.role === 'ADMIN' ? '🛡️' : '🔧'}
                          </div>
                          <div>
                            <span className="block text-slate-900 font-bold">{admin.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: #{admin.id || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-600">
                        {admin.email}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          admin.role === 'SUPER_ADMIN'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : admin.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        {admin.department_name || 'General Administration'}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                        {admin.phone || 'Campus Ext.'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {isRoot ? (
                          <span className="text-[11px] text-slate-400 font-medium italic">Root Protected</span>
                        ) : (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            className="px-3 py-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors font-bold text-xs cursor-pointer"
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
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Departmental Maintenance Squads Roster
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live automated dispatch units with active workload distribution.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-full text-slate-600">
            {teams.length} Registered Units
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {teams.map((t) => (
            <div key={t.team_id || t.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{t.team_name || t.name}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
              </div>
              <div className="text-[11px] text-slate-500">
                Department ID: #{t.department_id}
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Assigned Load:</span>
                <span className="font-bold text-slate-900">{t.active_ticket_count || 0} tickets</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Add Admin */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Directorate Action
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Register New Campus Admin / Staff
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {addError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Rajesh Sharma"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional Email (@iiitnr.edu.in):
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rajesh.admin@iiitnr.edu.in"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Must end with @iiitnr.edu.in institutional domain.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role / Authority:
                  </label>
                  <select
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="ADMIN">ADMIN (Facilities Supervisor)</option>
                    <option value="TECHNICIAN">TECHNICIAN (Squad Field Lead)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department:
                  </label>
                  <select
                    value={adminDept}
                    onChange={(e) => setAdminDept(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 bg-white"
                  >
                    {CAMPUS_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone / Extension (Optional):
                </label>
                <input
                  type="text"
                  placeholder="+91-771-2474100"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdmin}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
                >
                  {submittingAdmin ? <span>Registering...</span> : <span>Confirm & Add Admin</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Purge Tickets */}
      {isPurgeConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-2xl font-bold mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Sanitize Database Records?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action will delete all complaint tickets from the SQLite database and reset all maintenance squad active ticket counters to zero. Real, authentic complaints filed by students will restart from a clean slate.
              </p>
            </div>
            <div className="pt-4 flex items-center justify-center space-x-3">
              <button
                type="button"
                onClick={() => setIsPurgeConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurgeTickets}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center space-x-1.5"
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
