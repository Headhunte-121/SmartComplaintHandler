# Comprehensive Code Walkthrough & Line-by-Line Guide: `frontend/src/api/auth.js`

> **File Location**: [`frontend/src/api/auth.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/api/auth.js)  
> **Prerequisites**: Basic knowledge of C or Python (functions, dictionaries, regular expression matching, asynchronous promises, HTTP GET/POST/PATCH/DELETE). No advanced frontend authentication library background is assumed.  
> **What this file is**: The authentication and user administration API service. It encapsulates all network requests related to identity and access management for IIIT Naya Raipur: logging in with passwords, verifying Google Workspace SSO credentials, client-side roll number parsing (extracting branch, admission batch, and names), sending and verifying OTP challenge tokens, updating student hostel room residences, and managing administrative staff accounts.

---

## Block 1: Imports & Institutional Email Resolution (Lines 1–109)

```javascript
/**
 * SmartComplaintHandler - Authentication & Administration API Client
 * Domain: Handles @iiitnr.edu.in institutional login with Remember Me,
 *         production Google Workspace OAuth2/OIDC SSO (@iiitnr.edu.in Internal org),
 *         student hostel & room profile persistence, stateless OTP challenge tokens,
 *         JWT refresh rotation, and Supabase profile sync.
 */
import axios from 'axios';
import apiClient from './client';

const ALLOWED_DOMAIN = 'iiitnr.edu.in';

/**
 * Resolve IIIT-NR student roll number, branch (100->CSE, 101->DSAI, 102/302->ECE),
 * or staff role from a verified @iiitnr.edu.in email address.
 */
export function resolveIiitnrProfileFromEmail(email, providedName = '') {
  const cleanEmail = (email || '').trim().toLowerCase();
  const prefix = cleanEmail.split('@')[0] || '';

  if (prefix === 'superadmin' || prefix === 'director' || prefix === 'super.admin') {
    return {
      name: providedName || 'Directorate Administrator',
      email: cleanEmail,
      role: 'SUPER_ADMIN',
      department_name: 'Office of the Director',
      identifier: 'Directorate (DIR-01)',
      is_active: true,
    };
  }

  if (
    prefix === 'admin' ||
    prefix === 'estate' ||
    prefix === 'facilities' ||
    prefix.endsWith('.admin')
  ) {
    return {
      name: providedName || 'Campus Administration Staff',
      email: cleanEmail,
      role: 'ADMIN',
      department_name: 'General Administration',
      identifier: 'Campus Administration',
      is_active: true,
    };
  }

  if (prefix.startsWith('tech.') || prefix.includes('technician')) {
    return {
      name: providedName || 'Maintenance Technician',
      email: cleanEmail,
      role: 'TECHNICIAN',
      department_name: 'Maintenance Services',
      identifier: 'Maintenance Squad',
      is_active: true,
    };
  }

  const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*?)(\d{2})(\d{2,5})$/i);
  if (match) {
    const derivedName = match[1]
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
    const year = match[2];
    const code = match[3];

    let deptName = 'Computer Science & Engineering';
    let deptCode = 'CSE';
    if (code.startsWith('101') || code.endsWith('01')) {
      deptName = 'Data Science & Artificial Intelligence';
      deptCode = 'DSAI';
    } else if (code.startsWith('102') || code.endsWith('02') || code === '302') {
      deptName = 'Electronics & Communication Engineering';
      deptCode = 'ECE';
    }

    return {
      name: providedName || derivedName,
      email: cleanEmail,
      role: 'STUDENT',
      department_name: deptName,
      identifier: deptName,
      is_active: true,
    };
  }

  // Do not fabricate student profile for emails without numbers
  if (!/\d/.test(prefix)) {
    return null;
  }

  const fallbackName =
    providedName ||
    prefix
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

  return {
    name: fallbackName,
    email: cleanEmail,
    role: 'STUDENT',
    department_name: 'IIIT-NR Scholar',
    identifier: 'IIIT-NR Scholar',
    is_active: true,
  };
}
```

### 1. Plain-English Purpose
Imports the pre-configured Axios client, sets the university domain constant (`iiitnr.edu.in`), and implements a client-side parser that decomposes any university email address into a structured user profile (identifying Directors, Estate Officers, field technicians, or undergraduate students with their respective academic branches).

### 2. Line-by-Line Breakdown
- **Line 8 (`import axios from 'axios';`)**: Direct Axios instance used for fallback retry requests.
- **Line 9 (`import apiClient from './client';`)**: The primary intercepted API client.
- **Line 11 (`const ALLOWED_DOMAIN = 'iiitnr.edu.in';`)**: Enforces institutional restriction.
- **Lines 17–108 (`resolveIiitnrProfileFromEmail(...)`)**:
  - `cleanEmail.split('@')[0]`: Extracts the username prefix (e.g. `"nikhil22100"` from `"nikhil22100@iiitnr.edu.in"`).
  - Lines 21–30: Recognizes Directorate accounts (`superadmin`, `director`) and assigns `SUPER_ADMIN`.
  - Lines 32–46: Recognizes facilities leadership (`admin`, `estate`, `facilities`) and assigns `ADMIN`.
  - Lines 48–57: Recognizes maintenance squads (`tech.*`) and assigns `TECHNICIAN`.
  - Lines 59–86 (Student Roll Deconstruction):
    - Matches regex: `^([name])(\d{2})(\d{2,5})$`.
    - Converts `"nikhil.gavel"` $\to$ `"Nikhil Gavel"`.
    - Maps roll codes: `101` $\to$ DSAI, `102`/`302` $\to$ ECE, other $\to$ CSE.
    - Assigns role `"STUDENT"`.
  - Lines 88–91: If prefix has no digits and didn't match known staff, returns `null` to avoid fabricating false student records.

### 3. Deep Term & Concept Expansion
- **Client-Side Profile Hinting**: Parsing the email on the frontend allows login forms and Google Sign-In cards to immediately greet the user (e.g. *"Welcome, Nikhil Gavel (Batch '22 CSE)"*) before the backend network request has even completed.

---

## Block 2: Authentication & Google Sign-In Methods (Lines 110–165)

```javascript
export async function fetchAuthConfig() {
  const response = await apiClient.get('/auth/config');
  return response.data;
}

