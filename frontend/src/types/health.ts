export interface HealthData {
  status: 'UP' | 'DOWN';
  service: string;
  version: string;
  timestamp: number;
}

export type ConnectionState = 'checking' | 'connected' | 'disconnected';
