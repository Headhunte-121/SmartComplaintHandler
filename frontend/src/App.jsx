/**
 * SmartComplaintHandler - Root Application Entry Component
 * Blueprint Reference: docs/V1/M1/frontend/04_app_router.md
 * Role: Encapsulates application state with AuthProvider and mounts the client-side router.
 */
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