export async function loginUser(email, password, rememberMe = false) {
  const response = await apiClient.post('/auth/login', {
    email: email.trim().toLowerCase(),
    password,
    remember_me: Boolean(rememberMe),
  });
  return response.data;
}

export async function loginWithGoogle(googleData) {
  const cleanEmail = googleData.email ? googleData.email.trim().toLowerCase() : '';
  const cleanHd = googleData.hd ? googleData.hd.trim().toLowerCase() : '';

  if (cleanEmail && !cleanEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new Error(
      `Access denied: Google Sign-In is strictly restricted to official @${ALLOWED_DOMAIN} institutional accounts.`
    );
  }
  if (cleanHd && cleanHd !== ALLOWED_DOMAIN) {
    throw new Error(
      `Access denied: Hosted domain '${cleanHd}' is not authorized. Must be @${ALLOWED_DOMAIN}.`
    );
  }

  const payload = {
    access_token: googleData.access_token || undefined,
    credential: googleData.credential || undefined,
    email: cleanEmail || undefined,
    name: googleData.name ? googleData.name.trim() : undefined,
    picture: googleData.picture || undefined,
    hd: cleanHd || ALLOWED_DOMAIN,
    email_verified: googleData.email_verified !== undefined ? Boolean(googleData.email_verified) : true,
    remember_me: googleData.remember_me !== false,
    is_registration: Boolean(googleData.is_registration),
  };

  try {
    const response = await apiClient.post('/auth/google', payload);
    return response.data;
  } catch (err) {
    // If a custom VITE_API_BASE_URL failed with a network error on Vercel, retry via relative /api/v1/auth/google rewrite
    if (!err.response && apiClient.defaults.baseURL !== '/api/v1') {
      const retryRes = await axios.post('/api/v1/auth/google', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      });
      return retryRes.data;
    }
    throw err;
  }
}
```

### 1. Plain-English Purpose
- `fetchAuthConfig`: Retrieves public server configuration (such as the Google Client ID).
- `loginUser`: Posts email and password credentials to the backend.
- `loginWithGoogle`: Validates Google Workspace tokens, verifies that the email and hosted domain (`hd`) match `iiitnr.edu.in`, and features an automatic network retry via relative URL rewrites if cloud proxies drop the connection.

### 2. Line-by-Line Breakdown
- **Lines 110–113 (`fetchAuthConfig`)**: Calls `GET /auth/config`.
- **Lines 115–122 (`loginUser`)**: Posts `{ email, password, remember_me }` to `POST /auth/login`.
- **Lines 124–165 (`loginWithGoogle`)**:
  - Validates `cleanEmail.endsWith('@iiitnr.edu.in')`. Throws an immediate local error if a student tries logging in with a personal `@gmail.com` address.
  - Formats the JSON payload containing Google credentials, name, and profile picture.
  - Lines 155–163: Self-healing network retry: if a cross-origin CORS error occurs on Vercel, retries via the local serverless `/api/v1/auth/google` rewrite.

---

## Block 3: Active Undergraduate Batch & Hostel Eligibility (Lines 167–227)

```javascript
/**
 * Return array of valid 2-digit undergraduate batch years from current year down to last 4 years.
 * For an institution like IIIT-NR with 4-year B.Tech programs:
 * If current year is 2026, active undergraduate batches are:
 * - 2026 (1st year / freshers): '26'
 * - 2025 (2nd year / sophomores): '25'
 * - 2024 (3rd year): '24'
 * - 2023 (4th year / graduating): '23'
 * - 2022 (recent batch / extended): '22'
 */
