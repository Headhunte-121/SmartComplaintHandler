# Institutional Login Portal (`Login.jsx`)

Comprehensive architectural and line-by-line documentation for `frontend/src/pages/Login.jsx`. This document provides collegiate viva committees, code reviewers, and systems architects with an exhaustive dissection of institutional domain verification, Google Identity Services (GSI) OAuth 2.0 token flow, live profile detection, and role-based route redirection.

---

## 1. Module Header & Library Imports

```jsx
/**
 * SmartComplaintHandler - Institutional Login Portal (IIIT Naya Raipur)
 * Rich visual design with ambient background, glass badge, auto-detected student/staff card,
 * and quick role switcher — zero promotional filler advertising.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAuthConfig, resolveIiitnrProfileFromEmail, isUndergradHostelStudent } from '../api/auth';
```

### Plain-English Purpose
The header imports essential React state hooks, navigation utilities, global authentication and theme contexts, and specialized institutional identity resolvers. It sets up the primary security gatekeeper for IIIT Naya Raipur, ensuring only authorized students, faculty, facility managers, and Directorate SuperAdmins access the system.

### Line-by-Line Breakdown
- **Lines 1–5**: Comment header describing the login portal's architectural focus: ambient styling, auto-detected student/staff identity cards, and role switching without marketing filler.
- **Line 6**: Imports core React hooks: `useState` (state variable manager), `useEffect` (side-effect lifecycle manager), and `useMemo` (cached value computer).
- **Line 7**: Imports `Link` (client-side hyperlink) and `useNavigate` (imperative redirection hook) from `react-router-dom`.
- **Line 8**: Imports `useAuth` hook from `../context/AuthContext` to access authentication methods (`login`, `loginGoogle`), active session (`currentUser`), and startup state (`authInitializing`).
- **Line 9**: Imports `useTheme` hook from `../context/ThemeContext` for dark/light display control.
- **Line 10**: Imports institutional authentication utilities from `../api/auth`:
  - `fetchAuthConfig`: Queries backend server configuration for Google Client ID settings.
  - `resolveIiitnrProfileFromEmail`: Analyzes institutional email strings to deduce batch year, department, branch, and role.
  - `isUndergradHostelStudent`: Evaluates whether the user is an undergraduate student subject to mandatory hostel room onboarding.

---

