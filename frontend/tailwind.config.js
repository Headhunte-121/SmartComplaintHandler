/**
 * SmartComplaintHandler - Tailwind CSS Configuration
 * Clean Light Theme: Primary White & Secondary Light Green Design System
 * - Primary Canvas: #FFFFFF / #F8FAF9 (Crisp, modern, high-contrast white base)
 * - Secondary Accent: #16A34A / #22C55E (Fresh Light Green)
 * - Secondary Tints: #F0FDF4 (50), #DCFCE7 (100), #BBF7D0 (200), #86EFAC (300)
 * - Typography: #0F172A (Slate 900 Charcoal), #475569 (Slate 600 Muted)
 */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Semantic primary white and secondary green palette
        brand: {
          primary: '#FFFFFF',
          secondary: '#16A34A',
          accent: '#22C55E',
          canvas: '#F8FAF9',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          charcoal: '#0F172A',
          muted: '#475569',
        },
        lightgreen: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        // Backward compatibility mappings
        botanical: {
          sage: '#16A34A',
          cream: '#F8FAF9',
          moss: '#22C55E',
          sand: '#86EFAC',
          forest: '#15803D',
          earth: '#166534',
          deep: '#F8FAF9',
          surface: '#FFFFFF',
          elevated: '#FFFFFF',
          linen: '#0F172A',
        },
        hazard: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'bento': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'bento-hover': '0 10px 25px -5px rgba(22, 163, 74, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'glow-green': '0 0 20px -3px rgba(34, 197, 94, 0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
