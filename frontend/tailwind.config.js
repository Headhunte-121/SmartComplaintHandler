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
        botanical: {
          sage: '#A7AD89',
          cream: '#DAD0C6',
          moss: '#8C906D',
          sand: '#B69B86',
          forest: '#687156',
          earth: '#8F755E',
          deep: '#0A110D',
          surface: '#0F1A14',
          elevated: '#14221B',
          linen: '#FAF7F2',
        },
        sage: {
          50: '#F5F6F1',
          100: '#E9EBE2',
          200: '#D4D9C6',
          300: '#BEC6AA',
          400: '#A7AD89',
          500: '#8C906D',
          600: '#687156',
          700: '#4F573F',
          800: '#373D2C',
          900: '#21251A',
          950: '#0A110D',
        },
        cream: {
          50: '#FAF8F5',
          100: '#F4EFE8',
          200: '#EAE2D7',
          300: '#DAD0C6',
          400: '#C8BAAD',
          500: '#B6A494',
        },
        sand: {
          300: '#CDBCAE',
          400: '#B69B86',
          500: '#9E826D',
        },
        forest: {
          700: '#2D4536',
          800: '#1C2E24',
          900: '#14221B',
          950: '#0A110D',
        },
        earth: {
          400: '#A68970',
          500: '#8F755E',
          600: '#755E4A',
        },
        hazard: {
          critical: '#E06D63',
          high: '#D9824C',
          medium: '#D4A359',
          low: '#8C906D',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.35)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.45), 0 1px 2px -1px rgba(0, 0, 0, 0.35)',
        'bento': '0 8px 28px -4px rgba(0, 0, 0, 0.55), 0 1px 3px 0 rgba(167, 173, 137, 0.06)',
        'bento-hover': '0 14px 36px -4px rgba(167, 173, 137, 0.18), 0 4px 14px -2px rgba(0, 0, 0, 0.6)',
        'glow-sage': '0 0 28px -4px rgba(167, 173, 137, 0.45)',
        'glow-emerald': '0 0 28px -4px rgba(167, 173, 137, 0.4)',
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
