/**
 * SmartComplaintHandler - Tailwind CSS Configuration
 * Blueprint Reference: V1/M1/frontend/01_vite_tailwind_config.md
 * Role: Design tokens, priority hazard colors, and component utility classes.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hazard: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#CA8A04',
          low: '#16A34A'
        }
      }
    },
  },
  plugins: [],
};
