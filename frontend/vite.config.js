/**
 * SmartComplaintHandler - Vite Configuration
 * Blueprint Reference: V1/M1/frontend/01_vite_tailwind_config.md
 * Role: Vite bundler with reverse proxy routing /api requests to FastAPI :8000.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      },
      '/health': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          'vendor-api': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
