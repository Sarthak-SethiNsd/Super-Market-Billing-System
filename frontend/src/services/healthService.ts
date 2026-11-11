import apiClient from './api';
import { ApiResponse } from '@/types/api';
import { HealthData } from '@/types/health';

export const healthService = {
  /**
   * Hits GET /api/health to verify C++ Crow REST backend status
   */
  async checkHealth(): Promise<HealthData> {
    const res = await apiClient.get<ApiResponse<HealthData>>('/api/health');
    return res.data.data;
  },
};