export function getActiveUndergradBatchYears(windowYears = 4) {
  const currentFullYear = new Date().getFullYear();
  const current2Digit = currentFullYear % 100;
  const years = [];
  for (let i = 0; i <= windowYears; i++) {
    const yr = (current2Digit - i + 100) % 100;
    years.push(String(yr).padStart(2, '0'));
  }
  return years;
}

/**
 * Determine if an email belongs to an active undergraduate student following the batch-branch roll schema:
 * Matches [name][batch_year][branch_code][roll]@iiitnr.edu.in
 * Where batch_year is from current year down to the last 4 years (e.g., 26, 25, 24, 23, 22),
 * and branch_code is in (100-102): 100 (CSE), 101 (DSAI), 102 (ECE).
 * PhD scholars, M.Tech, faculty, staff, technicians, and older alumni bypass this.
 */
export function isUndergradHostelStudent(email) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (!clean.endsWith(`@${ALLOWED_DOMAIN}`) || clean.startsWith('@')) return false;

  const prefix = clean.split('@')[0];

  // Exclude known institutional roles, staff, faculty, technicians, and PhD scholars
  if (
    prefix.startsWith('phd') ||
    prefix.includes('scholar') ||
    prefix.startsWith('mtech') ||
    prefix.startsWith('tech.') ||
    prefix.includes('technician') ||
    prefix.startsWith('admin') ||
    prefix.startsWith('faculty') ||
    prefix.startsWith('staff') ||
    prefix.startsWith('estate') ||
    prefix.startsWith('facilities') ||
    prefix === 'superadmin' ||
    prefix === 'director'
  ) {
    return false;
  }

  // Undergrad roll match: [name][optional 20][2-digit-year][branch-code 100/101/102][optional sequence digits]
  const match = prefix.match(/^([a-z]+(?:[._][a-z]+)*?)(?:20)?(\d{2})(100|101|102)\d*$/i);
  if (!match) return false;

  const year = match[2];
  const activeYears = getActiveUndergradBatchYears(4);
  return activeYears.includes(year);
}
```

### 1. Plain-English Purpose
Determines whether an account belongs to an active undergraduate student living on campus.
- `getActiveUndergradBatchYears`: Dynamically generates the 4 active B.Tech batch years based on the current calendar year (e.g. In 2026 $\to$ `['26', '25', '24', '23', '22']`).
- `isUndergradHostelStudent`: Matches student roll numbers while filtering out PhD scholars, M.Techs, and professors. Used to prompt incoming undergraduate freshers for their hostel and room numbers during initial login.

### 2. Line-by-Line Breakdown
- **Lines 177–186 (`getActiveUndergradBatchYears`)**:
  - `new Date().getFullYear() % 100`: Converts `2026` to `26`.
  - Loops over `windowYears` to produce `['26', '25', '24', '23', '22']`.
- **Lines 195–227 (`isUndergradHostelStudent`)**:
  - Checks if email ends with `@iiitnr.edu.in`.
  - Lines 203–218: Excludes faculty and postgraduate handles (`phd`, `mtech`, `admin`, `tech.*`).
  - Line 221: Matches regex for B.Tech roll schema (`100` = CSE, `101` = DSAI, `102` = ECE).
  - Line 226: Verifies that the student's admission year is currently enrolled in college.

---

## Block 4: OTP Verification & User Registration (Lines 229–260)

```javascript
export async function sendOTP(email) {
  const response = await apiClient.post('/auth/send-otp', {
    email: email.trim().toLowerCase(),
  });
  return response.data;
}

