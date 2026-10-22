/**
 * SmartComplaintHandler - Facilities Operations Desk
 * Role: Primary operational workstation for institutional Facility Admins.
 * Powered by ModernOperationsDesk with role-isolated 'admin' configuration.
 */
import React from 'react';
import ModernOperationsDesk from '../components/ModernOperationsDesk';

export default function AdminDashboard() {
  return <ModernOperationsDesk mode="admin" />;
}