## 2. Institutional Constants & OAuth Helper Functions

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
        reject(new Error('Google SDK timed out while loading.'));
      }
    }, 100);
  });
}
```

### Plain-English Purpose
This section establishes security constants and manages the asynchronous injection of the Google Identity Services (GSI) software development kit (SDK). It enforces that only `@iiitnr.edu.in` accounts are authorized and loads the external Google authentication library dynamically without blocking the initial page render.

### Line-by-Line Breakdown
- **Line 12**: `ALLOWED_DOMAIN` sets the strict institutional hosted domain requirement (`iiitnr.edu.in`).
- **Line 13**: `GOOGLE_GSI_SCRIPT_SRC` points to Google's official GSI JavaScript bundle.
- **Line 14**: `GOOGLE_CLIENT_ID_PATTERN` defines a strict regular expression validating Google OAuth client ID formats (`<digits>-<hash>.apps.googleusercontent.com`).
- **Line 15**: `IS_PROD_BUILD` extracts a boolean flag from Vite's build environment.
- **Lines 17–29**: `getInitialGoogleClientId`:
  - First attempts to read `VITE_GOOGLE_CLIENT_ID` from environment variables.
  - In development mode (`!IS_PROD_BUILD`), falls back to checking `smart_complaint_google_client_id` in `localStorage`.
  - Returns the sanitized client ID or an empty string.
- **Lines 31–56**: `ensureGoogleSdkLoaded`:
  - Returns a Promise resolving the `window.google` API object.
  - If `window.google.accounts.oauth2` is already loaded in DOM memory, resolves immediately.
  - Otherwise, dynamically creates a `<script>` tag with `async` and `defer` attributes and injects it into `<head>`.
  - Sets up an interval checking every $100\text{ ms}$ until the library mounts or the $8000\text{ ms}$ timeout expires.

---

## 3. Component Declaration & State Initializers

```jsx
export default function Login() {
  const navigate = useNavigate();
  const { login, loginGoogle, currentUser, authInitializing } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
Initializes component state variables tracking credentials (email, password, visibility toggles), Google client ID configuration, network loading indicators, and error banners.

### Line-by-Line Breakdown
- **Lines 58–61**: Declares `Login` component and invokes hooks for navigation, authentication operations, and visual theme toggling.
- **Lines 63–66**:
  - `email`: Form input buffer for the institutional email address.
  - `password`: Form input buffer for account password.
  - `showPassword`: Boolean toggle revealing/masking password characters.
  - `rememberMe`: Boolean checkbox governing JWT token persistence length ($30\text{ days}$ vs. session).
- **Lines 68–70**: `googleClientId` initializes via `getInitialGoogleClientId`; `showClientIdModal` and `clientIdInput` manage development-mode OAuth setup.
- **Lines 72–74**: `loading` (email login spinner), `googleLoading` (Google popup spinner), and `error` (rejection error message).

---

## 4. Role-Based Navigation & Onboarding Gateway

```jsx
  const handleRoleRedirect = (user) => {
    if (!user) return;
    if (isUndergradHostelStudent(user?.email)) {
      let isCompleted = false;
      try {
        isCompleted = localStorage.getItem(`iiitnr_residence_completed_${(user.email || '').toLowerCase()}`) === 'true';
      } catch (_) {}
      if (!isCompleted && (!user.hostel_name || !user.room_number)) {
        navigate('/residence-info', { replace: true });
        return;
      }
    }
    const targetRoute =
      user.role === 'SUPER_ADMIN'
        ? '/superadmin'
        : user.role === 'ADMIN'
        ? '/operations'
        : user.role === 'TECHNICIAN'
        ? '/technician'
        : '/student';
    navigate(targetRoute, { replace: true });
  };

  useEffect(() => {
    try {
      localStorage.removeItem('smart_complaint_remember_email');
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!authInitializing && currentUser) {
      handleRoleRedirect(currentUser);
    }
  }, [currentUser, authInitializing, navigate]);

  useEffect(() => {
    if (!googleClientId) {
      fetchAuthConfig()
        .then((cfg) => {
          const remoteId = (cfg?.google_client_id || '').trim();
          if (remoteId && GOOGLE_CLIENT_ID_PATTERN.test(remoteId)) {
            setGoogleClientId(remoteId);
          }
        })
        .catch(() => {});
    }
  }, [googleClientId]);
```

### Plain-English Purpose
This block directs authenticated users to their authorized workspace based on their security clearance. Crucially, it intercepts undergraduate hostel students who have not completed residential room onboarding, redirecting them to `/residence-info` so tickets filed by the student carry precise spatial coordinates.

### Line-by-Line Breakdown
- **Lines 76–87**: `handleRoleRedirect`:
  - If `isUndergradHostelStudent(user.email)` evaluates to `true`, checks if `localStorage` marks room registration as completed.
  - If incomplete and either `hostel_name` or `room_number` is missing from the user record, redirects immediately to `/residence-info`.
- **Lines 88–97**: Deterministic role dispatch routing:
  - `SUPER_ADMIN` $\rightarrow$ `/superadmin` (Directorate Master Console)
  - `ADMIN` $\rightarrow$ `/operations` (Operations & Squad Balancer)
  - `TECHNICIAN` $\rightarrow$ `/technician` (Technician Workstation)
  - Default / Student $\rightarrow$ `/student` (Student Complaint Dashboard)
- **Lines 99–103**: Clears legacy remembered emails on mount.
- **Lines 105–109**: Redirects automatically if an active, valid session (`currentUser`) is already initialized.
- **Lines 111–122**: Queries `/api/v1/auth/config` to dynamically retrieve the production Google Client ID if not configured locally.

---

## 5. Live Institutional Profile Detection

```jsx
  const detectedProfile = useMemo(() => {
    const clean = email.trim().toLowerCase();
    if (!clean.endsWith(`@${ALLOWED_DOMAIN}`) || clean.startsWith('@')) return null;
    return resolveIiitnrProfileFromEmail(clean);
  }, [email]);
```

### Plain-English Purpose
As the user types their email address into the input field, this memoized function parses the email format in real-time. If it matches an IIITNR pattern, it displays an identification card revealing the student's name, roll number, batch, department, and system role before they even click "Sign In".

### Line-by-Line Breakdown
- **Lines 124–128**: `useMemo` cleans the email string. If the email ends with `@iiitnr.edu.in` and contains characters before the `@`, invokes `resolveIiitnrProfileFromEmail(clean)`. Returns parsed metadata or `null`.

---

## 6. Google Identity Services (GSI) OAuth Flow

```jsx
  const fetchGoogleUserProfile = async (accessToken) => {
    const endpoints = [
      'https://www.googleapis.com/oauth2/v3/userinfo',
      'https://openidconnect.googleapis.com/v1/userinfo',
    ];
    for (const url of endpoints) {
      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (res.ok) return await res.json();
      } catch (_) {}
    }
    return null;
  };

  const launchGoogleWorkspaceFlow = async (activeClientId) => {
    try {
      setGoogleLoading(true);
      await ensureGoogleSdkLoaded();
      const cleanHint = email.trim().toLowerCase();

      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'openid email profile',
        hosted_domain: ALLOWED_DOMAIN,
        hd: ALLOWED_DOMAIN,
        hint: cleanHint.endsWith(`@${ALLOWED_DOMAIN}`) ? cleanHint : undefined,
        prompt: 'select_account',
        error_callback: (errObj) => {
          if (errObj?.type !== 'popup_closed') {
            setError(errObj?.message || 'Unable to open Google Sign-In popup.');
          }
          setGoogleLoading(false);
        },
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error_description || tokenResponse.error);
            setGoogleLoading(false);
            return;
          }
          try {
            const profile = await fetchGoogleUserProfile(tokenResponse.access_token);
            if (profile) {
              const userEmail = (profile.email || '').trim().toLowerCase();
              const userHd = (profile.hd || '').trim().toLowerCase();
              if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`) || (userHd && userHd !== ALLOWED_DOMAIN)) {
                setError(`Only @${ALLOWED_DOMAIN} accounts are permitted.`);
                setGoogleLoading(false);
                return;
              }
              const user = await loginGoogle({
                access_token: tokenResponse.access_token,
                email: userEmail,
                name: profile.name,
                picture: profile.picture,
                hd: userHd || ALLOWED_DOMAIN,
                email_verified: profile.email_verified !== false,
                remember_me: rememberMe,
                is_registration: false,
              });
              setGoogleLoading(false);
              handleRoleRedirect(user);
            } else {
              const user = await loginGoogle({
                access_token: tokenResponse.access_token,
                email: cleanHint.endsWith(`@${ALLOWED_DOMAIN}`) ? cleanHint : undefined,
                hd: ALLOWED_DOMAIN,
                remember_me: rememberMe,
                is_registration: false,
              });
              setGoogleLoading(false);
              handleRoleRedirect(user);
            }
          } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Google verification failed.');
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
```

### Plain-English Purpose
Executes the Google OAuth 2.0 token flow. It initializes Google's client-side token client, instructs the popup to restrict selection strictly to the `@iiitnr.edu.in` hosted domain (`hd`), exchanges the authorization token for user profile data, forwards credentials to the backend verification endpoint, and redirects the user upon success.

### Line-by-Line Breakdown
- **Lines 130–142**: `fetchGoogleUserProfile` queries Google's standard userinfo endpoints with the Bearer access token to retrieve verified name, email, avatar URL, and hosted domain attributes.
- **Lines 144–147**: `launchGoogleWorkspaceFlow` sets `googleLoading(true)` and waits for the SDK via `await ensureGoogleSdkLoaded()`.
- **Lines 150–162**: Configures `initTokenClient`:
  - `client_id`: Validated OAuth client identifier.
  - `scope`: Requests `'openid email profile'` claims.
  - `hosted_domain` & `hd`: Enforces `'iiitnr.edu.in'`, hiding external personal Gmail accounts from the popup chooser.
  - `error_callback`: Intercepts popup closures or browser blocks.
- **Lines 163–206**: Asynchronous token response handler:
  - Verifies no OAuth errors occurred.
  - Calls `fetchGoogleUserProfile(tokenResponse.access_token)`.
  - Performs double-check client validation on `profile.email` and `profile.hd`.
  - Dispatches `loginGoogle` payload to backend authentication engine.
  - On success, invokes `handleRoleRedirect(user)`.
- **Line 208**: Requests access token via popup: `tokenClient.requestAccessToken({ prompt: 'select_account' })`.

---

## 7. Password Authentication Handler

```jsx
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your institutional email.');
      return;
    }
    if (!cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
      setError(`Please use your @${ALLOWED_DOMAIN} email address.`);
      return;
    }
    if (!password || password.length < 4) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(cleanEmail, password, rememberMe);
      handleRoleRedirect(user);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Invalid email or password.');
      setLoading(false);
    }
  };
