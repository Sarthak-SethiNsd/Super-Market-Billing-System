import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConnectionState, HealthData } from '@/types/health';
import { healthService } from '@/services/healthService';

interface HealthContextType {
  status: ConnectionState;
  healthData: HealthData | null;
  lastChecked: Date | null;
  checkHealth: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType>({
  status: 'checking',
  healthData: null,
  lastChecked: null,
  checkHealth: async () => {},
});

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const data = await healthService.checkHealth();
      setHealthData(data);
      setStatus('connected');
    } catch {
      setStatus('disconnected');
      setHealthData(null);
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const intervalMs = Number(import.meta.env.VITE_HEALTH_CHECK_INTERVAL_MS) || 15000;
    const timer = setInterval(checkHealth, intervalMs);
    return () => clearInterval(timer);
  }, [checkHealth]);

  return (
    <HealthContext.Provider value={{ status, healthData, lastChecked, checkHealth }}>
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => useContext(HealthContext);
