/**
 * SmartComplaintHandler - Base API Client
 * Blueprint Reference: V1/M1/frontend/02_base_api_client.md
 * Role: Configures Axios instance with base URL and global JWT Bearer token interceptor.
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
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
