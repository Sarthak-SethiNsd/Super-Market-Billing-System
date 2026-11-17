import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface StaffProtectedRouteProps {
  children: React.ReactNode;
}

export const StaffProtectedRoute: React.FC<StaffProtectedRouteProps> = ({ children }) => {
  const { isStaff, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-semibold text-[#777D76]">Checking session authorization...</p>
      </div>
    );
  }

  if (!isStaff) {
    // Unauthenticated: redirect directly to Staff Login screen, preserving intended destination
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
