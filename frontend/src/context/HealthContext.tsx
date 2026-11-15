import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ConnectionState, HealthData } from '@/types/health';
import { healthService } from '@/services/healthService';
import { API_BASE_URL, updateApiBaseUrl, resetApiBaseUrl } from '@/services/api';

interface HealthContextType {
  status: ConnectionState;
  healthData: HealthData | null;
  latencyMs: number | null;
  errorMessage: string | null;
  apiUrl: string;
  lastChecked: Date | null;
  checkHealth: (targetUrl?: string) => Promise<boolean>;
  updateUrl: (newUrl: string) => Promise<boolean>;
  resetUrl: () => Promise<void>;
}

const HealthContext = createContext<HealthContextType>({
  status: 'checking',
  healthData: null,
  latencyMs: null,
  errorMessage: null,
  apiUrl: API_BASE_URL,
  lastChecked: null,
  checkHealth: async () => false,
  updateUrl: async () => false,
  resetUrl: async () => {},
});

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>(API_BASE_URL);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async (targetUrl?: string): Promise<boolean> => {
    try {
      const res = await healthService.checkHealth(targetUrl);
      setHealthData(res.data);
      setLatencyMs(res.latencyMs);
      setStatus('connected');
      setErrorMessage(null);
      return true;
    } catch (err: unknown) {
      setStatus('disconnected');
      setHealthData(null);
      setLatencyMs(null);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Cannot establish connection to backend server.');
      }
      return false;
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  const updateUrl = useCallback(async (newUrl: string): Promise<boolean> => {
    const sanitized = updateApiBaseUrl(newUrl);
    setApiUrl(sanitized);
    setStatus('checking');
    return await checkHealth();
  }, [checkHealth]);

  const resetUrl = useCallback(async () => {
    const defaulted = resetApiBaseUrl();
    setApiUrl(defaulted);
    setStatus('checking');
    await checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    checkHealth();
    const intervalMs = Number(import.meta.env.VITE_HEALTH_CHECK_INTERVAL_MS) || 15000;
    const timer = setInterval(() => {
      checkHealth();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [checkHealth]);

  return (
    <HealthContext.Provider
      value={{
        status,
        healthData,
        latencyMs,
        errorMessage,
        apiUrl,
        lastChecked,
        checkHealth,
        updateUrl,
        resetUrl,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => useContext(HealthContext);
