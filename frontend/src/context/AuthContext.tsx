import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Role, UserSession } from '@/types/auth';
import { authService } from '@/services/authService';

interface AuthContextType {
  role: Role;
  isStaff: boolean;
  isAdmin: boolean; // Backward-compatible alias for isStaff
  username?: string;
  isLoading: boolean;
  token: string | null;
  loginStaff: (token: string) => Promise<void>;
  logoutStaff: () => Promise<void>;
  setAdminToken: (token: string) => Promise<void>;
  clearAdminSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const defaultSession: UserSession = {
  authenticated: false,
  role: 'CUSTOMER',
  canAdmin: false,
};

const AuthContext = createContext<AuthContextType>({
  role: 'CUSTOMER',
  isStaff: false,
  isAdmin: false,
  isLoading: true,
  token: null,
  loginStaff: async () => {},
  logoutStaff: async () => {},
  setAdminToken: async () => {},
  clearAdminSession: async () => {},
  refreshSession: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(defaultSession);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sms_staff_token') || localStorage.getItem('sms_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const serverSession = await authService.getSession();
      setSession(serverSession);
      // If token expired on server, wipe local storage
      if (!serverSession.authenticated) {
        localStorage.removeItem('sms_staff_token');
        localStorage.removeItem('sms_admin_token');
        setToken(null);
      }
    } catch {
      // In case of backend offline, fallback safely to Customer Mode
      setSession(defaultSession);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginStaff = useCallback(async (newToken: string) => {
    localStorage.setItem('sms_staff_token', newToken);
    localStorage.setItem('sms_admin_token', newToken);
    setToken(newToken);
    await refreshSession();
  }, [refreshSession]);

  const logoutStaff = useCallback(async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('sms_staff_token');
      localStorage.removeItem('sms_admin_token');
      setToken(null);
      setSession(defaultSession);
    }
  }, [token]);

  const isStaff = session.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        role: session.role,
        isStaff,
        isAdmin: isStaff, // Backward-compatible alias
        username: session.username,
        isLoading,
        token,
        loginStaff,
        logoutStaff,
        setAdminToken: loginStaff,
        clearAdminSession: logoutStaff,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
