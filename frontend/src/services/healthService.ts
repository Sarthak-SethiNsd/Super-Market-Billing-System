import axios from 'axios';
import apiClient from './api';
import { HealthData } from '@/types/health';

export interface HealthCheckResult {
  data: HealthData;
  latencyMs: number;
}

export const healthService = {
  /**
   * Hits GET /api/health to verify C++ Crow REST backend status
   */
  async checkHealth(targetBaseUrl?: string): Promise<HealthCheckResult> {
    const start = performance.now();
    let res;
    if (targetBaseUrl) {
      const cleanUrl = targetBaseUrl.replace(/\/+$/, '');
      res = await axios.get(`${cleanUrl}/api/health`, {
        timeout: 10000,
        headers: { Accept: 'application/json' },
      });
    } else {
      res = await apiClient.get('/api/health');
    }
    const latencyMs = Math.round(performance.now() - start);

    // Robust parsing of both enveloped { success: true, data: {...} } and direct payloads
    const raw = res.data?.data ?? res.data;
    if (raw && (raw.status === 'UP' || raw.status === 'DOWN')) {
      return {
        data: raw as HealthData,
        latencyMs,
      };
    }
    throw new Error('Backend responded but returned an unexpected health payload format.');
  },
};
