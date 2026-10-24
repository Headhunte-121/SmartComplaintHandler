# Institutional Registration Portal (`Register.jsx`)

Comprehensive architectural and line-by-line documentation for `frontend/src/pages/Register.jsx`. This document provides collegiate viva committees, code reviewers, and systems architects with an exhaustive dissection of the 2-step progressive onboarding wizard, heuristic academic profile parsing from institutional roll numbers, 4-tier password entropy scoring, and residential onboarding routing.

---

## 1. Module Header & Library Imports

```jsx
/**
 * SmartComplaintHandler - Institutional Registration Portal (IIIT Naya Raipur)
 * Rich visual design with auto-detected Roll/Branch card, IIIT-NR Hostel/Room selector,
 * and 4-bar password strength meter — zero promotional filler advertising.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAuthConfig, isUndergradHostelStudent } from '../api/auth';
```

### Plain-English Purpose
The header imports essential React state hooks, navigation utilities, authentication operations, visual theme state, and specialized backend authentication helpers. It defines the onboarding portal for students and staff entering the IIIT Naya Raipur facility maintenance ecosystem.

### Line-by-Line Breakdown
- **Lines 1–5**: Comment header summarizing the registration module's capabilities: automated roll/branch detection cards, hostel room assignment, and a 4-bar password entropy meter.
- **Line 6**: Imports core React hooks: `useState` (reactive state manager), `useEffect` (side-effect lifecycle manager), and `useMemo` (memoized computation cache).
- **Line 7**: Imports `Link` (client-side routing hyperlink) and `useNavigate` (imperative redirection hook) from `react-router-dom`.
- **Line 8**: Imports `useAuth` hook from `../context/AuthContext` to access `register` and `loginGoogle` dispatch actions.
- **Line 9**: Imports `useTheme` hook from `../context/ThemeContext` to read `isDark` boolean mode and theme toggle functions.
- **Line 10**: Imports `fetchAuthConfig` and `isUndergradHostelStudent` from `../api/auth`.

---

## 2. Institutional Constants & Helper Utilities

```jsx
const ALLOWED_DOMAIN = 'iiitnr.edu.in';
const GOOGLE_GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID_PATTERN = /^[0-9]+-[a-zA-Z0-9_]+\.apps\.googleusercontent\.com$/;
const IS_PROD_BUILD = Boolean(import.meta.env.PROD);

function getInitialGoogleClientId() {
  const envClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  if (envClientId && GOOGLE_CLIENT_ID_PATTERN.test(envClientId)) {
    return envClientId;
  }
  if (!IS_PROD_BUILD) {
    const devStored = (localStorage.getItem('smart_complaint_google_client_id') || '').trim();
    if (devStored && GOOGLE_CLIENT_ID_PATTERN.test(devStored)) {
      return devStored;
    }
  }
  return '';
}

function ensureGoogleSdkLoaded(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      resolve(window.google);
      return;
    }
    let existingScript = document.querySelector(`script[src="${GOOGLE_GSI_SCRIPT_SRC}"]`);
    if (!existingScript) {
      existingScript = document.createElement('script');
      existingScript.src = GOOGLE_GSI_SCRIPT_SRC;
      existingScript.async = true;
      existingScript.defer = true;
      document.head.appendChild(existingScript);
    }
    const start = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer);
        resolve(window.google);
      } else if (Date.now() - start >= timeoutMs) {
        clearInterval(timer);
        reject(new Error('Google SDK timed out.'));
      }
    }, 100);
  });
}
```

### Plain-English Purpose
Enforces institutional domain restrictions (`iiitnr.edu.in`), extracts Google OAuth Client IDs from environment variables or storage, and dynamically loads Google's Identity Services JavaScript bundle into the DOM.

### Line-by-Line Breakdown
- **Line 12**: `ALLOWED_DOMAIN` restricts registration strictly to `@iiitnr.edu.in` accounts.
- **Line 13**: `GOOGLE_GSI_SCRIPT_SRC` defines Google's official GSI JavaScript CDN location.
- **Line 14**: `GOOGLE_CLIENT_ID_PATTERN` validates the alphanumeric client ID pattern.
- **Line 15**: `IS_PROD_BUILD` extracts Vite's production environment boolean.
- **Lines 17–29**: `getInitialGoogleClientId` resolves client ID from Vite environment or development `localStorage`.
- **Lines 31–56**: `ensureGoogleSdkLoaded` returns a Promise that injects `<script src="https://accounts.google.com/gsi/client" async defer>` if not already present, polling every $100\text{ ms}$ until loaded.

