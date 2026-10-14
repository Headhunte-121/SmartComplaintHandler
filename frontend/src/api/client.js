/**
 * SmartComplaintHandler - Base API Client
 * Blueprint Reference: V1/M1/frontend/02_base_api_client.md
 * Role: Configures Axios instance with normalized base URL, automatic /api/v1 suffix guard,
 *       JWT Bearer token injection, and automatic 401 token refresh / session expiration recovery.
 */
import axios from 'axios';

export const AUTH_TOKEN_KEY = 'smart_complaint_auth_token';
export const REFRESH_TOKEN_KEY = 'smart_complaint_refresh_token';
export const AUTH_USER_KEY = 'smart_complaint_auth_user';
export const AUTH_EXPIRES_AT_KEY = 'smart_complaint_auth_expires_at';
export const AUTH_EXPIRED_EVENT = 'smart-complaint:auth-expired';

export function resolveApiBaseUrl() {
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
    localStorage.getItem(AUTH_TOKEN_KEY) ||
    sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function resolvePendingQueue(error, newToken = null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newToken);
    }
  });
  pendingQueue = [];
}

// Automatically refresh expired access tokens on 401 or broadcast session expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';

    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/google') ||
      requestUrl.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken =
        localStorage.getItem(REFRESH_TOKEN_KEY) ||
        sessionStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            pendingQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const isPersistent = Boolean(localStorage.getItem(REFRESH_TOKEN_KEY));
          const refreshRes = await axios.post(
            `${resolveApiBaseUrl()}/auth/refresh`,
            {
              refresh_token: refreshToken,
              remember_me: isPersistent,
            },
            { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
          );

          const { access_token, refresh_token: nextRefresh, expires_at } = refreshRes.data;
          const storage = isPersistent ? localStorage : sessionStorage;
          storage.setItem(AUTH_TOKEN_KEY, access_token);
          if (nextRefresh) {
            storage.setItem(REFRESH_TOKEN_KEY, nextRefresh);
          }
          if (expires_at) {
            storage.setItem(AUTH_EXPIRES_AT_KEY, expires_at);
          }

          resolvePendingQueue(null, access_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          resolvePendingQueue(refreshError, null);
        } finally {
          isRefreshing = false;
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
