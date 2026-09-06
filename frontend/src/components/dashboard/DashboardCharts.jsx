import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import Card from '../common/Card';
import { BarChart3, PieChart as PieIcon, TrendingUp, MapPin } from 'lucide-react';

const COLORS = {
  primary: '#1E2B88',
  teal: '#00B4A2',
  navy: '#0D1527',
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0284c7',
  neutral: '#64748b',
};

const PIE_STATUS_COLORS = {
  'In Stock': '#16a34a',
  'Low Stock': '#d97706',
  'Out of Stock': '#dc2626',
};

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid var(--neutral-200)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontSize: '0.8rem',
        }}
      >
        {label && <strong style={{ color: 'var(--neutral-900)', display: 'block', marginBottom: '0.25rem' }}>{label}</strong>}
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ color: entry.color || 'var(--neutral-700)', margin: '0.15rem 0' }}>
            <span>{entry.name}: </span>
            <strong style={{ fontWeight: 700 }}>
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ChartSkeleton = ({ height = 280 }) => (
  <div
    style={{
      width: '100%',
      height,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}
  >
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        backgroundColor: 'var(--neutral-100, #f1f5f9)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        padding: '1.5rem 1rem 0.5rem 1rem',
        gap: '0.75rem',
        opacity: 0.7,
      }}
    >
      <div style={{ width: '12%', height: '40%', backgroundColor: 'var(--neutral-200, #e2e8f0)', borderRadius: '4px' }} />
      <div style={{ width: '12%', height: '80%', backgroundColor: 'var(--neutral-300, #cbd5e1)', borderRadius: '4px' }} />
      <div style={{ width: '12%', height: '35%', backgroundColor: 'var(--neutral-200, #e2e8f0)', borderRadius: '4px' }} />
      <div style={{ width: '12%', height: '60%', backgroundColor: 'var(--neutral-300, #cbd5e1)', borderRadius: '4px' }} />
      <div style={{ width: '12%', height: '90%', backgroundColor: 'var(--neutral-200, #e2e8f0)', borderRadius: '4px' }} />
      <div style={{ width: '12%', height: '50%', backgroundColor: 'var(--neutral-300, #cbd5e1)', borderRadius: '4px' }} />
    </div>
  </div>
);

