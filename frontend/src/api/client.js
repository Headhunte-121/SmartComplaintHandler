/**
 * SmartComplaintHandler - Base API Client
 * Blueprint Reference: V1/M1/frontend/02_base_api_client.md
 * Role: Configures Axios instance with normalized base URL, automatic /api/v1 suffix guard,
 *       proactive JWT expiration checking, Bearer token injection, and automatic 401 refresh rotation.
 */
import axios from 'axios';

export const AUTH_TOKEN_KEY = 'smart_complaint_auth_token';
export const REFRESH_TOKEN_KEY = 'smart_complaint_refresh_token';
export const AUTH_USER_KEY = 'smart_complaint_auth_user';
export const AUTH_EXPIRES_AT_KEY = 'smart_complaint_auth_expires_at';
export const AUTH_EXPIRED_EVENT = 'smart-complaint:auth-expired';
export const AUTH_FORBIDDEN_EVENT = 'smart-complaint:auth-forbidden';

/**
 * Inspect JWT `exp` claim or stored ISO timestamp to detect expired tokens proactively
 * (with a 30-second clock-skew buffer).
 */
export function isTokenExpired(token, storedExpiresAt = null) {
  if (!token) return true;

  if (storedExpiresAt) {
    const expTime = Date.parse(storedExpiresAt);
    if (!Number.isNaN(expTime) && Date.now() + 30000 >= expTime) {
      return true;
    }
  }

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (payload.exp && Date.now() + 30000 >= payload.exp * 1000) {
        return true;
      }
    }
  } catch (_) {
    // Non-JWT or opaque token; defer verification to backend
  }

  return false;
}

export function resolveApiBaseUrl() {
  const rawEnvUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (!rawEnvUrl) {
    return '/api/v1';
  }

  // Normalize localhost to 127.0.0.1 on Windows to bypass IPv6 DNS stall
  let normalized = rawEnvUrl;
  if (normalized.includes('localhost:8000')) {
    normalized = normalized.replace('localhost:8000', '127.0.0.1:8000');
  }

  // Prevent mixed-content / localhost Network Error when deployed on Vercel or production HTTPS
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    (normalized.includes('localhost') || normalized.includes('127.0.0.1'))
  ) {
    return '/api/v1';
  }

  const trimmed = normalized.replace(/\/+$/, '');
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
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage or sessionStorage & strip trailing slashes to avoid Vercel rewrite misses
apiClient.interceptors.request.use((config) => {
  if (config.url && typeof config.url === 'string' && config.url.length > 1 && config.url.endsWith('/')) {
    config.url = config.url.replace(/\/+$/, '');
  }
  try {
    const token =
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
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
  (response) => {
    // If a reverse proxy or SPA router accidentally returns index.html for an API endpoint, reject it as an error
    if (
      typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!DOCTYPE') || response.data.trim().startsWith('<html')) &&
      (response.config?.url?.includes('/auth/') || response.config?.url?.includes('/tickets/'))
    ) {
      const err = new Error('API server returned HTML instead of JSON.');
      err.response = { status: 502, data: { detail: 'API server unreachable or returned HTML.' } };
      return Promise.reject(err);
    }
    return response;
  },
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

      if (refreshToken && !isTokenExpired(refreshToken)) {
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
            { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
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

    if (status === 403 && !isAuthEndpoint) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(AUTH_FORBIDDEN_EVENT, {
            detail: {
              url: requestUrl,
              status: 403,
              message: error.response?.data?.detail || 'Forbidden',
            },
          })
        );
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
