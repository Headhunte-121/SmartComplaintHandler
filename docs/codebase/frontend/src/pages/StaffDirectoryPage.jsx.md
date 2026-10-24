# Staff Directory & RBAC Access Management (`StaffDirectoryPage.jsx`)

Comprehensive architectural and line-by-line documentation for `frontend/src/pages/StaffDirectoryPage.jsx`. This document provides collegiate viva committees, code reviewers, and systems architects with an exhaustive dissection of institutional role-based access control (RBAC), administrative staff provisioning, credential revocation safety mechanisms, and database hygiene purge controls.

---

## 1. Module Header & Library Imports

```jsx
/**
 * SmartComplaintHandler - Staff Directory & RBAC Access Management
 * Dedicated SuperAdmin portal for managing institutional Facility Admins, Squad Leads, and Field Technicians.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAdmins, createAdmin, deleteAdmin, purgeTickets } from '../api/auth';
```

### Plain-English Purpose
The header imports essential React state hooks, authentication and theme contexts, and administrative API endpoints. Together, they allow Directorate administrators to provision staff accounts, assign departmental squad leads, manage technician access rights, and enforce institutional governance rules.

### Line-by-Line Breakdown
- **Lines 1–4**: Comment header stating the purpose of the portal: managing institutional facility administrators, squad leads, and field technicians with RBAC.
- **Line 5**: Imports `React`, `useState` (reactive state holder), `useEffect` (side-effect lifecycle manager), and `useMemo` (memoized computation cache).
- **Line 6**: Imports `useAuth` hook from `../context/AuthContext` to inspect active administrator session attributes (`currentUser`).
- **Line 7**: Imports `useTheme` hook from `../context/ThemeContext` to govern dark/light visual modes.
- **Line 8**: Imports core administrative API functions from `../api/auth`:
  - `fetchAdmins`: Queries the backend for all registered administrative and technical personnel.
  - `createAdmin`: Provisions a new staff member with a designated role and department.
  - `deleteAdmin`: Revokes staff credentials and removes the user record.
  - `purgeTickets`: Clears test complaint data while preserving staff credentials and organizational hierarchy.

---

## 2. Institutional Department Constants

```jsx
const CAMPUS_DEPARTMENTS = [
  'Electrical',
  'Plumbing',
  'Sanitation',
  'Carpentry',
  'IT Support',
  'General Administration',
  'Office of the Director',
];
```

### Plain-English Purpose
Defines the official organizational divisions recognized across IIIT Naya Raipur. When provisioning new staff members, the department select dropdown binds strictly to this immutable enum array.

### Line-by-Line Breakdown
- **Lines 10–18**: `CAMPUS_DEPARTMENTS` defines 7 institutional divisions, including engineering trades and executive administrative offices.

---

## 3. Component Declaration & State Initializers

```jsx
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
```

### Plain-English Purpose
Initializes reactive memory buffers tracking the staff roster, network query status, search text filters, modal form inputs for new account provisioning, and database purge confirmations.

### Line-by-Line Breakdown
- **Lines 20–22**: Declares default export `StaffDirectoryPage` and extracts `isDark` and `currentUser`.
- **Lines 24–27**: Initializes `admins` (staff records list), `loading` (spinner flag), `error` (error string), and `toastMsg` (feedback alert).
- **Lines 30–31**: `searchQuery` stores text filter strings; `roleFilter` stores selected role bucket (`'ALL'`, `'SUPER_ADMIN'`, `'ADMIN'`, `'TECHNICIAN'`).
- **Lines 34–41**: Manages the Add Staff modal state:
  - `isAddModalOpen`: Boolean visibility toggle.
  - `staffName`, `staffEmail`, `staffRole`, `staffDept`, `staffPhone`: Form input buffers.
  - `submittingStaff`: Boolean in-flight mutation flag.
  - `addError`: Server validation failure string.
- **Lines 44–45**: `isPurgeConfirmOpen` toggles the purge confirmation dialog; `purging` tracks deletion progress.
- **Lines 47–50**: `showToast` displays transient confirmation banners, auto-clearing after $3500\text{ ms}$.

---

## 4. Staff Directory Data Lifecycle

```jsx
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
```

### Plain-English Purpose
Queries the backend administrative endpoint on initial mount to populate the directory table. Ensures defensive handling so non-array responses fall back safely to empty lists.

### Line-by-Line Breakdown
- **Lines 52–63**: `loadStaff` invokes `fetchAdmins()`. On success, stores the result into `admins`. On failure, sets an informative error message. Resets `loading` to `false` in the `finally` block.
- **Lines 65–67**: `useEffect` executes `loadStaff()` once on component mount.

---

## 5. Account Provisioning & Domain Security Validation

```jsx
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
```

### Plain-English Purpose
Handles the submission of new administrative and technician accounts. Enforces institutional domain restriction (`@iiitnr.edu.in`), dispatches the creation payload to the backend REST endpoint, resets the form on success, and refreshes the directory list.

