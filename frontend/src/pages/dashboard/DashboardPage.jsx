import React from 'react';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import SummaryCard from '../../components/dashboard/SummaryCard';
import StockAlertTable from '../../components/dashboard/StockAlertTable';
import RecentTransactions from '../../components/dashboard/RecentTransactions';
import CategoryStock from '../../components/dashboard/CategoryStock';
import LocationStock from '../../components/dashboard/LocationStock';

import {
  MOCK_SUMMARY_METRICS,
  MOCK_STOCK_ALERTS,
  MOCK_RECENT_TRANSACTIONS,
  MOCK_CATEGORY_STOCK,
  MOCK_LOCATION_STOCK,
} from '../../constants/mockDashboardData';

import { Activity } from 'lucide-react';

export const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      {/* 1. Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of inventory, stock status and recent activity."
        actions={
          <Badge variant="primary" icon={Activity}>
            Live System Active
          </Badge>
        }
      />

      {/* 2. Summary Cards Grid */}
      <div className="dashboard-summary-grid">
        {MOCK_SUMMARY_METRICS.map((metric) => (
          <SummaryCard
            key={metric.id}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* 3. Stock Alerts Section */}
      <div className="dashboard-section">
        <StockAlertTable alerts={MOCK_STOCK_ALERTS} />
      </div>

      {/* 4. Recent Transactions Section */}
      <div className="dashboard-section">
        <RecentTransactions transactions={MOCK_RECENT_TRANSACTIONS} />
      </div>

      {/* 5. Category Stock & Location Stock Dual Grid */}
      <div className="dashboard-dual-grid">
        <CategoryStock categoryData={MOCK_CATEGORY_STOCK} />
        <LocationStock locationData={MOCK_LOCATION_STOCK} />
      </div>
    </div>
  );
};

export default DashboardPage;
