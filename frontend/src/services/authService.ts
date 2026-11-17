import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { UserSession, UnlockResponse } from '@/types/auth';

export const authService = {
  /**
   * Retrieves active session details from GET /api/auth/session
   * (Returns Customer Mode if unauthenticated, or Staff Mode if valid token)
   */
  async getSession(): Promise<UserSession> {
    const res = await apiClient.get<ApiResponse<UserSession>>('/api/auth/session');
    return res.data.data;
  },

  /**
   * Authenticates staff access via POST /api/auth/staff/login (or fallback to /api/auth/admin/unlock)
   */
  async loginStaff(password: string): Promise<UnlockResponse> {
    try {
      const res = await apiClient.post<ApiResponse<UnlockResponse>>('/api/auth/staff/login', { password });
      return res.data.data;
    } catch {
      const res = await apiClient.post<ApiResponse<UnlockResponse>>('/api/auth/admin/unlock', { password });
      return res.data.data;
    }
  },

  /**
   * Backward-compatible alias for staff login
   */
  async unlockAdmin(password: string): Promise<UnlockResponse> {
    return this.loginStaff(password);
  },

  /**
   * Invalidates staff session via POST /api/auth/logout
   */
  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<{ loggedOut: boolean }>>('/api/auth/logout');
  },
};
