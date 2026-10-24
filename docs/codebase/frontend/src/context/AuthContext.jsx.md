# Frontend Source Documentation: `frontend/src/context/AuthContext.jsx`

> **File Path**: `frontend/src/context/AuthContext.jsx`  
> **Role**: Centralized Global State & Lifecycle Management for Authentication, Multi-Tab Session Synchronization, and Role-Based Authorization.  
> **Target Audience**: College Viva Examiners, Evaluation Committees, Security Auditors, Students grounded in basic C/Python.

---

## 1. High-Level Architectural Purpose

In traditional multi-page web applications or command-line C programs, authentication credentials or session tokens are checked on every individual page load or command execution. In a React Single Page Application (SPA), however, the browser stays on a single HTML document (`index.html`) while dynamic JavaScript components mount and unmount. 

Without a global state container, every single component that needs to know who is logged in (such as the navigation bar, protected route guards, complaint submission forms, and technician consoles) would have to independently read tokens from storage, decode user objects, or fire duplicate network requests to the backend `/users/me` endpoint.

`AuthContext.jsx` creates an application-wide **Authentication Context**. It acts as the single source of truth for:
1. **User Identity & Permissions**: Holding the currently logged-in user profile, role flags (`isStudent`, `isAdmin`, `isSuperAdmin`, `isTechnician`), avatar emojis, and UI badges.
2. **Session Persistence**: Managing token storage across `localStorage` (for *"Remember Me"*) and `sessionStorage` (for single-browser-session security).
3. **Cross-Tab Real-Time Synchronization**: Utilizing modern Web APIs (`BroadcastChannel`, `window.onstorage`, `visibilitychange`) so that logging out or updating a profile in Tab A instantaneously syncs with Tab B without requiring manual browser refreshes.
4. **Proactive & Reactive Token Refreshing**: Bootstrapping existing sessions on page reload and gracefully clearing sessions upon token expiration (`401 Unauthorized`) or permission revocation (`403 Forbidden`).

---

## 2. Sequential Code Breakdown & Deep Analysis

```javascript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchMe,
  loginUser,
  loginWithGoogle,
  logoutUser,
  refreshSession,
  registerUser,
  updateUserProfile,
  changePassword,
} from '../api/auth';
import {
  AUTH_EXPIRED_EVENT,
  AUTH_FORBIDDEN_EVENT,
  AUTH_EXPIRES_AT_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
  isTokenExpired,
} from '../api/client';

const AUTH_CHANNEL_NAME = 'smart_complaint_auth_sync';
```

### Plain-English Purpose
This initial block imports essential React hooks, API communication functions from `api/auth.js`, and authentication constants and utilities from `api/client.js`. It also defines a static string constant `AUTH_CHANNEL_NAME`, which serves as a radio communication channel name allowing different browser tabs to talk to each other.

### Line-by-Line Breakdown
- `import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'`:
  - `createContext`: Factory function to create a React context object (a global data channel).
  - `useContext`: Hook that allows child components to consume context values.
  - `useEffect`: Hook that runs side effects (e.g., setting up event listeners, bootstrapping network calls) after rendering.
  - `useState`: Hook that declares reactive state variables that trigger UI re-renders when updated.
  - `useCallback`: Hook that caches a function definition between re-renders to prevent unnecessary child re-renders.
- `import { fetchMe, ... } from '../api/auth'`: Imports the HTTP helper functions responsible for communicating with backend authentication endpoints.
- `import { AUTH_EXPIRED_EVENT, ... } from '../api/client'`: Imports standardized storage keys and custom window event names emitted by the Axios/Fetch HTTP interceptors.
- `const AUTH_CHANNEL_NAME = 'smart_complaint_auth_sync'`: A shared namespace used by the browser's `BroadcastChannel` API.

