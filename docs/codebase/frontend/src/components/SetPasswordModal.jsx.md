# Frontend Source Documentation: `frontend/src/components/SetPasswordModal.jsx`

> **File Path**: `frontend/src/components/SetPasswordModal.jsx`  
> **Role**: Dual-Authentication Credential Setup Dialog, Real-Time Password Entropy Evaluator, and Credential Rotation Portal.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, Cybersecurity Auditors, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In a modern educational institution, many students and faculty authenticate using Google Workspace Single Sign-On (SSO) via OAuth 2.0. However, campus infrastructure has unique edge cases:
- In closed research laboratories or exam halls, external access to Google servers is often firewalled.
- Certain automated terminals or offline technician workstations require local credentials.
- Users who signed in via Google OAuth have no password record in PostgreSQL (`has_password: false`).

`SetPasswordModal.jsx` provides a **Dual Sign-In Credential Bridge**:
1. **Initial Credential Creation for SSO Users (`isGoogleOnly`)**: Allows Google OAuth users to set up a local password for direct email/password login without requiring an existing password.
2. **Standard Password Rotation for Native Users**: Prompts users who already have a password for their `currentPassword` before accepting updates, defending against session hijacking.
3. **Real-Time Password Entropy Analyzer (`evaluatePasswordStrength`)**: Evaluates password complexity (length, character variety, digits, symbols) and displays a 4-bar colored strength meter (`Fair`, `Good`, `Strong`, `Excellent`).
4. **Visibility Toggle**: Features a one-click "Show/Hide" toggle to reduce typing errors on mobile touchscreens while retaining password masking security.

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
/**
 * SmartComplaintHandler - Set / Change Account Password Modal
 * Enables Google Workspace SSO users to set an initial password in their Profile
 * (enabling dual Google / Email+Password login) or update an existing password.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function evaluatePasswordStrength(pw) {
  if (!pw) return { score: 0, label: 'Minimum 6 characters', color: 'bg-slate-300' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1;

  const map = {
    1: { label: 'Fair', color: 'bg-amber-500' },
    2: { label: 'Good', color: 'bg-sky-500' },
    3: { label: 'Strong', color: 'bg-emerald-500' },
    4: { label: 'Excellent', color: 'bg-teal-400' },
  };
  return { score, ...(map[score] || map[1]) };
}
```

### Plain-English Purpose
Defines the client-side password entropy evaluation function. It checks four security rules: minimum 6 characters, extended 10 characters, mixed case (uppercase and lowercase letters), and digits or special symbols. It returns a score from 0 to 4 along with descriptive labels and Tailwind CSS color classes.

### Line-by-Line Breakdown
- `if (!pw) return { score: 0, label: 'Minimum 6 characters', color: 'bg-slate-300' }`: Null/empty string guard.
- `if (pw.length >= 6) score += 1`: Rule 1: Baseline minimum length.
- `if (pw.length >= 10) score += 1`: Rule 2: High-entropy length threshold.
- `if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1`: Rule 3: Regular expression testing for both uppercase and lowercase characters.
- `if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score += 1`: Rule 4: Regular expression checking for at least one digit (`\d`) or non-alphanumeric symbol (`[^A-Za-z0-9]`).
- `const map = { ... }`: Dictionary mapping integer scores to color and label tokens.

### Deep Term & Concept Expansion
- **Information Entropy in Passwords**: Password strength is mathematically determined by entropy: $E = L \log_2(R)$, where $L$ is length and $R$ is the size of the character pool. By rewarding longer length ($\ge 10$) and pool expansion (uppercase, lowercase, numbers, symbols), this function guides users toward high-entropy passwords resilient against brute-force dictionary attacks.

---

```javascript
export default function SetPasswordModal({ isOpen, onClose }) {
  const { currentUser, updatePassword } = useAuth();
  const { isDark } = useTheme();

  const isGoogleOnly = !currentUser?.has_password || currentUser?.auth_provider === 'google';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const pwStrength = evaluatePasswordStrength(newPassword);
```

### Plain-English Purpose
Component initialization. It extracts user state and `updatePassword` from `useAuth()`.
The boolean `isGoogleOnly` checks if the user lacks a local password. If true, the user is creating an initial password and is exempt from providing an existing password. It also declares form inputs, the password visibility toggle (`showPasswords`), and submission status states.

### Line-by-Line Breakdown
- `const isGoogleOnly = !currentUser?.has_password || currentUser?.auth_provider === 'google'`: Detects OAuth-only accounts.
- `const [showPasswords, setShowPasswords] = useState(false)`: Toggles input types between `'password'` and `'text'`.
- `const pwStrength = evaluatePasswordStrength(newPassword)`: Evaluates strength on every keystroke.

---

```javascript
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isGoogleOnly && !currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(
        isGoogleOnly ? undefined : currentPassword,
        newPassword
      );
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 1600);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Failed to update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };
```

### Plain-English Purpose
Validates inputs and submits the password change:
1. Enforces `currentPassword` only for non-Google accounts.
2. Checks minimum 6 characters for `newPassword`.
3. Verifies `newPassword === confirmPassword`.
4. Calls `updatePassword(...)`. If `isGoogleOnly` is true, passes `undefined` for `currentPassword`.
5. Displays a green success banner for 1.6 seconds before clearing form state and closing the modal.

### Line-by-Line Breakdown
- `if (newPassword !== confirmPassword)`: Client check preventing typographical errors when changing credentials.
- `setTimeout(..., 1600)`: 1.6-second delay allowing the user to see the success confirmation before the dialog automatically closes.

---

```javascript
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div
        className={`rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border shadow-2xl relative overflow-hidden transition-colors ${
          isDark
            ? 'bg-[#161b22] border-zinc-800 text-zinc-100 shadow-black/80'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                isGoogleOnly
                  ? isDark
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isDark
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isGoogleOnly ? 'Dual Sign-In Setup' : 'Security Settings'}
              </span>
            </div>
            <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isGoogleOnly ? 'Set Account Password' : 'Change Account Password'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {isGoogleOnly
                ? 'Create a password to enable direct Email & Password sign-in alongside your Google SSO.'
                : 'Update your current password for direct institutional access.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
```

### Plain-English Purpose
Renders the dialog shell with an emerald green top border highlight. It dynamically adapts copy:
- If `isGoogleOnly`: Displays *"Dual Sign-In Setup"* badge, title *"Set Account Password"*, and copy explaining that this enables direct email login.
- If existing password user: Displays *"Security Settings"* badge and title *"Change Account Password"*.

---

```javascript
        {/* Error Alert */}
        {error && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              isDark ? 'bg-rose-950/60 border-rose-800/80 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-800'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              isDark ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Password updated successfully! Dual sign-in enabled.</span>
          </div>
        )}
