import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchMe,
  loginUser,
  loginWithGoogle,
  logoutUser,
  refreshSession,
  registerUser,
} from '../api/auth';
import {
  AUTH_EXPIRED_EVENT,
  AUTH_EXPIRES_AT_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
  isTokenExpired,
} from '../api/client';

/**
 * Institutional IIIT-NR Personas for Role-Based Access & Quick Testing:
 * 1. STUDENT: Lodges complaints (/submit), tracks personal grievances (/student, /track). Strictly isolated from admin desks.
 * 2. ADMIN: Facilities supervisor overseeing triage, queues, reassignment, and SLA governance (/admin).
 * 3. SUPER_ADMIN: Directorate authority managing admins, technicians, data sanitization, and campus catalog (/superadmin).
 * 4. TECHNICIAN: Field squad technician servicing assigned tickets (/technician).
 */
export const CAMPUS_PERSONAS = [
  {
    id: 'student_nikhil',
    name: 'Nikhil (Student)',
    role: 'STUDENT',
    roleLabel: 'Student',
    email: 'nikhil26100@iiitnr.edu.in',
    identifier: 'Roll: 2026CSE100',
    department: 'Computer Science & Engineering',
    department_name: 'Computer Science & Engineering',
    avatar: '🎓',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    targetRoute: '/submit',
    description: 'Undergraduate student reporting campus facility issues and tracking personal complaints.',
  },
  {
    id: 'admin_verma',
    name: 'Dr. Sunita Verma',
    role: 'ADMIN',
    roleLabel: 'Facility Admin',
    email: 'admin@iiitnr.edu.in',
    identifier: 'Staff ID: FAC-01',
    department: 'Central Facilities Management',
    department_name: 'Central Facilities Management',
    avatar: '🛡️',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    targetRoute: '/admin',
    description: 'Chief operational supervisor overseeing queues, workload balancing, priority overrides, and SLA governance.',
  },
  {
    id: 'super_admin',
    name: 'Chief Campus Administrator',
    role: 'SUPER_ADMIN',
    roleLabel: 'Super Admin',
    email: 'superadmin@iiitnr.edu.in',
    identifier: 'Directorate (DIR-01)',
    department: 'Office of the Director',
    department_name: 'Office of the Director',
    avatar: '👑',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    targetRoute: '/superadmin',
    description: 'Supreme administrator with full authority to add/manage facility admins, purge records, and audit telemetry.',
  },
  {
    id: 'tech_ramesh',
    name: 'Ramesh Kumar',
    role: 'TECHNICIAN',
    roleLabel: 'Field Technician',
    email: 'tech.ramesh@iiitnr.edu.in',
    identifier: 'Squad Tech #1',
    department: 'Electrical Services',
    department_name: 'Electrical Services',
    avatar: '🔧',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    targetRoute: '/technician',
    description: 'Field squad technician servicing assigned repair tickets and updating resolution notes.',
  },
];

function enrichUser(userData) {
  if (!userData) return null;
  const role = userData.role || 'STUDENT';
  let avatar = '🎓';
  let roleLabel = 'Student';
  let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
  let targetRoute = '/submit';

  if (role === 'SUPER_ADMIN') {
    avatar = '👑';
    roleLabel = 'Super Admin';
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
    targetRoute = '/superadmin';
  } else if (role === 'ADMIN') {
    avatar = '🛡️';
    roleLabel = 'Facility Admin';
    badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
    targetRoute = '/admin';
  } else if (role === 'TECHNICIAN') {
    avatar = '🔧';
    roleLabel = 'Field Technician';
    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    targetRoute = '/technician';
  }

  const resolvedDept =
    userData.department ||
    userData.department_name ||
    'Computer Science & Engineering';

  return {
    ...userData,
    department: resolvedDept,
    department_name: resolvedDept,
    identifier: userData.identifier || `ID: ${(userData.email || '').split('@')[0].toUpperCase()}`,
    avatar,
    roleLabel,
    badgeClass,
    targetRoute,
  };
}

function clearAuthStorage() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_EXPIRES_AT_KEY);
}

function persistAuthSession(authData, enrichedUser, rememberMe) {
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

  if (rememberMe && enrichedUser?.email) {
    localStorage.setItem('smart_complaint_remember_email', enrichedUser.email);
  }
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
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState(() => {
    return localStorage.getItem('smart_complaint_remember_email') || '';
  });

  const logout = useCallback(() => {
    setCurrentUser(null);
    clearAuthStorage();
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
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleSessionExpired);
    };
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const data = await loginUser(email, password, rememberMe);
    const enriched = enrichUser(data.user);
    setCurrentUser(enriched);
    persistAuthSession(data, enriched, rememberMe);
    if (rememberMe) {
      setRememberedEmail(enriched.email);
    }
    return enriched;
  };

  const register = async (registrationData) => {
    const data = await registerUser(registrationData);
    const enriched = enrichUser(data.user);
    const rememberMe = Boolean(registrationData.remember_me);
    setCurrentUser(enriched);
    persistAuthSession(data, enriched, rememberMe);
    if (rememberMe) {
      setRememberedEmail(enriched.email);
    }
    return enriched;
  };

  const loginGoogle = async (googleData) => {
    const data = await loginWithGoogle(googleData);
    const enriched = enrichUser(data.user);
    const rememberMe = googleData.remember_me !== false;
    setCurrentUser(enriched);
    persistAuthSession(data, enriched, rememberMe);
    setRememberedEmail(enriched.email);
    return enriched;
  };

  const switchPersona = async (personaId) => {
    const found = CAMPUS_PERSONAS.find((p) => p.id === personaId);
    if (found) {
      const data = await loginUser(found.email, 'password123', true);
      const enriched = enrichUser(data.user);
      setCurrentUser(enriched);
      persistAuthSession(data, enriched, true);
      setRememberedEmail(found.email);
      setIsPersonaModalOpen(false);
    }
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
        currentPersona: currentUser || CAMPUS_PERSONAS[0],
        personas: CAMPUS_PERSONAS,
        rememberedEmail,
        login,
        loginGoogle,
        register,
        logout,
        switchPersona,
        isPersonaModalOpen,
        openPersonaModal: () => setIsPersonaModalOpen(true),
        closePersonaModal: () => setIsPersonaModalOpen(false),
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