export async function verifyOTP(email, otp, otpToken = undefined) {
  const response = await apiClient.post('/auth/verify-otp', {
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
    otp_token: otpToken || undefined,
  });
  return response.data;
}

export async function registerUser(registrationData) {
  const response = await apiClient.post('/auth/register', {
    name: registrationData.name ? registrationData.name.trim() : undefined,
    email: registrationData.email.trim().toLowerCase(),
    password: registrationData.password,
    department_name: registrationData.department_name || undefined,
    phone: registrationData.phone ? registrationData.phone.trim() : undefined,
    hostel_name: registrationData.hostel_name ? registrationData.hostel_name.trim() : undefined,
    room_number: registrationData.room_number ? registrationData.room_number.trim() : undefined,
    remember_me: Boolean(registrationData.remember_me),
    otp: registrationData.otp ? registrationData.otp.trim() : undefined,
    otp_token: registrationData.otp_token || undefined,
  });
  return response.data;
}
```

### 1. Plain-English Purpose
- `sendOTP`: Dispatches a 6-digit numeric verification code to the student's email.
- `verifyOTP`: Verifies the 6-digit code against the serverless HMAC verification token.
- `registerUser`: Sends complete registration payload (including password, department, hostel, room, and verified OTP) to `POST /auth/register`.

---

## Block 5: Profile Updates, Password Changes & Session Lifecycle (Lines 261–296)

```javascript
export async function updateUserProfile(profileData) {
  const response = await apiClient.patch('/auth/profile', {
    name: profileData.name !== undefined ? profileData.name : undefined,
    phone: profileData.phone !== undefined ? profileData.phone : undefined,
    hostel_name: profileData.hostel_name !== undefined ? profileData.hostel_name : undefined,
    room_number: profileData.room_number !== undefined ? profileData.room_number : undefined,
    department_name: profileData.department_name !== undefined ? profileData.department_name : undefined,
  });
  return response.data;
}

export async function refreshSession(refreshToken, rememberMe = true) {
  const response = await apiClient.post('/auth/refresh', {
    refresh_token: refreshToken,
    remember_me: Boolean(rememberMe),
  });
  return response.data;
}

export async function logoutUser() {
  const response = await apiClient.post('/auth/logout');
  return response.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiClient.post('/auth/change-password', {
    current_password: currentPassword || undefined,
    new_password: newPassword,
  });
  return response.data;
}

