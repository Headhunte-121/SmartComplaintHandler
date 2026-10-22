/**
 * SmartComplaintHandler - Campus Facilities Directorate Operations Center
 * Role: Dedicated Executive Command Console for the Super Administrator / Directorate.
 * Powered by ModernOperationsDesk with role-isolated 'superadmin' configuration.
 */
import React from 'react';
import ModernOperationsDesk from '../components/ModernOperationsDesk';

export default function SuperAdminDashboard() {
  return <ModernOperationsDesk mode="superadmin" />;
}
