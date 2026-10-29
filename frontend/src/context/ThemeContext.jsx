/**
 * SmartComplaintHandler - Global Theme Context
 * Manages Obsidian Dark Theme with localStorage persistence and FOUC prevention.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      localStorage.setItem('ui-theme-v2', 'dark');
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const isDark = true;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');

    try {
      localStorage.setItem('ui-theme-v2', 'dark');
    } catch {}

    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = 'dark';
    }
  }, [theme]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'ui-theme-v2' && e.newValue !== 'dark') {
        try {
          localStorage.setItem('ui-theme-v2', 'dark');
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleTheme = () => {
    setThemeState('dark');
  };

  const setTheme = () => {
    setThemeState('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme: 'dark', isDark: true, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
