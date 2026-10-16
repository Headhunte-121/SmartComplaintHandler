/**
 * SmartComplaintHandler - Tailwind CSS Configuration
 * Botanical Lemon Grove & Dark Forest Design System
 * Palette from Dopely:
 * - Lemon Zest: #FEDF47 (Vibrant citrus highlight)
 * - Pale Lemon / Cream: #FEF3C6 (Soft warm cream)
 * - Sage Leaf: #A3B18A (Muted botanical sage)
 * - Garden Green: #588157 (Lush foliage primary)
 * - Dark Forest: #344E41 (Deep evergreen base)
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
        // Direct named botanical palette
        lemon: {
          DEFAULT: '#FEDF47',
          50: '#FEFDF0',
          100: '#FEF9C3',
          200: '#FEF3C6', // Pale Lemon / Cream
          300: '#FDE047',
          400: '#FEDF47', // Lemon Zest
          500: '#EAB308',
          600: '#CA8A04',
        },
        cream: {
          DEFAULT: '#FEF3C6',
          50: '#FFFDF5',
          100: '#FEF9E7',
          200: '#FEF3C6',
          300: '#FDE68A',
        },
        sage: {
          DEFAULT: '#A3B18A',
          50: '#F5F7F3',
          100: '#E7ECE2',
          200: '#CFDBC6',
          300: '#B8CAA9',
          400: '#A3B18A', // Sage Leaf
          500: '#8B9C70',
          600: '#718057',
          700: '#586443',
          800: '#404930',
        },
        garden: {
          DEFAULT: '#588157',
          50: '#F2F6F2',
          100: '#E2ECE1',
          200: '#C2D7C0',
          300: '#9EC09C',
          400: '#7AA778',
          500: '#588157', // Garden Green
          600: '#466745',
          700: '#365035',
          800: '#273926',
        },
        forest: {
          DEFAULT: '#344E41',
          50: '#EBF0ED',
          100: '#D5DFDA',
          200: '#ADC0B6',
          300: '#839F90',
          400: '#5B7F6F',
          500: '#344E41', // Dark Forest
          600: '#2A3F35',
          700: '#203028',
          800: '#17221C',
          850: '#132019', // Card surface
          900: '#0C1410', // Page background
          950: '#09110D', // Input surface
        },
        // Map emerald utilities so all components adopt Garden Green & Sage Leaf
        emerald: {
          50: '#FEFDF0',
          100: '#FEF3C6', // Pale Lemon
          200: '#CFDBC6',
          300: '#A3B18A', // Sage Leaf
          400: '#7AA778',
          500: '#588157', // Garden Green (Primary Brand)
          600: '#466745', // Deep Garden
          700: '#344E41', // Dark Forest
          800: '#203028',
          900: '#132019',
          950: '#0C1410',
        },
        // Map legacy indigo utilities to Garden Green
        indigo: {
          50: '#F2F6F2',
          100: '#E2ECE1',
          200: '#C2D7C0',
          300: '#9EC09C',
          400: '#7AA778',
          500: '#588157',
          600: '#466745',
          700: '#344E41',
          800: '#273926',
          900: '#132019',
          950: '#0C1410',
        },
        hazard: {
          critical: '#F43F5E',
          high: '#F97316',
          medium: '#FEDF47', // Lemon Zest for medium urgency
          low: '#588157',    // Garden Green for routine
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.35), 0 1px 2px -1px rgba(0, 0, 0, 0.25)',
        'bento': '0 8px 28px -4px rgba(0, 0, 0, 0.55), 0 1px 3px 0 rgba(88, 129, 87, 0.08)',
        'bento-hover': '0 14px 36px -4px rgba(88, 129, 87, 0.22), 0 4px 14px -2px rgba(0, 0, 0, 0.6)',
        'glow-garden': '0 0 28px -4px rgba(88, 129, 87, 0.45)',
        'glow-lemon': '0 0 28px -4px rgba(254, 223, 71, 0.35)',
        'glow-emerald': '0 0 28px -4px rgba(88, 129, 87, 0.45)',
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