### Line-by-Line Breakdown
- **Lines 69–71**: `handleCreateStaff` intercepts form submission and clears prior validation errors.
- **Lines 73–77**: Sanitizes email by trimming whitespace and converting to lowercase. Validates that the email ends with `@iiitnr.edu.in`. If validation fails, sets an error banner and aborts the request.
- **Lines 79–88**: Invokes `createAdmin` with sanitized name, email, selected role, department, and optional phone number.
- **Lines 89–94**: Emits success toast, closes modal, resets form fields, and triggers `loadStaff()` to display the new entry.
- **Lines 95–99**: Catches server rejection errors (e.g., duplicate email) and resets the in-flight flag.

---

## 6. Access Revocation & System Purge Controls

```jsx
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
```

### Plain-English Purpose
These functions manage security de-provisioning and database hygiene. `handleDeleteStaff` revokes institutional access for a designated staff member, while `handlePurgeTickets` provides Directorate administrators with a clean-slate mechanism to wipe mock or expired complaint data without deleting staff user accounts.

### Line-by-Line Breakdown
- **Lines 102–105**: `handleDeleteStaff` prompts for confirmation via `window.confirm`.
- **Lines 106–113**: Calls `deleteAdmin(staffId)`, emits confirmation toast, and reloads the staff list.
- **Lines 115–126**: `handlePurgeTickets` sets `purging` to `true`, calls `purgeTickets()`, displays the backend response message, closes the modal, and resets `purging` in the `finally` block.

---

## 7. Client-Side Directory Filtering

```jsx
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
```

### Plain-English Purpose
Provides instant client-side filtering across staff members by role classification and multi-field substring queries (name, email, department, or phone number) without server round-trips.

### Line-by-Line Breakdown
- **Lines 128–140**: `useMemo` iterates through `admins`. It filters records matching `roleFilter` and searches across four text fields using `.includes(q)`.

---

## 8. Directory Table & Role Hierarchy Visualization

```jsx
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
```

### Plain-English Purpose
Renders staff rows with avatar initials, role hierarchy badges (`SUPER_ADMIN` in purple, `ADMIN` in blue, `TECHNICIAN` in green), and security-guarded action buttons.

### Line-by-Line Breakdown
- **Lines 281–308**: Displays avatar circle with user initial, staff full name, personal session indicator (`You` badge), and internal database ID.
- **Lines 310–320**: Renders colored role hierarchy badge.
- **Lines 322–335**: Displays assigned department, institutional email, and contact phone.
- **Lines 336–350**: Critical security guard:
  - If the row represents the active user (`isSelf`) or another `SUPER_ADMIN`, the account is flagged as `Protected`.
  - Otherwise, displays a red `Revoke` button to terminate credentials.

---

## 9. High-Frequency Viva & Technical Defense Guide

### Q1: Why is self-revocation and peer `SUPER_ADMIN` deletion prohibited in the UI?
**Viva Answer**: To prevent administrative lockout and privilege escalation attacks. In Linux/Unix systems, a root user cannot delete themselves while logged in without risking orphan processes. Similarly, in `StaffDirectoryPage.jsx`, if an administrator could revoke their own account, the system would immediately lose administrative session authority. Prohibiting deletion of fellow `SUPER_ADMIN` accounts prevents unauthorized peer dismissals.

### Q2: How does the client enforce institutional domain restrictions during staff creation?
**Viva Answer**: In `handleCreateStaff`, the email input is normalized via `.trim().toLowerCase()`. Before sending any network payload to the backend, the method verifies `cleanEmail.endsWith('@iiitnr.edu.in')`. If a user attempts to register an external email (e.g., `@gmail.com`), execution halts immediately with a clear error message, preventing unauthorized external access.

### Q3: What is the architectural purpose of the "Purge All Complaints" danger zone?
**Viva Answer**: During semester transitions or institutional system audits, test tickets and obsolete grievances must be cleared without destroying the organizational structure. `handlePurgeTickets` invokes `/api/v1/auth/purge-tickets`, which executes a transactional delete on complaint and audit records while leaving department definitions, squad mappings, and staff credentials intact.

### Q4: How are roles visually distinguished in the directory table?
**Viva Answer**: The directory uses standardized color-coded badges:
- **`SUPER_ADMIN`**: Purple badge (`bg-purple-950/60` / `text-purple-300`) denoting institutional directorate clearance.
- **`ADMIN`**: Blue badge (`bg-blue-950/60` / `text-blue-300`) denoting facility and department supervisors.
- **`TECHNICIAN`**: Emerald badge (`bg-emerald-950/60` / `text-emerald-300`) denoting field engineering crews.

---

## 10. Quick Reference Summary Table

| Identifier / Function | Type / Scope | Operational Definition |
| :--- | :--- | :--- |
| `CAMPUS_DEPARTMENTS` | Constant Array | List of 7 official institutional divisions for account assignment |
| `loadStaff` | Async Function | Retrieves list of administrative and technician records via `fetchAdmins()` |
| `handleCreateStaff` | Form Handler | Validates `@iiitnr.edu.in` domain and provisions staff credentials |
| `handleDeleteStaff` | Security Handler | Revokes credentials and deletes non-protected staff accounts |
| `handlePurgeTickets` | Maintenance Handler | Wipes complaint records while preserving departments and users |
| `filteredStaff` | Memoized Array | Cached list filtered by selected role and search query |
| `isSelf` | Security Boolean | Checks if table row matches `currentUser.email` to prevent self-deletion |
| `Protected` | UI Security Guard | Disabled state preventing deletion of active session or peer SuperAdmins |