```

### Plain-English Purpose
Renders animated alerts: a red error notification if validation or the server request fails, or a green success confirmation confirming that dual sign-in has been activated.

---

```javascript
        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isGoogleOnly && (
            <div>
              <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                Current Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Enter current password"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono transition-all ${
                  isDark
                    ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                }`}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                {isGoogleOnly ? 'Create Password' : 'New Password'}
              </label>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className={`text-[11px] font-semibold cursor-pointer ${
                  isDark ? 'text-zinc-400 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                {showPasswords ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              placeholder="Minimum 6 characters"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono transition-all ${
                isDark
                  ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
```

### Plain-English Purpose
Renders the form fields:
1. `currentPassword`: Conditionally rendered only if `!isGoogleOnly`.
2. `newPassword`: Features a "Show/Hide" toggle button and an input with `minLength={6}`.

---

```javascript
            {/* Strength meter */}
            {newPassword && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-300 ${
                        pwStrength.score >= i ? pwStrength.color : isDark ? 'bg-zinc-800' : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className={isDark ? 'text-zinc-500' : 'text-slate-400'}>Password Strength</span>
                  <span className={`font-bold ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>{pwStrength.label}</span>
                </div>
              </div>
            )}
          </div>
```

### Plain-English Purpose
Renders the 4-segment visual password strength meter whenever `newPassword` contains text. It maps through `[1, 2, 3, 4]`: segments $\le \text{score}$ light up in the calculated color (amber, sky, emerald, teal), while remaining segments remain muted grey.

---

```javascript
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
              Confirm Password
            </label>
            <input
              type={showPasswords ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="Repeat password"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono transition-all ${
                isDark
                  ? 'border-zinc-800 bg-[#0e1117] text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : isGoogleOnly ? 'Create Password' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Plain-English Purpose
Renders the `confirmPassword` input and the action buttons:
- "Cancel": Dismisses the modal.
- Submit Button: Shows *"Create Password"* for Google SSO users, or *"Save Changes"* for existing users. Shows *"Saving..."* with a disabled state while the request is in flight.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: What is the concept of "Dual Sign-In" and why is it needed in a university platform?
**Model Answer:**  
Students frequently register using Google Single Sign-On (OAuth 2.0) via their university institutional email (`@iiitnr.edu.in`). While convenient, campus laboratory computers or offline server rooms may block or restrict external Google authentication servers. "Dual Sign-In" allows a student who initially signed up via Google to create a local password in PostgreSQL, enabling them to log in via either Google OAuth or direct email/password.

### Q2: Why does `isGoogleOnly` hide the "Current Password" field?
**Model Answer:**  
Users who authenticated exclusively through Google OAuth have never established a local password. In the database, their password hash column is either `NULL` or marked as an OAuth placeholder. Asking a Google user for their "current password" would prevent them from ever setting one up. Detecting `isGoogleOnly` hides that field and routes the request to an initial password creation flow.

### Q3: How does the password strength meter evaluate entropy?
**Model Answer:**  
`evaluatePasswordStrength` calculates a score from 1 to 4 using four additive rules:
1. Length $\ge 6$ (+1)
2. Length $\ge 10$ (+1)
3. Contains both uppercase and lowercase letters (+1)
4. Contains numeric digits or special punctuation symbols (+1)
The score maps to visual tiers: **1 = Fair (amber)**, **2 = Good (sky)**, **3 = Strong (emerald)**, and **4 = Excellent (teal)**.

### Q4: Why does the modal use a 1.6-second delay before calling `onClose()` on success?
**Model Answer:**  
When changing critical security credentials like a password, users need clear visual feedback that their action succeeded. Closing the dialog instantaneously can leave users unsure if the change was saved. Displaying a green confirmation banner (*"Password updated successfully! Dual sign-in enabled"*) for 1,600 milliseconds gives the user positive visual confirmation before the dialog dismisses.

### Q5: Why is `newPassword !== confirmPassword` validated on the client side?
**Model Answer:**  
Catching password confirmation mismatches in the browser provides **instant feedback** before sending credentials over the network. It eliminates an unnecessary HTTP round-trip, protects server resources from processing requests destined to fail, and highlights mistakes to the user immediately.

---

## 4. Quick Reference Summary Table

| UI Element / Feature | Technical Rule | User Context | Key Mechanism |
| :--- | :--- | :--- | :--- |
| **`isGoogleOnly` Detection** | `!user.has_password \|\| auth_provider === 'google'` | Google SSO Account | Hides current password field; displays *"Dual Sign-In"* |
| **Current Password Input** | Required if `!isGoogleOnly` | Standard Account | Validates existing password before permitting change |
| **Password Strength Meter** | 4-bar dynamic CSS segment | Real-time typing | Increments on length ($\ge 6, \ge 10$), casing, digits/symbols |
| **Show/Hide Toggle** | Toggles input type (`'text'` vs `'password'`) | Visibility control | Decreases mobile typing errors |
| **Success Latch** | 1.6-second `setTimeout` | Post-update feedback | Displays confirmation before auto-closing modal |