```

### Plain-English Purpose
Processes traditional username/password authentication for staff and students. Enforces domain validation, verifies password existence, sends the login request to the backend REST endpoint, and redirects the user upon receiving a valid JWT token.

### Line-by-Line Breakdown
- **Lines 243–246**: Prevents default HTML form refresh and clears prior errors.
- **Lines 247–258**: Validates that email is present, ends with `@iiitnr.edu.in`, and password is at least 4 characters.
- **Lines 259–266**: Sets `loading(true)`, invokes `login(cleanEmail, password, rememberMe)`, redirects via `handleRoleRedirect(user)`, and catches authentication rejections with user-friendly error messages.

---

## 8. High-Frequency Viva & Technical Defense Guide

### Q1: Why does this application use Google's OAuth 2.0 Token Flow instead of redirect-based code flow?
**Viva Answer**: Single Page Applications (SPAs) built with React benefit significantly from Google Identity Services token flow using popups (`initTokenClient`). It avoids complete page reloads, preserves client-side component state, eliminates complicated URL fragment query parsing, and provides immediate user feedback within the existing session.

### Q2: What prevents a user from logging into the portal with a personal `@gmail.com` address?
**Viva Answer**: Security is enforced at three distinct levels:
1. **Google SDK Client Level**: The configuration passes `hosted_domain: 'iiitnr.edu.in'` and `hd: 'iiitnr.edu.in'`, causing Google's account picker to filter out non-institutional accounts.
2. **Frontend Callback Level**: `launchGoogleWorkspaceFlow` checks `if (!userEmail.endsWith('@iiitnr.edu.in'))` and rejects the login if an external email is received.
3. **Backend Server Level**: `/api/v1/auth/google` verifies the Google ID token cryptographically and rejects any token whose email domain does not match `@iiitnr.edu.in`.

### Q3: Why are undergraduate students redirected to `/residence-info` instead of the complaint dashboard?
**Viva Answer**: First-year and undergraduate hostel students must have their residence details (hostel building and room number) permanently associated with their profile. If a student attempts to file a complaint without these details, the automated keyword and dispatch engines cannot resolve the spatial location of the issue. Redirecting them to `/residence-info` ensures their residential profile is complete before they file tickets.

### Q4: How does the email input field automatically recognize student batch and branch?
**Viva Answer**: In `Login.jsx`, a reactive `useMemo` evaluates the email on every keystroke. It passes the email to `resolveIiitnrProfileFromEmail`, which parses institutional roll number conventions (e.g., extracting year, degree program, and branch code from identifiers like `nikhil26100@iiitnr.edu.in`). It then renders a live identification badge showing their academic profile before submission.

---

## 9. Quick Reference Summary Table

| Identifier / Function | Type / Scope | Operational Definition |
| :--- | :--- | :--- |
| `ALLOWED_DOMAIN` | Constant String | Mandatory domain constraint (`iiitnr.edu.in`) |
| `GOOGLE_GSI_SCRIPT_SRC` | Constant URL | External CDN source for Google Identity Services JavaScript SDK |
| `ensureGoogleSdkLoaded` | Async Loader | Dynamically injects and verifies Google SDK in DOM memory |
| `handleRoleRedirect` | Routing Coordinator | Routes user to `/superadmin`, `/operations`, `/technician`, `/student`, or `/residence-info` |
| `detectedProfile` | Memoized Object | Live parsed student/staff identity profile derived from email |
| `launchGoogleWorkspaceFlow`| OAuth Handler | Dispatches Google GSI popup flow restricted to institutional domain |
| `handleSignIn` | Form Handler | Submits email and password credentials to backend REST endpoint |
| `rememberMe` | State (`boolean`) | Controls token expiration lifespan ($30\text{ days}$ vs. browser session) |
