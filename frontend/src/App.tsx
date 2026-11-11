import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { HealthProvider } from '@/context/HealthContext';
import { Layout } from '@/components/layout/Layout';

// Page components
import { DashboardPage } from '@/pages/DashboardPage';
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
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="oop-concepts" element={<OopConceptsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HealthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
