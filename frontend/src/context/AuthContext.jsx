import React, { createContext, useContext, useState } from 'react';
import { loginUser, loginWithGoogle, registerUser } from '../api/auth';

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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const persistedUser = localStorage.getItem('smart_complaint_auth_user');
      const persistedToken = localStorage.getItem('smart_complaint_auth_token');
      if (persistedUser && persistedToken) {
        return enrichUser(JSON.parse(persistedUser));
      }
      const sessionedUser = sessionStorage.getItem('smart_complaint_auth_user');
      const sessionedToken = sessionStorage.getItem('smart_complaint_auth_token');
      if (sessionedUser && sessionedToken) {
        return enrichUser(JSON.parse(sessionedUser));
      }
    } catch (e) {
      console.warn('Failed to parse cached auth user:', e);
    }
    return null;
  });

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState(() => {
    return localStorage.getItem('smart_complaint_remember_email') || '';
  });

  const login = async (email, password, rememberMe = false) => {
    const data = await loginUser(email, password, rememberMe);
    const enriched = enrichUser(data.user);
    setCurrentUser(enriched);

    if (rememberMe) {
      localStorage.setItem('smart_complaint_auth_token', data.access_token);
      localStorage.setItem('smart_complaint_auth_user', JSON.stringify(enriched));
      localStorage.setItem('smart_complaint_remember_email', email);
      setRememberedEmail(email);

      sessionStorage.removeItem('smart_complaint_auth_token');
      sessionStorage.removeItem('smart_complaint_auth_user');
    } else {
      sessionStorage.setItem('smart_complaint_auth_token', data.access_token);
      sessionStorage.setItem('smart_complaint_auth_user', JSON.stringify(enriched));

      localStorage.removeItem('smart_complaint_auth_token');
      localStorage.removeItem('smart_complaint_auth_user');
    }

    return enriched;
  };

  const register = async (registrationData) => {
    const data = await registerUser(registrationData);
    const enriched = enrichUser(data.user);
    setCurrentUser(enriched);

    if (registrationData.remember_me) {
      localStorage.setItem('smart_complaint_auth_token', data.access_token);
      localStorage.setItem('smart_complaint_auth_user', JSON.stringify(enriched));
      localStorage.setItem('smart_complaint_remember_email', registrationData.email);
      setRememberedEmail(registrationData.email);
      sessionStorage.removeItem('smart_complaint_auth_token');
      sessionStorage.removeItem('smart_complaint_auth_user');
    } else {
      sessionStorage.setItem('smart_complaint_auth_token', data.access_token);
      sessionStorage.setItem('smart_complaint_auth_user', JSON.stringify(enriched));
      localStorage.removeItem('smart_complaint_auth_token');
      localStorage.removeItem('smart_complaint_auth_user');
    }

    return enriched;
  };

  const loginGoogle = async (googleData) => {
    const data = await loginWithGoogle(googleData);
    const enriched = enrichUser(data.user);
    setCurrentUser(enriched);

    localStorage.setItem('smart_complaint_auth_token', data.access_token);
    localStorage.setItem('smart_complaint_auth_user', JSON.stringify(enriched));
    localStorage.setItem('smart_complaint_remember_email', enriched.email);
    setRememberedEmail(enriched.email);

    sessionStorage.removeItem('smart_complaint_auth_token');
    sessionStorage.removeItem('smart_complaint_auth_user');

    return enriched;
  };

  const switchPersona = async (personaId) => {
    const found = CAMPUS_PERSONAS.find((p) => p.id === personaId);
    if (found) {
      try {
        const data = await loginUser(found.email, 'password123', true);
        const enriched = enrichUser(data.user);
        setCurrentUser(enriched);
        localStorage.setItem('smart_complaint_auth_token', data.access_token);
        localStorage.setItem('smart_complaint_auth_user', JSON.stringify(enriched));
        localStorage.setItem('smart_complaint_remember_email', found.email);
        setRememberedEmail(found.email);
      } catch (e) {
        setCurrentUser(found);
      }
      setIsPersonaModalOpen(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('smart_complaint_auth_token');
    localStorage.removeItem('smart_complaint_auth_user');
    sessionStorage.removeItem('smart_complaint_auth_token');
    sessionStorage.removeItem('smart_complaint_auth_user');
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
