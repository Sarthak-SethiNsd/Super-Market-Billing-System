import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { UserSession, UnlockResponse } from '@/types/auth';

export const authService = {
  /**
   * Retrieves active session details from GET /api/auth/session
   * (Returns Staff mode if no token, or Admin if valid token)
   */
  async getSession(): Promise<UserSession> {
    const res = await apiClient.get<ApiResponse<UserSession>>('/api/auth/session');
    return res.data.data;
  },

  /**
   * Unlocks administrative access via POST /api/auth/admin/unlock
   */
  async unlockAdmin(password: string): Promise<UnlockResponse> {
    const res = await apiClient.post<ApiResponse<UnlockResponse>>('/api/auth/admin/unlock', { password });
    return res.data.data;
  },

  /**
   * Invalidates admin session via POST /api/auth/logout
   */
  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<{ loggedOut: boolean }>>('/api/auth/logout');
  },
};
