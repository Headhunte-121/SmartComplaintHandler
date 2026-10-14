/**
 * SmartComplaintHandler - Base API Client
 * Blueprint Reference: V1/M1/frontend/02_base_api_client.md
 * Role: Configures Axios instance with normalized base URL, automatic /api/v1 suffix guard,
 *       and global JWT Bearer token interceptor.
 */
import axios from 'axios';

function resolveApiBaseUrl() {
  const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!rawEnvUrl) {
    return '/api/v1';
  }

  // Prevent mixed-content / localhost Network Error when deployed on Vercel or production HTTPS
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    (rawEnvUrl.includes('localhost') || rawEnvUrl.includes('127.0.0.1'))
  ) {
    return '/api/v1';
  }

  // Normalize trailing slashes and ensure /api/v1 suffix is present
  const trimmed = rawEnvUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  if (trimmed.endsWith('/api')) {
    return `${trimmed}/v1`;
  }
  return `${trimmed}/api/v1`;
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage or sessionStorage
apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('smart_complaint_auth_token') ||
    sessionStorage.getItem('smart_complaint_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
