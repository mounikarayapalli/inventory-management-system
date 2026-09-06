import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import SummaryCard from '../../components/dashboard/SummaryCard';
import StockAlertTable from '../../components/dashboard/StockAlertTable';
import RecentTransactions from '../../components/dashboard/RecentTransactions';
import CategoryStock from '../../components/dashboard/CategoryStock';
import LocationStock from '../../components/dashboard/LocationStock';
import dashboardAPI from '../../api/dashboard';

import { Activity, RefreshCw, AlertCircle } from 'lucide-react';

export const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [categoryStock, setCategoryStock] = useState([]);
  const [locationStock, setLocationStock] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes,
        lowStockRes,
        outOfStockRes,
        recentTxRes,
        catStockRes,
        locStockRes,
      ] = await Promise.all([
        dashboardAPI.getSummary().catch(() => null),
        dashboardAPI.getLowStock().catch(() => []),
        dashboardAPI.getOutOfStock().catch(() => []),
        dashboardAPI.getRecentTransactions(10).catch(() => []),
        dashboardAPI.getCategoryStock().catch(() => []),
        dashboardAPI.getLocationStock().catch(() => []),
      ]);

      if (summaryRes) {
        setSummary(summaryRes);
      }

      // Format stock alerts table
      const formattedLow = (lowStockRes || []).map((item) => ({
        id: `low-${item.item_id}-${item.location_id || 'all'}`,
        itemName: item.item_name,
        itemCode: item.sku,
        location: item.location_name || 'All Locations',
        availableStock: Number(item.current_quantity || 0),
        minimumLevel: item.min_stock_level,
        status: 'Low Stock',
      }));

      const formattedOut = (outOfStockRes || []).map((item) => ({
        id: `out-${item.item_id}-${item.location_id || 'all'}`,
        itemName: item.item_name,
        itemCode: item.sku,
        location: item.location_name || 'All Locations',
        availableStock: 0,
        minimumLevel: 0,
        status: 'Out of Stock',
      }));

      setStockAlerts([...formattedOut, ...formattedLow]);

      // Format recent transactions
      const formattedTx = (recentTxRes || []).map((tx) => ({
        id: tx.id,
        transactionType: tx.transaction_type,
        reference: tx.reference_no || `TX-${tx.id}`,
        itemName: tx.item_name,
        location: tx.location_name || '—',
        quantity: ['INWARD', 'OPENING', 'RETURN'].includes(tx.transaction_type)
          ? `+${Number(tx.quantity)}`
          : `-${Number(tx.quantity)}`,
        date: tx.timestamp ? new Date(tx.timestamp).toLocaleString() : '—',
        status: 'COMPLETED',
      }));
      setRecentTransactions(formattedTx);

      // Format category stock
      const formattedCat = (catStockRes || []).map((c) => ({
        id: c.category_id,
        categoryName: c.category_name,
        totalItems: c.item_count,
        availableStock: `${Number(c.total_units || 0)} units`,
        stockValue: `₹${Number(c.total_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }));
      setCategoryStock(formattedCat);

      // Format location stock
      const formattedLoc = (locStockRes || []).map((l) => ({
        id: l.location_id,
        locationName: l.location_name,
        itemsCount: l.location_code || 'Warehouse',
        availableStock: `${Number(l.total_units || 0)} units`,
        stockValue: `₹${Number(l.total_valuation || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }));
      setLocationStock(formattedLoc);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const summaryMetricsCards = [
    {
      id: 'total_items',
      label: 'Total Items Catalog',
      value: summary ? summary.total_items : '—',
      subtext: 'Active SKUs across catalog',
      icon: 'Package',
      color: 'primary',
    },
    {
      id: 'total_stock',
      label: 'On-Hand Stock Volume',
      value: summary ? `${Number(summary.total_stock_units || 0).toLocaleString()} units` : '—',
      subtext: 'Aggregate units stored',
      icon: 'Warehouse',
      color: 'info',
    },
    {
      id: 'stock_value',
      label: 'Total Stock Valuation',
      value: summary ? `₹${Number(summary.total_stock_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
      subtext: 'Total inventory asset value',
      icon: 'IndianRupee',
      color: 'success',
    },
    {
      id: 'low_stock_count',
      label: 'Low Stock Alerts',
      value: summary ? summary.low_stock_count : '—',
      subtext: 'Items below threshold',
      icon: 'ArrowDownLeft',
      color: 'warning',
    },
  ];

  return (
    <div className="dashboard-page">
      {/* 1. Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of inventory, stock status and recent activity."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--neutral-300)',
                background: 'var(--neutral-0)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
              Refresh
            </button>
            <Badge variant="primary" icon={Activity}>
              Live System Active
            </Badge>
          </div>
        }
      />

      {error && (
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: 'var(--error-50, #fef2f2)',
          border: '1px solid var(--error-200, #fecaca)',
          color: 'var(--error-700, #b91c1c)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Summary Cards Grid */}
      <div className="dashboard-summary-grid">
        {summaryMetricsCards.map((metric) => (
          <SummaryCard
            key={metric.id}
            label={metric.label}
            value={loading ? '...' : metric.value}
            subtext={metric.subtext}
            icon={metric.icon}
            color={metric.color}
          />
        ))}
      </div>

      {/* 3. Stock Alerts Section */}
      <div className="dashboard-section">
        <StockAlertTable alerts={stockAlerts} />
      </div>

      {/* 4. Recent Transactions Section */}
      <div className="dashboard-section">
        <RecentTransactions transactions={recentTransactions} />
      </div>

      {/* 5. Category Stock & Location Stock Dual Grid */}
      <div className="dashboard-dual-grid">
        <CategoryStock categoryData={categoryStock} />
        <LocationStock locationData={locationStock} />
      </div>
    </div>
  );
};

export default DashboardPage;
