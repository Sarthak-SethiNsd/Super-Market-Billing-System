import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Role, UserSession } from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthContextType {
  role: Role;
  isAdmin: boolean;
  username?: string;
  isLoading: boolean;
  token: string | null;
  setAdminToken: (token: string) => Promise<void>;
  clearAdminSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const defaultSession: UserSession = {
  authenticated: false,
  role: 'STAFF',
  canAdmin: false,
};

const AuthContext = createContext<AuthContextType>({
  role: 'STAFF',
  isAdmin: false,
  isLoading: true,
  token: null,
  setAdminToken: async () => {},
  clearAdminSession: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(defaultSession);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sms_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const serverSession = await authService.getSession();
      setSession(serverSession);
      // If token expired on server, wipe local storage
      if (!serverSession.authenticated && localStorage.getItem('sms_admin_token')) {
        localStorage.removeItem('sms_admin_token');
        setToken(null);
      }
    } catch {
      // In case of backend offline, fallback safely to default Staff
      setSession(defaultSession);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const setAdminToken = async (newToken: string) => {
    localStorage.setItem('sms_admin_token', newToken);
    setToken(newToken);
    await refreshSession();
  };

  const clearAdminSession = async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('sms_admin_token');
      setToken(null);
      setSession(defaultSession);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role: session.role,
        isAdmin: session.canAdmin,
        username: session.username,
        isLoading,
        token,
        setAdminToken,
        clearAdminSession,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