---

## 3. Password Entropy & Strength Evaluator

```jsx
function evaluatePasswordStrength(pw) {
  if (!pw) return { score: 0, label: 'Minimum 6 characters', color: 'bg-slate-200' };
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
This pure function implements an in-memory password entropy evaluator. It grades passwords across four distinct criteria (length $\ge 6$, length $\ge 10$, mixed casing, digits or special symbols) and outputs a numeric score from 1 to 4 along with descriptive labels and CSS color classes for the UI strength meter.

### Line-by-Line Breakdown
- **Line 58**: Declares `evaluatePasswordStrength(pw)`.
- **Line 59**: Returns default score 0 if input string is empty.
- **Lines 60–64**: Increments `score` for:
  - Base length $\ge 6$ characters ($+1$).
  - Extended length $\ge 10$ characters ($+1$).
  - Mixed uppercase and lowercase letters (`/[A-Z]/.test(pw) && /[a-z]/.test(pw)`) ($+1$).
  - Contains numbers or special non-alphanumeric characters (`/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)`) ($+1$).
- **Lines 66–72**: Maps score to visual indicator:
  - 1: `'Fair'` (`bg-amber-500`)
  - 2: `'Good'` (`bg-sky-500`)
  - 3: `'Strong'` (`bg-emerald-500`)
  - 4: `'Excellent'` (`bg-teal-400`)

---

## 4. Component Declaration & Progressive Wizard State

```jsx
export default function Register() {
  const navigate = useNavigate();
  const { register, loginGoogle, currentUser, authInitializing } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [googleClientId, setGoogleClientId] = useState(getInitialGoogleClientId);
  const [showClientIdModal, setShowClientIdModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
```

### Plain-English Purpose
Initializes reactive memory buffers governing the progressive 2-step registration wizard. Users first provide and validate their institutional email in Step 1 (`'email'`) before entering and confirming credentials in Step 2 (`'password'`).

### Line-by-Line Breakdown
- **Lines 75–78**: Declares `Register` component and extracts hooks.
- **Line 80**: `step` governs the wizard stage (`'email'` or `'password'`).
- **Lines 81–85**: Form buffers for `email`, `password`, `confirmPassword`, `showPassword`, and `rememberMe`.
- **Lines 87–93**: Manages Google client ID inputs, loading spinners, and validation error messages.

---

## 5. Roll Number & Academic Branch Parser

```jsx
  const parseEmailMetadata = (rawEmail) => {
    const clean = (rawEmail || '').trim().toLowerCase();
    if (!clean.endsWith(`@${ALLOWED_DOMAIN}`) || clean.startsWith('@')) return null;
    const prefix = clean.split('@')[0];

    // Do not show preview card for emails that do not have roll numbers/digits
    if (!/\d/.test(prefix)) {
      return null;
    }

    const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*?)(?:20)?(\d{2})(\d{2,5})$/i);
    if (!match) return null;

    const rawName = match[1].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
    const code = match[3];
    let dept = 'Computer Science & Engineering';
    let deptCode = 'CSE';
    if (code.startsWith('101') || code.endsWith('01')) {
      dept = 'Data Science & Artificial Intelligence';
      deptCode = 'DSAI';
    } else if (code.startsWith('102') || code.endsWith('02') || code === '302') {
      dept = 'Electronics & Communication Engineering';
      deptCode = 'ECE';
    }
    return { fullName: rawName, department: dept, deptCode };
  };

  const livePreview = useMemo(() => parseEmailMetadata(email), [email]);
  const pwStrength = useMemo(() => evaluatePasswordStrength(password), [password]);
