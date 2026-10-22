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

function broadcastAuthMessage(message) {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
      channel.postMessage(message);
      channel.close();
    } catch (_) {}
  }
}

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

      // If storage is momentarily unreadable or empty, DO NOT wipe memory session if user is logged in
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
      } catch (_) {
        // Do not crash or clear on parse glitch
      }
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
