/**
 * SmartComplaintHandler - Root Application Entry Component
 * Blueprint Reference: docs/V1/M1/frontend/04_app_router.md
 * Role: Encapsulates application state with AuthProvider and mounts the client-side router.
 */
import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './router/AppRouter';
import { fetchAndCacheCampusBuildings } from './data/iiitnrCampusData';

export default function App() {
  useEffect(() => {
    // Automatically load database campus infrastructure on mount
    fetchAndCacheCampusBuildings().catch((err) => {
      console.warn('Campus infrastructure background load notice:', err);
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