export async function fetchMe() {
  const response = await apiClient.get('/auth/me');
  return response.data;
}
```

### 1. Plain-English Purpose
Encapsulates account maintenance endpoints:
- `updateUserProfile`: Partially updates hostel residence, phone number, or display name via `PATCH /auth/profile`.
- `refreshSession`: Explicitly requests fresh tokens via `POST /auth/refresh`.
- `logoutUser`: Instructs the backend to invalidate the active session.
- `changePassword`: Updates user password after verifying current password.
- `fetchMe`: Fetches the authoritative user profile for the current access token.

---

## Block 6: Administrative Staff Directory & Governance (Lines 298–316)

```javascript
export async function fetchAdmins() {
  const response = await apiClient.get('/auth/admins');
  return response.data;
}

export async function createAdmin(adminData) {
  const response = await apiClient.post('/auth/admins', adminData);
  return response.data;
}

export async function deleteAdmin(userId) {
  const response = await apiClient.delete(`/auth/admins/${userId}`);
  return response.data;
}

export async function purgeTickets() {
  const response = await apiClient.post('/auth/purge-tickets');
  return response.data;
}
```

### 1. Plain-English Purpose
SuperAdmin operations:
- `fetchAdmins`: Fetches all facility administrators and technicians.
- `createAdmin`: Provisions a new facility administrator account with assigned department.
- `deleteAdmin`: Deactivates an administrator's access credentials.
- `purgeTickets`: Maintenance reset action used in staging and automated testing.

---

## 7. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why does `loginWithGoogle` validate the email and `hd` domain on the client side before calling the backend?**  
> **Answer**: It enforces **early validation for user feedback**. If a student selects a personal `@gmail.com` account in the Google popup, checking `cleanEmail.endsWith('@iiitnr.edu.in')` immediately displays an informative warning banner in the UI without making an unnecessary network call that would be rejected by the backend.

> [!TIP]
> **Q2: What is the purpose of `isUndergradHostelStudent`?**  
> **Answer**: It distinguishes undergraduate students residing in campus hostels (Ramanujan, Bhabha, Bose, etc.) from day scholars, faculty, and administrative staff. When an undergraduate logs in for the first time, this function returns `true`, triggering the frontend router to usher them to the Residence Onboarding screen (`/residence-info`) to save their room number before they can file complaints.

> [!TIP]
> **Q3: How does `loginWithGoogle` handle CORS or reverse-proxy failures on cloud platforms like Vercel?**  
> **Answer**: In `loginWithGoogle`, if the initial request to the configured `VITE_API_BASE_URL` encounters a network failure without a server response (`!err.response`), it executes an automatic fallback retry:
> ```javascript
> const retryRes = await axios.post('/api/v1/auth/google', payload, ...);
> ```
> This routes the request through Vercel's relative path serverless rewrites, eliminating network failures caused by temporary DNS or SSL certificate mismatches.

---

## 8. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `auth.js` |
| :--- | :--- | :--- |
| `ALLOWED_DOMAIN` | String constant (`"iiitnr.edu.in"`) | Institutional domain guard. |
| `resolveIiitnrProfileFromEmail` | Client-side email parser | Extracts student names, admission batch, and branch from email. |
| `loginUser` | HTTP POST wrapper | Authenticates with email and password. |
| `loginWithGoogle` | Google OAuth client wrapper | Validates Google Workspace tokens with domain checking and retry logic. |
| `getActiveUndergradBatchYears` | Dynamic year generator | Computes current active B.Tech batches (e.g. `26, 25, 24, 23, 22`). |
| `isUndergradHostelStudent` | Student qualification checker | Triggers residence onboarding for hostel undergraduates. |
| `sendOTP` & `verifyOTP` | 2-Factor challenge callers | Sends and verifies 6-digit email confirmation codes. |
| `updateUserProfile` | Profile mutation caller | Updates student hostel, room number, or phone via `PATCH /auth/profile`. |
| `fetchAdmins` & `createAdmin` | Directorate governance callers | Powers the SuperAdmin Staff Directory page. |
