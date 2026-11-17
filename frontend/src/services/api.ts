import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';

export const resolveApiBaseUrl = (): string => {
  // 1. Runtime override saved in browser (for billing terminals or remote servers)
  try {
    const saved = localStorage.getItem('sms_api_base_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch {}

  // 2. Window runtime config (for containerized or orchestrated deployments)
  if (typeof window !== 'undefined' && (window as unknown as { __APP_CONFIG__?: { API_BASE_URL?: string } }).__APP_CONFIG__?.API_BASE_URL) {
    return (window as unknown as { __APP_CONFIG__: { API_BASE_URL: string } }).__APP_CONFIG__.API_BASE_URL.replace(/\/+$/, '');
  }

  // 3. Vite build-time environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  // 4. Default to standard backend port
  return 'http://localhost:8080';
};

export let API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const updateApiBaseUrl = (newUrl: string): string => {
  const sanitized = newUrl.trim().replace(/\/+$/, '');
  localStorage.setItem('sms_api_base_url', sanitized);
  API_BASE_URL = sanitized;
  apiClient.defaults.baseURL = sanitized;
  return sanitized;
};

export const resetApiBaseUrl = (): string => {
  localStorage.removeItem('sms_api_base_url');
  API_BASE_URL = resolveApiBaseUrl();
  apiClient.defaults.baseURL = API_BASE_URL;
  return API_BASE_URL;
};

// Request interceptor: attach bearer token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('sms_staff_token') || localStorage.getItem('sms_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standardize error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.data?.error) {
      // Backend returned custom error format
      return Promise.reject(new Error(error.response.data.error));
    }
    if (error.response?.status === 401) {
      return Promise.reject(new Error('Unauthorized or session expired.'));
    }
    if (error.response?.status === 403) {
      return Promise.reject(new Error('Staff privileges required for this operation.'));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Backend connection timed out.'));
    }
    if (!error.response) {
      return Promise.reject(new Error('Cannot reach C++ backend server. Please verify it is running on ' + API_BASE_URL));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