```

### Plain-English Purpose
This heuristic algorithm parses IIIT Naya Raipur's institutional student email patterns. It extracts the student's name, matriculation year, and specific engineering branch (CSE, DSAI, or ECE) directly from the email prefix, dynamically generating a live preview card before account creation.

### Line-by-Line Breakdown
- **Lines 124–127**: Sanitizes email and ensures it ends with `@iiitnr.edu.in`. Extracts username `prefix`.
- **Lines 129–132**: Verifies prefix contains digits (roll numbers). If the email is a faculty/staff address without digits (e.g., `director@iiitnr.edu.in`), returns `null` to avoid false student categorization.
- **Lines 134–136**: Matches regex `/^([a-z]+(?:[._][a-z]+)*?)(?:20)?(\d{2})(\d{2,5})$/i`:
  - Captures name segments (e.g., `nikhil`).
  - Captures batch year digits (e.g., `26`).
  - Captures internal roll number sequence (e.g., `100`).
- **Lines 137–148**:
  - Replaces delimiters (`.` or `_`) with spaces and title-cases the name.
  - Inspects roll digits `code` to resolve the academic department:
    - Codes matching `101` or ending in `01` $\rightarrow$ **Data Science & Artificial Intelligence (DSAI)**
    - Codes matching `102`, `302`, or ending in `02` $\rightarrow$ **Electronics & Communication Engineering (ECE)**
    - Default $\rightarrow$ **Computer Science & Engineering (CSE)**
- **Lines 151–152**: Memoizes `livePreview` and `pwStrength` to eliminate unnecessary regex recalculations during re-renders.

---

## 6. Registration Submission & Onboarding Handlers

```jsx
  const handleContinueWithGoogle = async () => {
    setError(null);
    let activeClientId = (googleClientId || getInitialGoogleClientId()).trim();
    if (!activeClientId) {
      try {
        setGoogleLoading(true);
        const cfg = await fetchAuthConfig();
        const remoteId = (cfg?.google_client_id || '').trim();
        if (remoteId && GOOGLE_CLIENT_ID_PATTERN.test(remoteId)) {
          activeClientId = remoteId;
          setGoogleClientId(remoteId);
        }
      } catch (_) {
      } finally {
        setGoogleLoading(false);
      }
    }
    if (!activeClientId) {
      if (IS_PROD_BUILD) {
        setError('Google SSO is not configured. Please register with email and password.');
        return;
      }
      setShowClientIdModal(true);
      return;
    }
    try {
      setGoogleLoading(true);
      await ensureGoogleSdkLoaded();
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'openid email profile',
        hosted_domain: ALLOWED_DOMAIN,
        hd: ALLOWED_DOMAIN,
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error);
            setGoogleLoading(false);
            return;
          }
          try {
            const user = await loginGoogle({
              access_token: tokenResponse.access_token,
              hd: ALLOWED_DOMAIN,
              remember_me: rememberMe,
              is_registration: true,
            });
            if (isUndergradHostelStudent(user?.email)) {
              navigate('/residence-info', { replace: true });
            } else {
              navigate('/submit', { replace: true });
            }
          } catch (err) {
            setError(err.response?.data?.detail || err.message);
            setGoogleLoading(false);
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleContinueWithEmail = (e) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Registration requires an official @${ALLOWED_DOMAIN} email.`);
      return;
    }
    setStep('password');
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const meta = parseEmailMetadata(cleanEmail);
      const user = await register({
        name: meta?.fullName || cleanEmail.split('@')[0],
        email: cleanEmail,
        password,
        role: 'STUDENT',
        department_name: meta?.department || 'Computer Science & Engineering',
        remember_me: rememberMe,
      });
      if (isUndergradHostelStudent(cleanEmail)) {
        navigate('/residence-info', { replace: true });
      } else {
        navigate('/submit', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Registration failed.');
      setLoading(false);
    }
  };
```

### Plain-English Purpose
These functions govern the submission workflows:
- `handleContinueWithGoogle` executes OAuth registration, setting `is_registration: true` so the backend creates the user record if it does not yet exist.
- `handleContinueWithEmail` transitions the UI from Step 1 to Step 2 after validating the institutional email domain.
- `handleRegisterSubmit` verifies password match and length, automatically injects parsed academic metadata (name and department), creates the student account, and redirects undergraduate students to `/residence-info` for room setup.

### Line-by-Line Breakdown
- **Lines 154–217**: `handleContinueWithGoogle` configures `initTokenClient` with `is_registration: true`. Upon token retrieval, redirects undergraduate hostel students to `/residence-info` and all others directly to `/submit`.
- **Lines 219–228**: `handleContinueWithEmail` checks domain validity and transitions `setStep('password')`.
- **Lines 230–263**: `handleRegisterSubmit`:
  - Validates `password.length >= 6` and `password === confirmPassword`.
  - Derives `meta` via `parseEmailMetadata(cleanEmail)`.
  - Dispatches `register` payload with parsed `name` and `department_name`.
  - Evaluates `isUndergradHostelStudent(cleanEmail)` to navigate either to `/residence-info` or `/submit`.

---

## 7. Password Strength Meter Visualization

```jsx
                  <div className="mt-2 grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`rounded-full transition-all ${
                          pwStrength.score >= bar ? pwStrength.color : (isDark ? 'bg-zinc-800' : 'bg-slate-300')
                        }`}
                      />
                    ))}
                  </div>
```

### Plain-English Purpose
Renders a 4-segment colored progress bar beneath the password field. As the student types, the segments dynamically light up (from amber for Fair to teal for Excellent), providing visual cues to choose stronger credentials.

---

## 8. High-Frequency Viva & Technical Defense Guide

### Q1: Why does the registration process employ a 2-step progressive disclosure wizard?
**Viva Answer**: Asking users to complete a large form containing email, full name, roll number, academic department, password, and password confirmation all at once creates cognitive friction. By dividing registration into Step 1 (Email verification) and Step 2 (Password creation), the portal parses and auto-populates the student's name, batch, and engineering branch automatically, eliminating manual typing and reducing registration drop-off.

### Q2: How does the system automatically detect a student's department from their email address?
**Viva Answer**: IIIT Naya Raipur follows standardized institutional email conventions for undergraduates: `<name><year><branch_and_roll>@iiitnr.edu.in`. In `parseEmailMetadata`, regular expression parsing extracts the final numeric segment. Codes matching `101` correspond to Data Science & Artificial Intelligence (DSAI), codes matching `102` or `302` correspond to Electronics & Communication Engineering (ECE), and the remainder correspond to Computer Science & Engineering (CSE).

### Q3: Why are registered students redirected to `/residence-info` rather than their dashboard?
**Viva Answer**: When a student files a complaint (e.g., "Fan not spinning"), the maintenance routing engine requires a precise physical location (e.g., "Bhabha House, Floor 2, Room 214"). If a student has no residential assignment on file, tickets cannot be dispatched accurately. Redirecting undergraduate students to `/residence-info` ensures hostel building and room numbers are established immediately after registration.

### Q4: How is client-side password entropy calculated?
**Viva Answer**: `evaluatePasswordStrength` calculates a deterministic score from 0 to 4 based on four criteria: length $\ge 6$, length $\ge 10$, mixed casing (`[A-Z]` and `[a-z]`), and numbers/special characters (`\d` or `[^A-Za-z0-9]`). Each satisfied criterion increments the score, which maps directly to the 4 visual segments of the strength meter.

---

## 9. Quick Reference Summary Table

| Identifier / Function | Type / Scope | Operational Definition |
| :--- | :--- | :--- |
| `ALLOWED_DOMAIN` | Constant String | Mandatory domain constraint (`iiitnr.edu.in`) |
| `step` | State (`'email'\|'password'`) | Controls the active step in the 2-stage progressive wizard |
| `parseEmailMetadata` | Parser Function | Extracts student name, matriculation year, and branch from roll number |
| `evaluatePasswordStrength`| Utility Function | Computes entropy score (0–4) and assigns color classes |
| `livePreview` | Memoized Object | Formatted identity card showing name and department from email |
| `pwStrength` | Memoized Object | Cached password evaluation result governing the 4-bar meter |
| `handleContinueWithGoogle`| OAuth Handler | Dispatches Google GSI registration flow restricted to institutional domain |
| `handleRegisterSubmit` | Form Handler | Submits completed credentials and routes user based on student profile |
