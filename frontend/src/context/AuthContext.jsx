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
  AUTH_EXPIRES_AT_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  REFRESH_TOKEN_KEY,
  isTokenExpired,
} from '../api/client';

// Enterprise Security: Mock testing personas are strictly stripped and disabled in production builds.
// In production, user state is strictly verified against cryptographic server-side JWT tokens.
export const CAMPUS_PERSONAS = import.meta.env.DEV
  ? [
      {
        id: 'dev_student',
        name: 'Sample Student',
        role: 'STUDENT',
        roleLabel: 'Student',
        email: 'student.sample@iiitnr.edu.in',
        identifier: 'Student Account',
        department: 'Computer Science & Engineering',
        department_name: 'Computer Science & Engineering',
        hostel_name: 'Ramanujan House (Boys Hostel 1)',
        room_number: 'Room 204',
        avatar: '🎓',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        targetRoute: '/submit',
        description: 'Testing persona for student grievance intake.',
      },
    ]
  : [];


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
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
  localStorage.removeItem('smart_complaint_remember_email');
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
  localStorage.removeItem('smart_complaint_remember_email');
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
  const [rememberedEmail, setRememberedEmail] = useState('');

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
      return enriched;
    } catch (err) {
      if (currentUser) {
        const merged = enrichUser({
          ...currentUser,
          ...profileUpdates,
        });
        setCurrentUser(merged);
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
    return enriched;
  };

  const switchPersona = async (personaId) => {
    if (import.meta.env.PROD) {
      return;
    }
    const found = CAMPUS_PERSONAS.find((p) => p.id === personaId);
    if (found) {
      try {
        const data = await loginUser(found.email, 'password123', true);
        const enriched = enrichUser({
          ...data.user,
          hostel_name: data.user?.hostel_name || found.hostel_name || null,
          room_number: data.user?.room_number || found.room_number || null,
        });
        setCurrentUser(enriched);
        persistAuthSession(data, enriched, true);
        setRememberedEmail(found.email);
        setIsPersonaModalOpen(false);
      } catch (e) {
        // Dev only notice
      }
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
        currentPersona: currentUser || null,
        personas: CAMPUS_PERSONAS,
        rememberedEmail,
        login,
        loginGoogle,
        register,
        updateProfile,
        updatePassword,
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
