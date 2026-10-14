/**
 * SmartComplaintHandler - Tailwind CSS Configuration
 * Blueprint Reference: V1/M1/frontend/01_vite_tailwind_config.md
 * Role: Enterprise design tokens, Inter & JetBrains Mono font stacks, custom keyframe animations,
 *       and priority hazard colors inspired by Linear, Vercel, and Stripe.
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
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#CA8A04',
          low: '#16A34A',
        },
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'xs': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'bento': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
        'bento-hover': '0 12px 32px -4px rgba(79, 70, 229, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        'glow-indigo': '0 0 24px -4px rgba(99, 102, 241, 0.35)',
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