### Deep Term & Concept Expansion
- **React Context vs Prop Drilling**: If Component A renders Component B, and B renders C, passing user data from A to C through B (when B doesn't care about the data) is called *prop drilling*. Context eliminates this by allowing Component C to read directly from a shared global context provider.
- **`BroadcastChannel` API**: A browser API that allows different browsing contexts (tabs, windows, iframes) on the same origin (protocol, domain, port) to send broadcast messages to each other like a local walkie-talkie.

### Runtime Mechanics & Security
- **Memory Footprint**: `AUTH_CHANNEL_NAME` is an immutable string primitive stored in the JavaScript engine's string intern table.
- **Origin Isolation**: `BroadcastChannel` messages cannot be intercepted by third-party websites because the browser strictly enforces Same-Origin Policy (SOP).

---

```javascript
function broadcastAuthMessage(message) {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.postMessage(message);
      channel.close();
    } catch (_) {}
  }
}
```

### Plain-English Purpose
Whenever an authentication event occurs (such as logging in, logging out, or editing a profile), this function broadcasts the event to all other open tabs running the application. It acts as an ephemeral transmitter: it opens a temporary channel, posts the serialized message, and immediately closes the channel to avoid memory leaks.

### Line-by-Line Breakdown
- `function broadcastAuthMessage(message)`: Defines the broadcast helper function taking a serializable JavaScript `message` object.
- `if (typeof window !== 'undefined' && 'BroadcastChannel' in window)`:
  - `typeof window !== 'undefined'`: Ensures this code is running in a browser environment rather than a server-side Node.js rendering context where `window` does not exist.
  - `'BroadcastChannel' in window`: Checks if the user's browser supports the `BroadcastChannel` API (feature detection).
- `const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);`: Connects to the broadcast bus.
- `channel.postMessage(message);`: Sends the message object to all listening tabs.
- `channel.close();`: Closes the transmission port to free operating system IPC resources.
- `try { ... } catch (_) {}`: Silently catches and suppresses any browser sandboxing exceptions.

### Deep Term & Concept Expansion
- **Ephemeral Channel vs Long-Lived Listener**: Senders do not need to keep channel handles permanently open in memory. Creating, posting, and closing an ephemeral channel avoids socket descriptor exhaustion in the browser engine.

---

```javascript
function enrichUser(userData) {
  if (!userData) return null;
  const role = userData.role || 'STUDENT';
  let avatar = '🎓';
  let roleLabel = 'Student';
  let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
  let targetRoute = '/student';

  if (role === 'SUPER_ADMIN') {
    avatar = '👑';
    roleLabel = 'Super Admin';
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
    targetRoute = '/superadmin';
  } else if (role === 'ADMIN') {
    avatar = '🛡️';
    roleLabel = 'Facility Admin';
    badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
    targetRoute = '/operations';
  } else if (role === 'TECHNICIAN') {
    avatar = '🔧';
    roleLabel = 'Field Technician';
    badgeClass = 'bg-[#8C906D]/20 text-[#3C4233] border-[#8C906D]/40';
    targetRoute = '/technician';
  }
```

### Plain-English Purpose
When the backend returns a raw user record from the database, it contains primitive fields like `{ id: 1, email: "student@iiitnr.edu.in", role: "STUDENT" }`. The frontend UI, however, requires visual metadata: role avatars, human-readable labels, Tailwind CSS color classes, and the correct landing page URL.
`enrichUser` acts as an object transformer (in C terms, initializing derived struct fields) that inspects the user's role and attaches corresponding UI presentation properties.

### Line-by-Line Breakdown
- `if (!userData) return null;`: Returns `null` if given an empty or null input.
- `const role = userData.role || 'STUDENT';`: Defaults unassigned roles to `'STUDENT'`.
- `let avatar = '🎓'; let roleLabel = 'Student'; ...`: Sets default presentation values for students.
- `if (role === 'SUPER_ADMIN') { ... }`: If the role is super admin, assigns the crown emoji, gold badge styling, and default route `/superadmin`.
- `else if (role === 'ADMIN') { ... }`: Assigns shield emoji, purple styling, and route `/operations`.
- `else if (role === 'TECHNICIAN') { ... }`: Assigns wrench emoji, sage styling, and route `/technician`.

---

```javascript
  const resolvedDept =
    userData.department ||
    userData.department_name ||
    'Computer Science & Engineering';

  // Merge locally cached hostel/room fallback if backend record does not yet have one
  const cleanEmail = (userData.email || '').trim().toLowerCase();
  let cachedResidence = null;
  if (cleanEmail && typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`iiitnr_residence_${cleanEmail}`);
      if (raw) cachedResidence = JSON.parse(raw);
    } catch (_) {
      // Ignore storage parse error
    }
  }

  const hostelName = userData.hostel_name || cachedResidence?.hostel_name || null;
  const roomNumber = userData.room_number || cachedResidence?.room_number || null;
  const authProvider = userData.auth_provider || 'password';
  const hasPassword = userData.has_password !== undefined ? Boolean(userData.has_password) : (authProvider !== 'google');

  return {
    ...userData,
    auth_provider: authProvider,
    has_password: hasPassword,
    department: resolvedDept,
    department_name: resolvedDept,
    hostel_name: hostelName,
    room_number: roomNumber,
    identifier: userData.identifier || `ID: ${(userData.email || '').split('@')[0].toUpperCase()}`,
    avatar,
    roleLabel,
    badgeClass,
    targetRoute,
  };
}
```

### Plain-English Purpose
This second half of `enrichUser` normalizes department names, retrieves cached campus residence data (hostel name and room number), detects whether the user signed in via Google OAuth or traditional password, generates a student ID code from the email username, and returns the combined enriched user object.

### Line-by-Line Breakdown
- `const resolvedDept = ...`: Resolves department name across legacy and current schema property names, falling back to a sensible default.
- `const cleanEmail = (userData.email || '').trim().toLowerCase();`: Sanitizes email to use as a storage cache key.
- `const raw = localStorage.getItem(`iiitnr_residence_${cleanEmail}`);`: Reads hostel/room preferences saved on this device.
- `const hostelName = ...`: Prefers the backend database record; falls back to the client cache if the backend field is null.
- `const hasPassword = ...`: Determines whether the user has a local password set (crucial for prompting Google OAuth users to establish a local backup password).
- `identifier: userData.identifier || ...`: Extracts the username portion of an email (e.g. `CS21B1001` from `cs21b1001@iiitnr.edu.in`) and turns it into an ID badge string.
- `return { ...userData, ... }`: Object spread operator returning a new immutable object containing all original backend fields augmented with enriched attributes.

---

```javascript
function clearAuthStorage() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    localStorage.removeItem('smart_complaint_remember_email');
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_EXPIRES_AT_KEY);
  } catch (_) {}
}

function persistAuthSession(authData, enrichedUser, rememberMe) {
  try {
    const primaryStorage = rememberMe ? localStorage : sessionStorage;
    const secondaryStorage = rememberMe ? sessionStorage : localStorage;

    primaryStorage.setItem(AUTH_TOKEN_KEY, authData.access_token);
    primaryStorage.setItem(AUTH_USER_KEY, JSON.stringify(enrichedUser));
    if (authData.refresh_token) {
      primaryStorage.setItem(REFRESH_TOKEN_KEY, authData.refresh_token);
    }
    if (authData.expires_at) {
      primaryStorage.setItem(AUTH_EXPIRES_AT_KEY, authData.expires_at);
    }

    secondaryStorage.removeItem(AUTH_TOKEN_KEY);
    secondaryStorage.removeItem(REFRESH_TOKEN_KEY);
    secondaryStorage.removeItem(AUTH_USER_KEY);
    secondaryStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    localStorage.removeItem('smart_complaint_remember_email');
  } catch (_) {}
}
```

### Plain-English Purpose
These two utility functions manage physical browser storage:
- `clearAuthStorage`: Wipes all tokens, expiration dates, and cached user objects from both `localStorage` and `sessionStorage`. This guarantees complete cleanup on logout or session invalidation.
- `persistAuthSession`: Implements the *"Remember Me"* toggle logic. If `rememberMe` is true, session tokens are written to `localStorage` (persisting even after the user closes the browser). If false, tokens are stored in `sessionStorage` (automatically deleted when the browser window closes). It also cleans the opposite storage to prevent stale token conflicts.

### Line-by-Line Breakdown
- `clearAuthStorage()`: Invokes `.removeItem()` across all 4 core token keys for both storage engines.
- `primaryStorage = rememberMe ? localStorage : sessionStorage`: Ternary operator designating the target storage device.
- `secondaryStorage = rememberMe ? sessionStorage : localStorage`: The inverse storage device.
- `primaryStorage.setItem(AUTH_TOKEN_KEY, authData.access_token)`: Writes the JWT bearer token into storage.
- `primaryStorage.setItem(AUTH_USER_KEY, JSON.stringify(enrichedUser))`: Serializes the enriched user JavaScript object to a JSON string.
- `secondaryStorage.removeItem(...)`: Cleans up the inactive storage location to ensure no ghost credentials remain.

### Deep Term & Concept Expansion
- **`localStorage` vs `sessionStorage`**:
  - `localStorage`: Non-volatile key-value storage. Data survives browser restarts, system reboots, and persists until explicitly cleared.
  - `sessionStorage`: Volatile session storage. Data is scoped strictly to the lifetime of the specific browser tab. Closing the tab immediately destroys the stored tokens.

---

```javascript
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const persistedUser = localStorage.getItem(AUTH_USER_KEY);
      const persistedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const persistedExpires = localStorage.getItem(AUTH_EXPIRES_AT_KEY);
      const persistedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (persistedUser && persistedToken) {
        if (!isTokenExpired(persistedToken, persistedExpires) || (persistedRefresh && !isTokenExpired(persistedRefresh))) {
          return enrichUser(JSON.parse(persistedUser));
        }
        clearAuthStorage();
        return null;
      }

      const sessionedUser = sessionStorage.getItem(AUTH_USER_KEY);
      const sessionedToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
      const sessionedExpires = sessionStorage.getItem(AUTH_EXPIRES_AT_KEY);
      const sessionedRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY);

      if (sessionedUser && sessionedToken) {
        if (!isTokenExpired(sessionedToken, sessionedExpires) || (sessionedRefresh && !isTokenExpired(sessionedRefresh))) {
          return enrichUser(JSON.parse(sessionedUser));
        }
        clearAuthStorage();
        return null;
      }
    } catch (e) {
      console.warn('Failed to parse cached auth user:', e);
    }
    return null;
  });

  const [authInitializing, setAuthInitializing] = useState(true);
  const [rememberedEmail, setRememberedEmail] = useState('');
```

### Plain-English Purpose
Here we instantiate `AuthContext` and create the `AuthProvider` component. Notice the **lazy initialization** in `useState(() => { ... })`: instead of starting with `null` and waiting for an asynchronous network call, the component synchronously inspects storage during the very first render cycle. If a valid, non-expired token exists, it parses and enriches the user immediately, eliminating the brief "flash of unauthenticated content" (FOUC).

### Line-by-Line Breakdown
- `const AuthContext = createContext(null)`: Creates the React context with default value `null`.
- `export function AuthProvider({ children })`: Context provider component wrapping child UI components.
- `useState(() => { ... })`: Lazy initial state function executed only once when the component is created.
- `if (!isTokenExpired(...) || !isTokenExpired(refreshToken))`: Verifies the access token or refresh token is still valid. If both are expired, clears storage and returns `null`.
- `const [authInitializing, setAuthInitializing] = useState(true)`: Tracks whether the background verification/bootstrapping network call is still in progress.
- `const [rememberedEmail, setRememberedEmail] = useState('')`: Stores the prefilled login email if Remember Me was selected.

---

```javascript
  const logout = useCallback(() => {
    setCurrentUser(null);
    clearAuthStorage();
    broadcastAuthMessage({ type: 'AUTH_LOGOUT' });
    if (typeof window !== 'undefined' && window.google?.accounts?.id?.disableAutoSelect) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (_) {
        // Ignore if Google SDK not loaded
      }
    }
    logoutUser().catch(() => {});
  }, []);
```

### Plain-English Purpose
The centralized `logout` action. It resets in-memory user state to `null`, wipes browser storage, broadcasts a logout event to all other open tabs, disables Google One-Tap automatic login selection (preventing the browser from instantly re-logging the user back in), and notifies the backend server to revoke the refresh token. Wrapped in `useCallback` to ensure referential stability.

### Line-by-Line Breakdown
- `useCallback(() => { ... }, [])`: Memoizes the function so it does not recreate a new function reference on every re-render.
- `setCurrentUser(null)`: Instantly updates state, triggering a re-render that sends unauthenticated users to the login screen.
- `clearAuthStorage()`: Removes tokens from physical disk storage.
- `broadcastAuthMessage({ type: 'AUTH_LOGOUT' })`: Dispatches event to other tabs.
- `window.google?.accounts?.id?.disableAutoSelect()`: Instructs Google Identity Services SDK to stop auto-selecting the account.
- `logoutUser().catch(() => {})`: Fires backend revocation request; uses empty catch handler so network failures cannot block local logout.

---

```javascript
  // Verify or refresh existing JWT token against backend on application startup
  useEffect(() => {
    const isPersistent = Boolean(localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY));
    const storage = isPersistent ? localStorage : sessionStorage;
    const token = storage.getItem(AUTH_TOKEN_KEY);
    const expiresAt = storage.getItem(AUTH_EXPIRES_AT_KEY);
    const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);

    if (!token && !refreshToken) {
      setAuthInitializing(false);
      return;
    }

    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        if (isTokenExpired(token, expiresAt)) {
          if (refreshToken && !isTokenExpired(refreshToken)) {
            const refreshedData = await refreshSession(refreshToken, isPersistent);
            if (!isMounted) return;
            const enriched = enrichUser(refreshedData.user);
            setCurrentUser(enriched);
            persistAuthSession(refreshedData, enriched, isPersistent);
            return;
          }
          throw new Error('Session expired');
        }

        const freshProfile = await fetchMe();
        if (!isMounted || !freshProfile) return;
        const enriched = enrichUser(freshProfile);
        setCurrentUser(enriched);
        storage.setItem(AUTH_USER_KEY, JSON.stringify(enriched));
      } catch (err) {
        if (!isMounted) return;
        if (err.message === 'Session expired' || err.response?.status === 401 || err.response?.status === 403) {
          setCurrentUser(null);
          clearAuthStorage();
        }
      } finally {
        if (isMounted) {
          setAuthInitializing(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);
```

### Plain-English Purpose
This startup `useEffect` runs once when the app loads. While `useState` provided initial local data, this effect contacts the server to ensure the account hasn't been suspended, roles haven't changed in the database, and the access token is valid. If the access token expired while the user was away, it seamlessly exchanges the refresh token for a brand-new access token without interrupting the user.

### Line-by-Line Breakdown
- `let isMounted = true`: Cancellation token pattern. Prevents React state updates if the user navigates away or closes the tab before network responses resolve.
- `if (isTokenExpired(token, expiresAt))`: Checks timestamp expiration.
- `const refreshedData = await refreshSession(refreshToken, isPersistent)`: Performs silent token rotation via backend refresh endpoint.
- `const freshProfile = await fetchMe()`: Fetches the latest database record (`/users/me`) to ensure role changes or suspensions are applied.
- `return () => { isMounted = false; }`: Cleanup function setting `isMounted = false`.

---

```javascript
  // Listen for global 401 session expiration events from apiClient
  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      clearAuthStorage();
      broadcastAuthMessage({ type: 'AUTH_LOGOUT' });
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  // 1. Cross-tab BroadcastChannel real-time synchronization
  useEffect(() => {
    let channel = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
        channel.onmessage = (event) => {
          const { type, user } = event.data || {};
          if (type === 'AUTH_LOGOUT') {
            setCurrentUser(null);
            clearAuthStorage();
          } else if (type === 'AUTH_LOGIN' || type === 'AUTH_USER_UPDATED') {
            if (user) {
              const enriched = enrichUser(user);
              setCurrentUser(enriched);
            }
          }
        };
      } catch (_) {}
    }
    return () => {
      if (channel) {
        try {
          channel.close();
        } catch (_) {}
      }
    };
  }, []);
```

### Plain-English Purpose
These two effects listen for external authentication signals:
1. **HTTP 401 Interceptor Listener**: If any API call fails with a 401 Unauthorized error that could not be refreshed, `apiClient` dispatches a custom `AUTH_EXPIRED_EVENT`. This listener catches it, clears state, and notifies all tabs.
2. **Cross-Tab Synchronization Listener**: Subscribes to the `smart_complaint_auth_sync` channel. If another tab logs in, logs out, or modifies user details, this tab immediately updates its state to match.

### Line-by-Line Breakdown
- `window.addEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired)`: Subscribes to the custom DOM event.
- `window.removeEventListener(...)`: Unsubscribes on unmount to prevent dangling memory handlers.
- `channel.onmessage = (event) => { ... }`: Message handler triggered whenever another tab executes `channel.postMessage()`.

---

```javascript
  // 2. Native window storage event listener (cross-tab localStorage change fallback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (
        e.key === AUTH_TOKEN_KEY ||
        e.key === AUTH_USER_KEY ||
        e.key === REFRESH_TOKEN_KEY ||
        e.key === null
      ) {
        const rawToken =
          localStorage.getItem(AUTH_TOKEN_KEY) ||
          sessionStorage.getItem(AUTH_TOKEN_KEY);
        const rawUser =
          localStorage.getItem(AUTH_USER_KEY) ||
          sessionStorage.getItem(AUTH_USER_KEY);

        if (!rawToken || !rawUser) {
          setCurrentUser(null);
          clearAuthStorage();
        } else {
          try {
            const parsed = enrichUser(JSON.parse(rawUser));
            setCurrentUser(parsed);
          } catch (_) {
            setCurrentUser(null);
            clearAuthStorage();
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 3. Tab visibility & focus change synchronization latch
  useEffect(() => {
    const syncSessionWithStorage = () => {
      let rawToken = null;
      let rawUser = null;
      try {
        rawToken =
          localStorage.getItem(AUTH_TOKEN_KEY) ||
          sessionStorage.getItem(AUTH_TOKEN_KEY);
        rawUser =
          localStorage.getItem(AUTH_USER_KEY) ||
          sessionStorage.getItem(AUTH_USER_KEY);
      } catch (_) {
        return;
      }

      if (!rawToken || !rawUser) {
        return;
      }

      try {
        const parsed = JSON.parse(rawUser);
        const cleanCurrentEmail = (currentUser?.email || '').trim().toLowerCase();
        const cleanStoredEmail = (parsed?.email || '').trim().toLowerCase();
        const currentRole = currentUser?.role || '';
        const storedRole = parsed?.role || '';

        if (cleanCurrentEmail !== cleanStoredEmail || currentRole !== storedRole) {
          setCurrentUser(enrichUser(parsed));
        }
      } catch (_) {}
    };

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncSessionWithStorage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [currentUser]);
```

### Plain-English Purpose
These two effects provide resilient session synchronization fallback mechanisms:
- **`window.onstorage` Listener**: In older browsers or incognito environments where `BroadcastChannel` may be restricted, the native browser `storage` event fires whenever `localStorage` is altered in another window.
- **Visibility & Focus Synchronization Latch**: When a user switches back to an inactive tab after 2 hours, `visibilitychange` fires. It compares the in-memory user with storage; if the user logged in as an Admin in another tab, this tab immediately adapts without requiring a full page reload.

---

```javascript
  // 4. Global 403 Forbidden interceptor listener
  useEffect(() => {
    const handleForbidden = () => {
      const rawUser =
        localStorage.getItem(AUTH_USER_KEY) ||
        sessionStorage.getItem(AUTH_USER_KEY);
      if (rawUser) {
        try {
          const parsed = enrichUser(JSON.parse(rawUser));
          if (
            parsed &&
            (parsed.email !== currentUser?.email || parsed.role !== currentUser?.role)
          ) {
            setCurrentUser(parsed);
            return;
          }
        } catch (_) {}
      }
      fetchMe()
        .then((fresh) => {
          if (fresh) {
            const enriched = enrichUser(fresh);
            if (enriched.role !== currentUser?.role) {
              setCurrentUser(enriched);
            }
          }
        })
        .catch((err) => {
          if (err.response?.status === 401 || err.response?.status === 403) {
            setCurrentUser(null);
            clearAuthStorage();
          }
        });
    };

    window.addEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
    return () => {
      window.removeEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
    };
  }, [currentUser]);
```

### Plain-English Purpose
When a user attempts an unauthorized action (e.g., a student attempts to view an admin dashboard URL), the backend responds with HTTP 403 Forbidden. This listener intercepts the event to verify if the user's role was changed or revoked, re-fetching their latest permissions from `/users/me` and synchronizing the UI accordingly.

---

```javascript
  const login = async (email, password, rememberMe = false) => {
    const data = await loginUser(email, password, rememberMe);
    const enriched = enrichUser(data.user);
    setCurrentUser(enriched);
    persistAuthSession(data, enriched, rememberMe);
    if (rememberMe) {
      setRememberedEmail(enriched.email);
    }
    broadcastAuthMessage({ type: 'AUTH_LOGIN', user: enriched });
    return enriched;
  };

  const register = async (registrationData) => {
    const cleanEmail = (registrationData.email || '').trim().toLowerCase();
    if (cleanEmail && (registrationData.hostel_name || registrationData.room_number)) {
      localStorage.setItem(
        `iiitnr_residence_${cleanEmail}`,
        JSON.stringify({
          hostel_name: registrationData.hostel_name || null,
          room_number: registrationData.room_number || null,
        })
      );
    }
    const data = await registerUser(registrationData);
    const enriched = enrichUser({
      ...data.user,
      hostel_name: data.user?.hostel_name || registrationData.hostel_name || null,
      room_number: data.user?.room_number || registrationData.room_number || null,
    });
    const rememberMe = Boolean(registrationData.remember_me);
    setCurrentUser(enriched);
    persistAuthSession(data, enriched, rememberMe);
    if (rememberMe) {
      setRememberedEmail(enriched.email);
    }
    broadcastAuthMessage({ type: 'AUTH_LOGIN', user: enriched });
    return enriched;
  };

  const loginGoogle = async (googleData) => {
    const data = await loginWithGoogle(googleData);
    const enriched = enrichUser(data.user);
    const rememberMe = googleData.remember_me !== false;
    setCurrentUser(enriched);
    persistAuthSession(data, enriched, rememberMe);
    setRememberedEmail(enriched.email);
    broadcastAuthMessage({ type: 'AUTH_LOGIN', user: enriched });
    return enriched;
  };
```

### Plain-English Purpose
These three functions handle the primary authentication entry points: standard email/password login, student/technician account registration, and Google OAuth single sign-on (SSO). Each function invokes the network helper, enriches the returned user object, updates the in-memory state, writes tokens to the appropriate storage, and broadcasts the login event across tabs.

### Line-by-Line Breakdown
- `const data = await loginUser(...)`: Posts credentials to backend `/auth/login`.
- `const enriched = enrichUser(data.user)`: Augments user record with UI presentation fields.
- `setCurrentUser(enriched)`: Updates global React state.
- `persistAuthSession(data, enriched, rememberMe)`: Stores tokens in `localStorage` or `sessionStorage`.
- `broadcastAuthMessage({ type: 'AUTH_LOGIN', user: enriched })`: Signals other tabs to reflect the new login.

---

```javascript
  const updateProfile = async (profileUpdates) => {
    const activeEmail = (currentUser?.email || '').trim().toLowerCase();
    if (activeEmail) {
      localStorage.setItem(
        `iiitnr_residence_${activeEmail}`,
        JSON.stringify({
          hostel_name: profileUpdates.hostel_name ?? currentUser?.hostel_name ?? null,
          room_number: profileUpdates.room_number ?? currentUser?.room_number ?? null,
        })
      );
    }

    try {
      const updatedUser = await updateUserProfile(profileUpdates);
      const enriched = enrichUser(updatedUser);
      setCurrentUser(enriched);
      const isPersistent = Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
      const storage = isPersistent ? localStorage : sessionStorage;
      storage.setItem(AUTH_USER_KEY, JSON.stringify(enriched));
      broadcastAuthMessage({ type: 'AUTH_USER_UPDATED', user: enriched });
      return enriched;
    } catch (err) {
      if (currentUser) {
        const merged = enrichUser({
          ...currentUser,
          ...profileUpdates,
        });
        setCurrentUser(merged);
        broadcastAuthMessage({ type: 'AUTH_USER_UPDATED', user: merged });
        return merged;
      }
      throw err;
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    const updatedUser = await changePassword(currentPassword, newPassword);
    const enriched = enrichUser(updatedUser);
    setCurrentUser(enriched);
    const isPersistent = Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
    const storage = isPersistent ? localStorage : sessionStorage;
    storage.setItem(AUTH_USER_KEY, JSON.stringify(enriched));
    broadcastAuthMessage({ type: 'AUTH_USER_UPDATED', user: enriched });
    return enriched;
  };
```

### Plain-English Purpose
These functions manage profile modifications:
- `updateProfile`: Updates user fields (name, phone, hostel, room number). It includes optimistic resilience: if the backend call fails, it merges local updates to prevent user frustration while saving residence data to local storage.
- `updatePassword`: Submits current and new passwords to the backend and updates the user's local `has_password` flag upon success.

---

```javascript
  const isStudent = currentUser?.role === 'STUDENT';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isTechnician = currentUser?.role === 'TECHNICIAN';
  const canAccessOperations = isAdmin || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        authInitializing,
        rememberedEmail,
        login,
        loginGoogle,
        register,
        updateProfile,
        updatePassword,
        logout,
        isStudent,
        isAdmin,
        isSuperAdmin,
        isTechnician,
        canAccessOperations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Plain-English Purpose
Calculates boolean helper properties representing Role-Based Access Control (RBAC) tiers (`isStudent`, `isAdmin`, `isSuperAdmin`, `isTechnician`, `canAccessOperations`), bundles all state and handlers into the `AuthContext.Provider` value, and provides the custom consumer hook `useAuth()`. If a developer attempts to call `useAuth()` outside of an `AuthProvider` tree, an explanatory runtime error is thrown immediately.

### Line-by-Line Breakdown
- `const canAccessOperations = isAdmin || isSuperAdmin;`: Logical OR checking if the user holds facility supervisor or super administrator privileges.
- `<AuthContext.Provider value={{ ... }}>`: Makes authentication state available to all nested components.
- `export function useAuth()`: Custom hook wrapping `useContext(AuthContext)`.
- `if (!context) throw new Error(...)`: Guard clause guarding against developer misconfiguration.

---

## 3. High-Frequency Viva & Technical Defense Questions

### Q1: What is the purpose of React Context, and why is `AuthContext` better than passing user props manually?
**Model Answer:**  
React Context provides a way to share values like the authenticated user profile across the entire component tree without explicitly passing props through every intermediate component (preventing *prop drilling*). Because components at opposite ends of the application hierarchy (like `Navbar`, `AppRouter`, and `TechnicianWorkstation`) all require user identity and role information, storing authentication state in a top-level `AuthContext` makes the architecture clean, decoupled, and maintainable.

### Q2: How does the "Remember Me" toggle change where tokens are stored, and why does this matter for security?
**Model Answer:**  
- When **Remember Me is TRUE**, tokens are stored in `localStorage`. This data persists across browser sessions and OS reboots, providing convenience on private, trusted devices.
- When **Remember Me is FALSE**, tokens are stored in `sessionStorage`. This data is strictly scoped to the current browser tab and is destroyed immediately when the tab or window is closed. This provides security on shared or public university lab computers by preventing subsequent users from accessing previous sessions.

### Q3: How does `AuthContext` keep two different browser tabs synchronized when a user logs in or logs out?
**Model Answer:**  
It uses a multi-layered synchronization strategy:
1. **Primary mechanism**: The W3C `BroadcastChannel` API (`smart_complaint_auth_sync`). When Tab A logs out, it posts an `AUTH_LOGOUT` message. Tab B receives this message via its `onmessage` listener and immediately resets `currentUser` to `null`.
2. **Fallback 1**: The native `window.addEventListener('storage')` listener, which automatically triggers in other tabs when `localStorage` keys are added or removed.
3. **Fallback 2**: The `visibilitychange` listener, which checks storage whenever a user brings an idle tab back into focus.

### Q4: Why does `useState` in `AuthProvider` use a lazy initialization function instead of `useState(null)`?
**Model Answer:**  
If initialized with `useState(null)`, the app starts as "unauthenticated" on every reload until a `useEffect` reads storage and updates state. This delay causes a visible flickering glitch called **Flash of Unauthenticated Content (FOUC)**, where protected route guards might momentarily redirect the user to `/login` before realizing they are actually logged in. The lazy initialization function runs synchronously during the initial render, reading cached credentials immediately and preventing this glitch.

### Q5: Why is `useCallback` used on the `logout` function?
**Model Answer:**  
In React, functions defined inside components are re-created as new object references in memory on every render. If `logout` is passed as a dependency to child components or `useEffect` hooks, its changing reference would trigger unnecessary re-renders or infinite effect loops. `useCallback(..., [])` memoizes the function, ensuring its reference remains identical throughout the application lifecycle.

---

## 4. Quick Reference Summary Table

| Symbol / Function | Type / Signature | Primary Responsibility | Key Mechanism |
| :--- | :--- | :--- | :--- |
| `broadcastAuthMessage` | `(message) => void` | Multi-tab event broadcaster | Instantiates ephemeral `BroadcastChannel(AUTH_CHANNEL_NAME)` |
| `enrichUser` | `(userData) => Object\|null` | Attaches UI presentation metadata | Maps `role` to emoji, color classes, and route; merges cached residence |
| `clearAuthStorage` | `() => void` | Complete credential wipe | Clears all auth keys across both `localStorage` and `sessionStorage` |
| `persistAuthSession` | `(data, user, rememberMe) => void` | Session persistence | Writes to `localStorage` (if remember) or `sessionStorage` (if temporary) |
| `AuthProvider` | `React Component` | Root global state provider | Synchronous lazy state, bootstrap effect, 4 event listeners |
| `useAuth` | `() => AuthContextValue` | Consumer hook | Wraps `useContext(AuthContext)` with invariant null-check guard |
