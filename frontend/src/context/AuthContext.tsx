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
  const [token, setToken] = useState<string | null>(() => {
    try {
      // Clean up any legacy localStorage staff credentials so they never auto-authenticate across visits
      localStorage.removeItem('sms_staff_token');
      localStorage.removeItem('sms_admin_token');
      return sessionStorage.getItem('sms_staff_token') || sessionStorage.getItem('sms_admin_token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const clearSessionStorage = useCallback(() => {
    try {
      sessionStorage.removeItem('sms_staff_token');
      sessionStorage.removeItem('sms_admin_token');
      localStorage.removeItem('sms_staff_token');
      localStorage.removeItem('sms_admin_token');
    } catch {}
    setToken(null);
    setSession(defaultSession);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentToken = sessionStorage.getItem('sms_staff_token') || sessionStorage.getItem('sms_admin_token');
      if (!currentToken) {
        setSession(defaultSession);
        setToken(null);
        return;
      }
      const serverSession = await authService.getSession();
      setSession(serverSession);
      // If token expired on server, wipe local session storage
      if (!serverSession.authenticated) {
        clearSessionStorage();
      }
    } catch {
      // In case of backend offline, fallback safely to Customer Mode
      clearSessionStorage();
    } finally {
      setIsLoading(false);
    }
  }, [clearSessionStorage]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // When user leaves the page or tab loses visibility (switches tab, goes outside the website, minimizes),
  // immediately clear the staff session so returning requires re-authenticating with the staff password.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearSessionStorage();
      }
    };

    const handlePageHide = () => {
      clearSessionStorage();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [clearSessionStorage]);

  const loginStaff = useCallback(async (newToken: string) => {
    try {
      sessionStorage.setItem('sms_staff_token', newToken);
      sessionStorage.setItem('sms_admin_token', newToken);
      // Ensure localStorage has no token
      localStorage.removeItem('sms_staff_token');
      localStorage.removeItem('sms_admin_token');
    } catch {}
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
      clearSessionStorage();
    }
  }, [token, clearSessionStorage]);

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
