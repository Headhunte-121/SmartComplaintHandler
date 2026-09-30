import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Standard Campus Personas for Role-Based Access:
 * 1. STUDENT: Lodges complaints, tracks personal grievances, views resolutions.
 * 2. TECHNICIAN: Field staff executing repairs, starts work orders, submits resolution notes.
 * 3. ADMIN: Facility supervisor overseeing queues, workload balancing, priority overrides, and SLA breach governance.
 */
export const CAMPUS_PERSONAS = [
  {
    id: 'student_aarav',
    name: 'Aarav Sharma',
    role: 'STUDENT',
    roleLabel: 'Student',
    email: 'aarav.sharma@campus.edu',
    identifier: 'Roll: 23BCS104',
    department: 'Computer Science & Engineering',
    location: 'Hostel Block B, Room 204',
    avatar: '🎓',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Undergraduate student reporting campus facility issues and tracking ticket status.'
  },
  {
    id: 'tech_ramesh',
    name: 'Ramesh Kumar',
    role: 'TECHNICIAN',
    roleLabel: 'Field Technician',
    email: 'ramesh.k@facilities.campus.edu',
    identifier: 'Badge: TECH-ELEC-42',
    department: 'Electrical Services',
    teamId: 1,
    teamName: 'Rapid Electrical Squad 1',
    avatar: '🔧',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Assigned field technician executing repairs, advancing tickets to IN_PROGRESS, and verifying resolution.'
  },
  {
    id: 'admin_verma',
    name: 'Dr. Sunita Verma',
    role: 'ADMIN',
    roleLabel: 'Chief Facility Supervisor',
    email: 's.verma@admin.campus.edu',
    identifier: 'Emp ID: FAC-DIR-01',
    department: 'Central Facilities Management',
    office: 'Administrative Block, Room 102',
    avatar: '🛡️',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Chief operational supervisor with authority for squad reassignment, priority overrides, and SLA breach escalations.'
  }
];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentPersona, setCurrentPersona] = useState(() => {
    const saved = localStorage.getItem('smart_complaint_persona');
    if (saved) {
      const match = CAMPUS_PERSONAS.find((p) => p.id === saved);
      if (match) return match;
    }
    return CAMPUS_PERSONAS[0]; // Default to Student
  });

  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);

  useEffect(() => {
    if (currentPersona) {
      localStorage.setItem('smart_complaint_persona', currentPersona.id);
    }
  }, [currentPersona]);

  const switchPersona = (personaId) => {
    const found = CAMPUS_PERSONAS.find((p) => p.id === personaId);
    if (found) {
      setCurrentPersona(found);
      setIsPersonaModalOpen(false);
    }
  };

  const isStudent = currentPersona.role === 'STUDENT';
  const isTechnician = currentPersona.role === 'TECHNICIAN';
  const isAdmin = currentPersona.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        currentPersona,
        personas: CAMPUS_PERSONAS,
        switchPersona,
        isPersonaModalOpen,
        openPersonaModal: () => setIsPersonaModalOpen(true),
        closePersonaModal: () => setIsPersonaModalOpen(false),
        isStudent,
        isTechnician,
        isAdmin
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
