import React, { useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HealthProvider } from '@/context/HealthContext';
import { Layout } from '@/components/layout/Layout';

// Application Homepage
import { HomePage } from '@/pages/HomePage';

// Internal Operations & System Management Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { StaffLoginPage } from '@/pages/StaffLoginPage';
import { StaffProtectedRoute } from '@/components/auth/StaffProtectedRoute';
import { ProductsPage } from '@/pages/ProductsPage';
import { BillingPage } from '@/pages/BillingPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AdminPage } from '@/pages/AdminPage';
import { OopConceptsPage } from '@/pages/OopConceptsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const STAFF_ROUTES = new Set([
  '/staff',
  '/dashboard',
  '/analytics',
  '/transactions',
  '/inventory',
  '/admin',
  '/staff/login',
  '/login'
]);

// Auto-lock staff session when clicking out of the staff management area into Customer Mode
const StaffSessionAutoLock: React.FC = () => {
  const location = useLocation();
  const { isStaff, logoutStaff } = useAuth();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;
    prevPathRef.current = currentPath;

    // If staff user was on a staff route and navigates to a customer/public route, immediately lock staff session
    if (isStaff && STAFF_ROUTES.has(prevPath) && !STAFF_ROUTES.has(currentPath)) {
      logoutStaff();
    }
  }, [location.pathname, isStaff, logoutStaff]);

  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HealthProvider>
          <StaffSessionAutoLock />
          <Routes>
            {/* 1. Public Customer-Facing Supermarket Company Website */}
            <Route path="/" element={<HomePage />} />

            {/* 2. Internal Staff Mode & Supermarket Operations Application */}
            <Route element={<Layout />}>
              {/* Dedicated Staff Login Entry Points */}
              <Route path="/staff/login" element={<StaffLoginPage />} />
              <Route path="/login" element={<StaffLoginPage />} />

              {/* Protected Staff Operations */}
              <Route
                path="/staff"
                element={
                  <StaffProtectedRoute>
                    <DashboardPage />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <StaffProtectedRoute>
                    <DashboardPage />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <StaffProtectedRoute>
                    <AdminPage />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <StaffProtectedRoute>
                    <AnalyticsPage />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <StaffProtectedRoute>
                    <TransactionsPage />
                  </StaffProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <StaffProtectedRoute>
                    <InventoryPage />
                  </StaffProtectedRoute>
                }
              />

              {/* Public Customer & Operational Routes */}
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/oop-concepts" element={<OopConceptsPage />} />
              <Route path="/system-architecture" element={<OopConceptsPage />} />
            </Route>

            {/* 3. Fallback Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </HealthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
