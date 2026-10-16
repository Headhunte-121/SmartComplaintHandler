/**
 * SmartComplaintHandler - Tailwind CSS Configuration
 * Sleek Obsidian-Slate & Emerald Design System
 */
/** @type {import('tailwindcss').Config} */
export default {
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
        hazard: {
          critical: '#F43F5E',
          high: '#F97316',
          medium: '#EAB308',
          low: '#10B981',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.25)',
        'bento': '0 8px 28px -4px rgba(0, 0, 0, 0.45), 0 1px 3px 0 rgba(16, 185, 129, 0.04)',
        'bento-hover': '0 14px 36px -4px rgba(16, 185, 129, 0.16), 0 4px 14px -2px rgba(0, 0, 0, 0.5)',
        'glow-emerald': '0 0 28px -4px rgba(16, 185, 129, 0.4)',
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
