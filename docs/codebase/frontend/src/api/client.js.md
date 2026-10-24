# Comprehensive Code Walkthrough & Line-by-Line Guide: `frontend/src/api/client.js`

> **File Location**: [`frontend/src/api/client.js`](file:///c:/College/IT%20Workshop/SmartComplaintHandler/frontend/src/api/client.js)  
> **Prerequisites**: Basic knowledge of C or Python (functions, HTTP requests, queues, dictionaries, try/catch exception handling). No advanced web networking background is assumed.  
> **What this file is**: The central HTTP network client for the entire frontend. Built on top of the Axios library, it handles:
> 1. **Automatic Base URL Normalization**: Resolves development vs. production server addresses and bypasses Windows IPv6 DNS stalls by normalizing `localhost` to `127.0.0.1`.
> 2. **Proactive JWT Inspection**: Decodes token expiration (`exp`) in browser RAM with a 30-second clock-skew buffer.
> 3. **Automatic Bearer Token Injection**: Injects `Authorization: Bearer <token>` into outgoing requests.
> 4. **Concurrency-Locked Token Rotation**: If an access token expires while multiple dashboard widgets make simultaneous requests, the client pauses the queue, executes a single refresh call, and seamlessly replays all queued requests with the fresh token.

---

## Block 1: Imports & Storage Key Constants (Lines 1–15)

```javascript
/**
 * SmartComplaintHandler - Base API Client
 * Blueprint Reference: V1/M1/frontend/02_base_api_client.md
 * Role: Configures Axios instance with normalized base URL, automatic /api/v1 suffix guard,
 *       proactive JWT expiration checking, Bearer token injection, and automatic 401 refresh rotation.
 */
import axios from 'axios';

export const AUTH_TOKEN_KEY = 'smart_complaint_auth_token';
export const REFRESH_TOKEN_KEY = 'smart_complaint_refresh_token';
export const AUTH_USER_KEY = 'smart_complaint_auth_user';
export const AUTH_EXPIRES_AT_KEY = 'smart_complaint_auth_expires_at';
export const AUTH_EXPIRED_EVENT = 'smart-complaint:auth-expired';
export const AUTH_FORBIDDEN_EVENT = 'smart-complaint:auth-forbidden';
```

### 1. Plain-English Purpose
Loads the Axios HTTP library and exports standardized string constants used to read and write authentication tokens in browser storage (`localStorage` and `sessionStorage`) as well as global custom event names.

### 2. Line-by-Line Breakdown
- **Lines 1–6 (`/** ... */`)**: JSDoc header citing Blueprint Reference Module 1 (`02_base_api_client.md`).
- **Line 7 (`import axios from 'axios';`)**: Imports Axios, a promise-based HTTP client for the browser.
- **Lines 9–12 (Storage Key Constants)**:
  - `AUTH_TOKEN_KEY`: Key storing the short-lived JWT access token string in browser storage.
  - `REFRESH_TOKEN_KEY`: Key storing the long-lived refresh token.
  - `AUTH_USER_KEY`: Key storing serialized user profile data (name, email, role).
  - `AUTH_EXPIRES_AT_KEY`: Key storing the ISO timestamp of token expiration.
- **Lines 13–14 (Event Constants)**:
  - `AUTH_EXPIRED_EVENT`: Fired when a session expires, triggering `AuthContext` to log the user out.
  - `AUTH_FORBIDDEN_EVENT`: Fired on HTTP 403 Forbidden responses.

### 3. Deep Term & Concept Expansion
- **Why Use Constants for Storage Keys?**: If five different files store `"auth_token"`, but one file has a typo (`"aut_token"`), the user gets logged out randomly. Using exported constants (`AUTH_TOKEN_KEY`) guarantees that all files read and write to the exact same storage slot.

### 4. Runtime Mechanics & Security
- **Browser Storage Isolation**: `localStorage` and `sessionStorage` are sandboxed by origin (`protocol + domain + port`). Other websites cannot read these keys.

---

## Block 2: Proactive JWT Expiration Inspector: `isTokenExpired` (Lines 16–44)

```javascript
/**
 * Inspect JWT `exp` claim or stored ISO timestamp to detect expired tokens proactively
 * (with a 30-second clock-skew buffer).
 */
export function isTokenExpired(token, storedExpiresAt = null) {
  if (!token) return true;

  if (storedExpiresAt) {
    const expTime = Date.parse(storedExpiresAt);
    if (!Number.isNaN(expTime) && Date.now() + 30000 >= expTime) {
      return true;
    }
  }

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (payload.exp && Date.now() + 30000 >= payload.exp * 1000) {
        return true;
      }
    }
  } catch (_) {
    // Non-JWT or opaque token; defer verification to backend
  }

  return false;
}
```

### 1. Plain-English Purpose
Checks whether a security token has expired *before* making a network request. It inspects the expiration date in browser memory, adding a **30-second buffer** so that a token about to expire in 5 seconds is treated as already expired, preventing requests from failing mid-flight.

### 2. Line-by-Line Breakdown
- **Line 20 (`export function isTokenExpired(token, storedExpiresAt = null)`)**: Accepts the token string and an optional cached timestamp.
- **Line 21 (`if (!token) return true;`)**: If token is empty or null, it is immediately considered expired.
- **Lines 23–28 (Cached Timestamp Check)**:
  - If `storedExpiresAt` was provided, parses it with `Date.parse(...)`.
  - `Date.now() + 30000 >= expTime`: Adds 30,000 milliseconds (30 seconds) to the current time. If this exceeds the expiration time, returns `true`.
- **Lines 30–38 (Raw JWT Payload Inspection)**:
  - In a JWT (`header.payload.signature`), the payload is the middle part (`parts[1]`).
  - `.replace(/-/g, '+').replace(/_/g, '/')`: Converts URL-safe Base64 to standard Base64.
  - `atob(base64)`: Built-in browser function that decodes Base64 into an ASCII JSON string.
  - `payload.exp * 1000`: JWT `exp` is in epoch seconds; multiplying by 1000 converts it to JavaScript milliseconds.
  - If current time $+ 30\text{s} \ge \text{exp}$, returns `true`.
- **Lines 39–41**: If decoding fails (opaque token), gracefully returns `false` and defers verification to the backend.

### 3. Deep Term & Concept Expansion
- **Clock Skew**: The client laptop clock and the backend server clock are rarely in perfect synchronization (they may differ by 2 to 5 seconds). Adding a 30-second buffer ensures that frontend components never send a token that the server considers expired.

---

## Block 3: Dynamic Base URL Resolver: `resolveApiBaseUrl` (Lines 46–76)

```javascript
export function resolveApiBaseUrl() {
  const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!rawEnvUrl) {
    return '/api/v1';
  }

  // Normalize localhost to 127.0.0.1 on Windows to bypass IPv6 DNS stall
  let normalized = rawEnvUrl;
  if (normalized.includes('localhost:8000')) {
    normalized = normalized.replace('localhost:8000', '127.0.0.1:8000');
  }

  // Prevent mixed-content / localhost Network Error when deployed on Vercel or production HTTPS
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    (normalized.includes('localhost') || normalized.includes('127.0.0.1'))
  ) {
    return '/api/v1';
  }

  const trimmed = normalized.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  if (trimmed.endsWith('/api')) {
    return `${trimmed}/v1`;
  }
  return `${trimmed}/api/v1`;
}
```

### 1. Plain-English Purpose
Dynamically determines the correct root web address for backend API calls. It reads the `.env` configuration, normalizes `localhost` to `127.0.0.1` to bypass Windows IPv6 resolution stalls, prevents dangerous Mixed Content security errors in production, and guarantees the `/api/v1` prefix is always present.

### 2. Line-by-Line Breakdown
- **Line 47 (`const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();`)**: Reads Vite environment variable.
- **Lines 48–50**: If empty, defaults to the relative path `'/api/v1'` (letting Vite or Nginx proxy the requests).
- **Lines 53–56 (Windows IPv6 Bypass)**:
  - On Windows 10/11, `localhost` resolves to IPv6 `::1` first. If the Python backend binds to IPv4 (`0.0.0.0` or `127.0.0.1`), the browser hangs for 2,000 milliseconds before falling back. Replacing `localhost:8000` with `127.0.0.1:8000` bypasses this DNS stall completely.
- **Lines 59–66 (Production Mixed Content Guard)**:
  - If the web app is running in production (e.g. `https://smart-complaint.vercel.app`), but `.env` accidentally still contained `http://localhost:8000`, browsers will block all requests with a fatal `Mixed Content` security error. This check detects that condition and safely switches to relative `/api/v1`.
- **Lines 68–75 (Path Suffix Guarantee)**:
  - Strips trailing slashes and ensures the URL ends exactly with `/api/v1`.

---

## Block 4: Axios Instance & Request Interceptor (Lines 78–100)

```javascript
const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage or sessionStorage & strip trailing slashes to avoid Vercel rewrite misses
apiClient.interceptors.request.use((config) => {
  if (config.url && typeof config.url === 'string' && config.url.length > 1 && config.url.endsWith('/')) {
    config.url = config.url.replace(/\/+$/, '');
  }
  try {
    const token =
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});
```

### 1. Plain-English Purpose
Creates the shared Axios instance with a 25-second network timeout. It registers an **outbound request interceptor** that cleans trailing slashes from URLs and automatically reads the JWT token from browser storage and attaches it to the HTTP `Authorization` header.

### 2. Line-by-Line Breakdown
- **Lines 78–84 (`const apiClient = axios.create(...)`)**:
  - `baseURL`: Prepend `resolveApiBaseUrl()` to every request.
  - `timeout: 25000`: Aborts requests taking longer than 25 seconds.
  - `Content-Type: application/json`: Default payload format.
- **Lines 87–100 (`apiClient.interceptors.request.use(...)`)**:
  - **Trailing Slash Stripping (Lines 88–90)**: Some serverless hosts (like Vercel) interpret `/tickets/` and `/tickets` differently, leading to 404 rewrite errors. Stripping trailing slashes ensures uniform routing.
  - **Bearer Token Attachment (Lines 91–97)**: Reads `AUTH_TOKEN_KEY`. If present, sets `config.headers.Authorization = Bearer <token>`. Developers never have to manually attach tokens in individual components.

---

## Block 5: Response Interceptor & Concurrency-Locked Token Rotation (Lines 102–214)

```javascript
let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error, newToken = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  pendingQueue = [];
}

// Automatically refresh expired access tokens on 401 or broadcast session expiration
apiClient.interceptors.response.use(
  (response) => {
    // If a reverse proxy or SPA router accidentally returns index.html for an API endpoint, reject it as an error
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!DOCTYPE') || response.data.trim().startsWith('<html')) &&
      (response.config?.url?.includes('/auth/') || response.config?.url?.includes('/tickets/'))
    ) {
      const err = new Error('API server returned HTML instead of JSON.');
      err.response = { status: 502, data: { detail: 'API server unreachable or returned HTML.' } };
      return Promise.reject(err);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';

    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/google') ||
      requestUrl.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken =
        localStorage.getItem(REFRESH_TOKEN_KEY) ||
        sessionStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken && !isTokenExpired(refreshToken)) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const isPersistent = Boolean(localStorage.getItem(REFRESH_TOKEN_KEY));
          const refreshRes = await axios.post(
            `${resolveApiBaseUrl()}/auth/refresh`,
            {
              refresh_token: refreshToken,
              remember_me: isPersistent,
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
          );

          const { access_token, refresh_token: nextRefresh, expires_at } = refreshRes.data;
          const storage = isPersistent ? localStorage : sessionStorage;
          storage.setItem(AUTH_TOKEN_KEY, access_token);
          if (nextRefresh) {
            storage.setItem(REFRESH_TOKEN_KEY, nextRefresh);
          }
          if (expires_at) {
            storage.setItem(AUTH_EXPIRES_AT_KEY, expires_at);
          }

          resolvePendingQueue(null, access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          resolvePendingQueue(refreshError, null);
        } finally {
          isRefreshing = false;
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      }
    }

    if (status === 403 && !isAuthEndpoint) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(AUTH_FORBIDDEN_EVENT, {
            detail: {
              url: requestUrl,
              status: 403,
              message: error.response?.data?.detail || 'Forbidden',
            },
          })
        );
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 1. Plain-English Purpose
The inbound response handler. It inspects server replies:
1. If the server accidentally returns HTML (`<!DOCTYPE html>`) instead of JSON (due to a dead server or bad proxy), converts it to a clean 502 error.
2. If an API returns `HTTP 401 Unauthorized` (access token expired), it automatically pauses incoming requests, fires a background token refresh to `/auth/refresh`, updates browser storage, and replays all failed requests with the new access token.
3. If refresh fails, broadcasts `AUTH_EXPIRED_EVENT` so the UI cleanly logs out.

### 2. Line-by-Line Breakdown
- **Lines 102–114 (`isRefreshing`, `pendingQueue`, `resolvePendingQueue`)**:
  - Mutual exclusion (mutex) queue. If 4 dashboard widgets simultaneously receive 401 errors, `isRefreshing` ensures only the first one calls the refresh endpoint. The other 3 push promises into `pendingQueue` and wait.
- **Lines 120–128 (HTML Leak Protection)**:
  - If an API returns HTML instead of JSON, rejects with HTTP 502 Bad Gateway.
- **Lines 136–140 (`isAuthEndpoint`)**:
  - Prevents infinite loops: if a login or refresh request itself receives a 401, it must **not** attempt another refresh!
- **Lines 142–189 (Token Refresh Logic)**:
  - Reads `REFRESH_TOKEN_KEY`.
  - Makes a standalone `axios.post` call to `${resolveApiBaseUrl()}/auth/refresh`.
  - Saves the new access token and optional rotated refresh token.
  - Calls `resolvePendingQueue(null, access_token)`, waking up all waiting requests.
  - Updates `originalRequest.headers.Authorization = Bearer <new_token>` and re-executes the original request.
- **Lines 191–194**: If refresh fails, dispatches `AUTH_EXPIRED_EVENT`.
- **Lines 196–208**: If HTTP 403 Forbidden is received, dispatches `AUTH_FORBIDDEN_EVENT`.
- **Line 214 (`export default apiClient;`)**: Exports the configured Axios instance.

### 3. Deep Term & Concept Expansion
- **Why a Mutex Queue for Token Refresh?**:
  - In a dashboard with 5 charts making simultaneous requests when an access token expires:
  - Without a queue, 5 simultaneous refresh requests would fire. Because our backend uses **Refresh Token Rotation** (the old refresh token is invalidated the moment a new one is issued), request #1 would succeed, and requests #2, #3, #4, and #5 would present an already-invalidated refresh token, immediately locking the user out!
  - The queue guarantees exactly **one** refresh request executes, and all 5 requests share the resulting new access token.

---

## 6. Viva & Technical Defense Guide

> [!TIP]
> **Q1: Why do we normalize `localhost:8000` to `127.0.0.1:8000` on Windows systems?**  
> **Answer**: On modern Windows systems, resolving `localhost` prioritizes IPv6 (`::1`). If the Python backend binds to IPv4 (`127.0.0.1`), the browser attempts an IPv6 connection, times out after 2,000 milliseconds, and only then falls back to IPv4. Replacing `localhost` with explicit `127.0.0.1` eliminates this 2-second DNS stall, resulting in instantaneous local API requests.

> [!TIP]
> **Q2: What is the "Thundering Herd" problem in token refreshing, and how does `client.js` solve it?**  
> **Answer**: When a dashboard loads, 5 or 6 components make simultaneous API calls. If the access token has expired, all 6 requests return `HTTP 401` simultaneously. Without protection, the frontend would fire 6 separate refresh requests. With refresh token rotation, the first call invalidates the refresh token, causing the other 5 to fail and kicking the user out to login. `client.js` solves this with a concurrency lock (`isRefreshing`) and a `pendingQueue`: only the first request calls the refresh endpoint, while the remaining 5 pause and seamlessly resume once the new token arrives.

> [!TIP]
> **Q3: What does the request interceptor do on every outgoing API request?**  
> **Answer**: It performs two vital tasks:
> 1. It strips any accidental trailing slashes from the URL (e.g. `/tickets/` becomes `/tickets`) to prevent routing errors on cloud reverse proxies.
> 2. It checks `localStorage` and `sessionStorage` for the stored JWT token and automatically attaches `Authorization: Bearer <token>` to the HTTP headers, ensuring that individual React components never have to manually handle authentication headers.

> [!TIP]
> **Q4: How does `client.js` inform React components when a session permanently expires?**  
> **Answer**: Rather than tightly coupling the networking file to React state or components, `client.js` uses decoupled browser events: `window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))`. The central `AuthContext.jsx` listens for this event. When fired, `AuthContext` clears local storage, resets user state to `null`, and navigates the user to the login screen.

---

## 7. Quick-Reference Viva Summary Table

| Concept / Keyword | Meaning in Basic C / Python | Role in `client.js` |
| :--- | :--- | :--- |
| `apiClient` | Singleton HTTP client | Pre-configured Axios instance used for all backend network calls. |
| `isTokenExpired(...)` | Bit-unpacking / clock checker | Decodes JWT Base64 payload in RAM with 30s clock-skew buffer. |
| `resolveApiBaseUrl()` | Dynamic address resolver | Normalizes development IPv6 stalls and guarantees `/api/v1` prefix. |
| Request Interceptor | Pre-send hook / filter | Automatically attaches `Authorization: Bearer <token>` to every request. |
| Response Interceptor | Post-receive hook / filter | Catches HTTP 401 errors and orchestrates automatic token refreshing. |
| `isRefreshing` | Boolean mutex / semaphore | Guarantees only one token refresh request fires at a time. |
| `pendingQueue` | Array of pending callbacks | Holds concurrent requests in RAM while the access token refreshes. |
| `AUTH_EXPIRED_EVENT` | Global event broadcast | Signals `AuthContext` to log out when refresh token is invalid. |
| `AUTH_FORBIDDEN_EVENT` | Security alert broadcast | Emitted on HTTP 403 Forbidden responses. |