export const DashboardCharts = ({
  categoryData = [],
  locationData = [],
  summary = null,
  recentMovements = [],
  loading = false,
}) => {
  // 1. Format Category Chart Data
  const categoryChartData = (categoryData || []).map((cat) => ({
    categoryName: cat.category_name || cat.categoryName || 'Uncategorized',
    availableUnits: Number(cat.total_units || (cat.availableStock ? parseFloat(cat.availableStock) : 0)),
    stockValue: Number(cat.total_valuation || (cat.stockValue ? parseFloat(cat.stockValue.replace(/[^0-9.-]+/g, '')) : 0)),
  }));

  // 2. Format Location Comparison Chart Data
  const locationChartData = (locationData || []).map((loc) => ({
    locationName: loc.location_name || loc.locationName || 'Warehouse',
    availableUnits: Number(loc.total_units || (loc.availableStock ? parseFloat(loc.availableStock) : 0)),
    stockValue: Number(loc.total_valuation || (loc.stockValue ? parseFloat(loc.stockValue.replace(/[^0-9.-]+/g, '')) : 0)),
  }));

  // 3. Format Stock Status Pie Data
  const totalItemsCount = summary ? summary.total_items : (categoryChartData.reduce((acc, curr) => acc + (curr.availableUnits > 0 ? 1 : 0), 0) || 1);
  const lowStockCount = summary ? summary.low_stock_count : 0;
  const outOfStockCount = summary ? summary.out_of_stock_count : 0;
  const inStockCount = Math.max(0, totalItemsCount - lowStockCount - outOfStockCount);

  const statusPieData = [
    { name: 'In Stock', value: inStockCount },
    { name: 'Low Stock', value: lowStockCount },
    { name: 'Out of Stock', value: outOfStockCount },
  ].filter((d) => d.value > 0);

  // 4. Format Movement History Trend Data
  const movementsByDateMap = new Map();
  (recentMovements || []).forEach((mv) => {
    const rawDate = mv.timestamp || mv.movement_date || mv.created_at;
    const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today';
    
    if (!movementsByDateMap.has(dateStr)) {
      movementsByDateMap.set(dateStr, { date: dateStr, Inward: 0, Outward: 0, Distribution: 0, Returns: 0 });
    }
    const entry = movementsByDateMap.get(dateStr);
    const qty = Math.abs(Number(mv.quantity || 0));
    const type = (mv.transaction_type || mv.movement_type || '').toUpperCase();

    if (type.includes('INWARD') || type.includes('RECEIPT') || type.includes('OPENING')) {
      entry.Inward += qty;
    } else if (type.includes('OUTWARD') || type.includes('DISPATCH') || type.includes('ISSUE')) {
      entry.Outward += qty;
    } else if (type.includes('DISTRIBUTION')) {
      entry.Distribution += qty;
    } else if (type.includes('RETURN')) {
      entry.Returns += qty;
    }
  });

  const movementTrendData = Array.from(movementsByDateMap.values()).reverse();

  return (
    <div className="dashboard-charts-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
      {/* Row 1: Stock by Category & Stock Status Distribution */}
      <div className="dashboard-dual-grid">
        {/* Category Stock Distribution Bar Chart */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} className="text-primary-600" />
              <span>Stock & Valuation by Category</span>
            </div>
          }
          subtitle="Real-time available stock volume and total asset valuation per category"
        >
          <div style={{ width: '100%', height: 280, paddingTop: '0.5rem' }}>
            {loading ? (
              <ChartSkeleton />
            ) : categoryChartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem' }}>
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-200)" />
                  <XAxis
                    dataKey="categoryName"
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                    tick={{ fontSize: 10.5, fill: 'var(--neutral-700)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis yAxisId="units" orientation="left" tick={{ fontSize: 12, fill: 'var(--neutral-600)' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="value" orientation="right" tick={{ fontSize: 11, fill: 'var(--neutral-500)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip content={<CustomTooltip formatter={(val, name) => (name.includes('Valuation') ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `${val} units`)} />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
                  <Bar yAxisId="units" dataKey="availableUnits" name="Available Units" fill={COLORS.teal} radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar yAxisId="value" dataKey="stockValue" name="Stock Valuation (₹)" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Stock Status Pie/Donut Chart */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieIcon size={18} className="text-primary-600" />
              <span>Stock Status Distribution</span>
            </div>
          }
          subtitle="Inventory threshold health breakdown across active SKUs"
        >
          <div style={{ width: '100%', height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? (
              <ChartSkeleton />
            ) : statusPieData.length === 0 ? (
              <div style={{ color: 'var(--neutral-400)', fontSize: '0.85rem' }}>No status data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_STATUS_COLORS[entry.name] || COLORS.primary} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(val) => `${val} SKUs`} />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Row 2: Stock by Location Comparison & Inventory Movement Trends */}
      <div className="dashboard-dual-grid">
        {/* Warehouse Location Comparison Bar Chart */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} className="text-primary-600" />
              <span>Stock by Location Comparison</span>
            </div>
          }
          subtitle="Comparing warehouse storage volume (Vijayawada Hub vs. Vizag Hub)"
        >
          <div style={{ width: '100%', height: 280, paddingTop: '0.5rem' }}>
            {loading ? (
              <ChartSkeleton />
            ) : locationChartData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem' }}>
                No location data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-200)" />
                  <XAxis dataKey="locationName" interval={0} tick={{ fontSize: 11, fill: 'var(--neutral-700)' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="units" tick={{ fontSize: 12, fill: 'var(--neutral-600)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={(val, name) => (name.includes('Valuation') ? `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : `${val} units`)} />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
                  <Bar yAxisId="units" dataKey="availableUnits" name="Stock Units" fill={COLORS.navy} radius={[4, 4, 0, 0]} barSize={34} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Inventory Movement Trends (Inward vs Outward) Area Chart */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} className="text-primary-600" />
              <span>Inward vs. Outward Movement Trend</span>
            </div>
          }
          subtitle="Real-time transaction volume movements logged in stock ledger"
        >
          <div style={{ width: '100%', height: 280, paddingTop: '0.5rem' }}>
            {loading ? (
              <ChartSkeleton />
            ) : movementTrendData.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--neutral-400)', fontSize: '0.85rem' }}>
                No recent movement trend data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={movementTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inwardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outwardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.error} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={COLORS.error} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neutral-200)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--neutral-600)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--neutral-600)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip formatter={(val) => `${val} units`} />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '0.8rem' }} />
                  <Area type="monotone" dataKey="Inward" name="Inward Movements (+)" stroke={COLORS.teal} fillOpacity={1} fill="url(#inwardGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Outward" name="Outward Movements (-)" stroke={COLORS.error} fillOpacity={1} fill="url(#outwardGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
