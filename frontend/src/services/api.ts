import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor: attach bearer token if present
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('sms_admin_token');
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
      return Promise.reject(new Error('Admin privileges required for this operation.'));
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
