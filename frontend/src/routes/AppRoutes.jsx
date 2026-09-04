import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AppLayout from '../components/layout/AppLayout';

// Auth Page
import LoginPage from '../pages/auth/LoginPage';

// Dashboard Page
import DashboardPage from '../pages/dashboard/DashboardPage';

// Master Pages
import ItemsPage from '../pages/masters/ItemsPage';
import CategoriesPage from '../pages/masters/CategoriesPage';
import SuppliersPage from '../pages/masters/SuppliersPage';
import LocationsPage from '../pages/masters/LocationsPage';

// Inventory Pages
import OpeningStockPage from '../pages/inventory/OpeningStockPage';
import InwardPage from '../pages/inventory/InwardPage';
import OutwardPage from '../pages/inventory/OutwardPage';
import DistributionPage from '../pages/inventory/DistributionPage';
import ReturnsPage from '../pages/inventory/ReturnsPage';
import AdjustmentsPage from '../pages/inventory/AdjustmentsPage';

// Stock Pages
import AvailableStockPage from '../pages/stock/AvailableStockPage';
import StockMovementsPage from '../pages/stock/StockMovementsPage';

// Reports & Users
import ReportsPage from '../pages/reports/ReportsPage';
import UsersPage from '../pages/users/UsersPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Application Shell Routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Master Routes */}
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/locations" element={<LocationsPage />} />

        {/* Inventory Transaction Routes */}
        <Route path="/inventory/opening-stock" element={<OpeningStockPage />} />
        <Route path="/inventory/inward" element={<InwardPage />} />
        <Route path="/inventory/outward" element={<OutwardPage />} />
        <Route path="/inventory/distribution" element={<DistributionPage />} />
        <Route path="/inventory/returns" element={<ReturnsPage />} />
        <Route path="/inventory/adjustments" element={<AdjustmentsPage />} />

        {/* Stock Routes */}
        <Route path="/stock" element={<AvailableStockPage />} />
        <Route path="/stock/movements" element={<StockMovementsPage />} />

        {/* Reports & Users */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* Catch-all redirect to Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
