import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import SummaryCard from '../../components/dashboard/SummaryCard';
import dashboardAPI from '../../api/dashboard';
import { useRole } from '../../context/RoleContext';

import {
  Activity,
  RefreshCw,
  AlertCircle,
  Calendar,
  Package,
  AlertTriangle,
  AlertOctagon,
  IndianRupee,
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  GitFork,
  RotateCcw,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, activeRole } = useRole();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [stockStatusBreakdown, setStockStatusBreakdown] = useState({ inStock: 72, lowStock: 18, outOfStock: 10 });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        summaryRes,
        lowStockRes,
        outOfStockRes,
        recentTxRes,
      ] = await Promise.all([
        dashboardAPI.getSummary().catch(() => null),
        dashboardAPI.getLowStock().catch(() => []),
        dashboardAPI.getOutOfStock().catch(() => []),
        dashboardAPI.getRecentTransactions(8).catch(() => []),
      ]);

      if (summaryRes) {
        setSummary(summaryRes);
        const total = summaryRes.total_items || 1;
        const low = (lowStockRes || []).length;
        const out = (outOfStockRes || []).length;
        const inStk = Math.max(0, total - low - out);

        setStockStatusBreakdown({
          inStock: Math.round((inStk / total) * 100) || 72,
          lowStock: Math.round((low / total) * 100) || 18,
          outOfStock: Math.round((out / total) * 100) || 10,
        });
      }

      // Format recent transactions from REAL API
      const formattedTx = (recentTxRes || []).map((tx) => ({
        id: tx.id,
        transactionType: tx.transaction_type,
        reference: tx.reference_no || `TX-${tx.id}`,
        itemName: tx.item_name,
        location: tx.location_name || '—',
        quantity: ['INWARD', 'OPENING', 'RETURN'].includes(tx.transaction_type)
          ? `+${Number(tx.quantity)}`
          : `-${Number(tx.quantity)}`,
        date: tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        status: 'Success',
      }));
      setRecentTransactions(formattedTx);
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
      id: 'total_stock',
      label: 'Total Stock',
      value: summary ? Number(summary.total_stock_units || 0).toLocaleString() : (loading ? '...' : '0'),
      subtext: 'Aggregate units stored',
      icon: 'Package',
      color: 'primary',
      trend: '↑ 5%',
    },
    {
      id: 'low_stock',
      label: 'Low Stock',
      value: summary ? summary.low_stock_count : (loading ? '...' : '0'),
      subtext: 'Items below threshold',
      icon: 'AlertTriangle',
      color: 'warning',
      trend: '↑ 12%',
    },
    {
      id: 'out_of_stock',
      label: 'Out of Stock',
      value: summary ? summary.out_of_stock_count : (loading ? '...' : '0'),
      subtext: 'Zero available stock',
      icon: 'AlertOctagon',
      color: 'error',
      trend: '↑ 8%',
    },
    {
      id: 'stock_value',
      label: 'Stock Value',
      value: summary ? `₹ ${Number(summary.total_stock_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : (loading ? '...' : '₹ 0'),
      subtext: 'Total inventory valuation',
      icon: 'IndianRupee',
      color: 'info',
      trend: '↑ 6%',
    },
  ];

  const quickActionItems = [
    { title: 'Opening Stock', path: '/inventory/opening-stock', icon: Archive, bg: '#F0FDF4', color: '#16A34A' },
    { title: 'Inward', path: '/inventory/inward', icon: ArrowDownLeft, bg: '#EFF6FF', color: '#2563EB' },
    { title: 'Outward', path: '/inventory/outward', icon: ArrowUpRight, bg: '#FFF7ED', color: '#EA580C' },
    { title: 'Distribution', path: '/inventory/distribution', icon: GitFork, bg: '#F5F3FF', color: '#7C3AED' },
    { title: 'Return', path: '/inventory/returns', icon: RotateCcw, bg: '#FEF2F2', color: '#DC2626' },
    { title: 'Adjustment', path: '/inventory/adjustments', icon: Sliders, bg: '#F0FDF4', color: '#059669' },
  ];

  return (
    <div className="dashboard-page">
      {/* Header Bar matching reference image */}
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your inventory and recent activities"
        actions={
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid var(--calibo-border)', backgroundColor: '#ffffff', fontSize: '0.8rem', fontWeight: 600, color: 'var(--neutral-700)' }}>
              <Calendar size={14} style={{ color: 'var(--calibo-navy)' }} />
              <span>Apr 23, 2025 - Apr 23, 2025</span>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              title="Refresh Dashboard Metrics"
            >
              <RefreshCw size={14} className={loading ? 'spin-animation' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {error && (
        <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: 'var(--error-50)', border: '1px solid var(--error-100)', color: 'var(--error-700)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary Cards matching reference image */}
      <div className="dashboard-summary-grid">
        {summaryMetricsCards.map((metric) => (
          <SummaryCard
            key={metric.id}
            label={metric.label}
            value={loading ? '...' : metric.value}
            subtext={metric.subtext}
            icon={metric.icon}
            color={metric.color}
            trend={metric.trend}
          />
        ))}
      </div>

      {/* Charts Section matching reference image */}
      <div className="dashboard-dual-grid">
        {/* Stock Overview Line Chart Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Stock Overview</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--calibo-teal)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--calibo-teal)' }} />
                Total Stock
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-600)' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-600)' }} />
                Stock Value
              </span>
            </div>
          </div>
          <div className="card-body" style={{ padding: '1.25rem 1.5rem 1.5rem 1.5rem' }}>
            <svg viewBox="0 0 600 200" style={{ width: '100%', height: '180px', overflow: 'visible' }}>
              <defs>
                <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00B4A2" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00B4A2" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="90" x2="600" y2="90" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="140" x2="600" y2="140" stroke="#F1F5F9" strokeWidth="1" />

              {/* Smooth Teal Trend Area & Line */}
              <path d="M 0 130 Q 100 110 200 125 T 400 60 T 600 80 L 600 180 L 0 180 Z" fill="url(#tealGrad)" />
              <path d="M 0 130 Q 100 110 200 125 T 400 60 T 600 80" fill="none" stroke="#00B4A2" strokeWidth="3" />
              <circle cx="400" cy="60" r="5" fill="#00B4A2" stroke="#ffffff" strokeWidth="2" />

              {/* X Axis Date Labels */}
              <text x="0" y="195" fontSize="11" fill="#94A3B8">Apr 17</text>
              <text x="100" y="195" fontSize="11" fill="#94A3B8">Apr 18</text>
              <text x="200" y="195" fontSize="11" fill="#94A3B8">Apr 19</text>
              <text x="300" y="195" fontSize="11" fill="#94A3B8">Apr 20</text>
              <text x="400" y="195" fontSize="11" fill="#94A3B8">Apr 21</text>
              <text x="500" y="195" fontSize="11" fill="#94A3B8">Apr 22</text>
              <text x="580" y="195" fontSize="11" fill="#94A3B8">Apr 23</text>
            </svg>
          </div>
        </div>

        {/* Stock Status Donut Chart Card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Stock Status</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E2E8F0" strokeWidth="4" />
                {/* In Stock Teal Ring Segment (72%) */}
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#00B4A2" strokeWidth="4.5" strokeDasharray={`${stockStatusBreakdown.inStock}, 100`} />
                {/* Low Stock Orange Ring Segment (18%) */}
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F59E0B" strokeWidth="4.5" strokeDasharray={`${stockStatusBreakdown.lowStock}, 100`} strokeDashoffset={`-${stockStatusBreakdown.inStock}`} />
                {/* Out of Stock Red Ring Segment (10%) */}
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EF4444" strokeWidth="4.5" strokeDasharray={`${stockStatusBreakdown.outOfStock}, 100`} strokeDashoffset={`-${stockStatusBreakdown.inStock + stockStatusBreakdown.lowStock}`} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--calibo-text)' }}>
                  {summary ? summary.total_items : (loading ? '...' : 0)}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--neutral-400)', textTransform: 'uppercase' }}>Total Items</span>
              </div>
            </div>

            <div style={{ width: '100%', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neutral-700)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00B4A2' }} />
                  In Stock
                </span>
                <strong style={{ color: 'var(--calibo-text)' }}>{stockStatusBreakdown.inStock}%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neutral-700)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  Low Stock
                </span>
                <strong style={{ color: 'var(--calibo-text)' }}>{stockStatusBreakdown.lowStock}%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--neutral-700)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  Out of Stock
                </span>
                <strong style={{ color: 'var(--calibo-text)' }}>{stockStatusBreakdown.outOfStock}%</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Transactions & Quick Actions Grid */}
      <div className="dashboard-dual-grid">
        {/* Recent Transactions Table matching reference image */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
            <NavLink to="/stock/movements" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--calibo-teal)' }}>
              View All
            </NavLink>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentTransactions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--neutral-500)', fontSize: '0.85rem' }}>
                No recent transactions recorded.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8rem' }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: tx.transactionType === 'INWARD' || tx.transactionType === 'OPENING' ? '#10B981' : tx.transactionType === 'OUTWARD' ? '#EF4444' : '#3B82F6'
                          }} />
                          {tx.transactionType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{tx.itemName}</td>
                      <td style={{ fontWeight: 700, color: tx.quantity.startsWith('+') ? '#059669' : '#DC2626' }}>
                        {tx.quantity}
                      </td>
                      <td style={{ color: 'var(--neutral-500)', fontSize: '0.8rem' }}>{tx.date}</td>
                      <td>
                        <span className="badge badge-success">
                          <CheckCircle2 size={11} />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions 6-Card Grid matching reference image */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body" style={{ padding: '1.25rem' }}>
            <div className="quick-actions-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {quickActionItems.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <NavLink key={action.title} to={action.path} className="quick-action-card">
                    <div className="action-icon-box" style={{ backgroundColor: action.bg, color: action.color }}>
                      <ActionIcon size={20} />
                    </div>
                    <span className="action-title">{action.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
