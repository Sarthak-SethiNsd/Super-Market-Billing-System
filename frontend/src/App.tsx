import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <HealthProvider>
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

              {/* Public Customer & Operational Routes */}
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
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
