import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

import reportsAPI from '../../api/reports';
import locationsAPI from '../../api/locations';
import categoriesAPI from '../../api/categories';
import suppliersAPI from '../../api/suppliers';

import {
  FileBarChart,
  Download,
  Filter,
  RefreshCw,
  AlertCircle,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movements' | 'inward' | 'outward'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter master data
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Report data states
  const [stockReport, setStockReport] = useState([]);
  const [movementsReport, setMovementsReport] = useState([]);
  const [inwardReport, setInwardReport] = useState([]);
  const [outwardReport, setOutwardReport] = useState([]);

  // Filters state
  const [filters, setFilters] = useState({
    location_id: '',
    category_id: '',
    supplier_id: '',
    movement_type: '',
    from_date: '',
    to_date: '',
  });

  // Load master data for filter dropdowns
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [locsRes, catsRes, supsRes] = await Promise.all([
          locationsAPI.listLocations().catch(() => []),
          categoriesAPI.listCategories().catch(() => []),
          suppliersAPI.listSuppliers().catch(() => []),
        ]);
        setLocations(Array.isArray(locsRes) ? locsRes : []);
        setCategories(Array.isArray(catsRes) ? catsRes : []);
        setSuppliers(Array.isArray(supsRes) ? supsRes : []);
      } catch (err) {
        console.error('Failed to load filter options', err);
      }
    };
    loadMasters();
  }, []);

  // Fetch report data on tab or filter change
  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = { ...filters };
      // Clean up empty filters
      Object.keys(activeFilters).forEach((key) => {
        if (!activeFilters[key]) delete activeFilters[key];
      });

      if (activeTab === 'stock') {
        const res = await reportsAPI.getStockReport(activeFilters);
        setStockReport(Array.isArray(res) ? res : []);
      } else if (activeTab === 'movements') {
        const res = await reportsAPI.getMovementsReport(activeFilters);
        setMovementsReport(Array.isArray(res) ? res : []);
      } else if (activeTab === 'inward') {
        const res = await reportsAPI.getInwardReport(activeFilters);
        setInwardReport(Array.isArray(res) ? res : []);
      } else if (activeTab === 'outward') {
        const res = await reportsAPI.getOutwardReport(activeFilters);
        setOutwardReport(Array.isArray(res) ? res : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleResetFilter = () => {
    setFilters({
      location_id: '',
      category_id: '',
      supplier_id: '',
      movement_type: '',
      from_date: '',
      to_date: '',
    });
  };

  // CSV Exporter
  const exportToCSV = () => {
    let rows = [];
    let filename = `report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'stock') {
      rows = stockReport.map((item) => ({
        'Item Code': item.item_code,
        'Item Name': item.item_name,
        Category: item.category_name || 'N/A',
        Location: item.location_name || 'N/A',
        'Quantity On Hand': item.quantity_on_hand,
        WAC: item.wac,
        'Stock Value': item.stock_value,
        'Min Level': item.minimum_level,
        Status: item.stock_status,
      }));
    } else if (activeTab === 'movements') {
      rows = movementsReport.map((item) => ({
        'Transaction ID': item.transaction_id,
        Timestamp: item.timestamp,
        Item: item.item_name,
        Location: item.location_name,
        Type: item.movement_type,
        Quantity: item.quantity,
        Reference: item.reference_no || 'N/A',
        Remarks: item.remarks || '',
      }));
    } else if (activeTab === 'inward') {
      rows = inwardReport.map((item) => ({
        'Inward No': item.inward_no,
        Date: item.inward_date,
        Item: item.item_name,
        Supplier: item.supplier_name || 'N/A',
        Location: item.location_name,
        Quantity: item.quantity,
        'Unit Cost': item.unit_cost,
        'Total Cost': item.total_cost,
        'Invoice No': item.invoice_no || 'N/A',
      }));
    } else if (activeTab === 'outward') {
      rows = outwardReport.map((item) => ({
        'Outward No': item.outward_no,
        Date: item.outward_date,
        Item: item.item_name,
        Location: item.location_name,
        Quantity: item.quantity,
        'Issued To': item.issued_to || item.recipient || 'N/A',
        Purpose: item.purpose || 'N/A',
        'Unit Cost': item.unit_cost_used || 0,
        'Total Cost': item.total_cost || 0,
      }));
    }

    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]).join(',');
    const escapeVal = (v) => {
      const str = v === null || v === undefined ? '' : String(v);
      return `"${str.replace(/"/g, '""')}"`;
    };
    const csvContent = [
      headers,
      ...rows.map((r) => Object.values(r).map(escapeVal).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Columns for Stock Report
  const stockColumns = [
    {
      header: 'Item Code',
      key: 'item_code',
      render: (r) => <code>{r.item_code}</code>,
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (r) => <strong>{r.item_name}</strong>,
    },
    { header: 'Category', key: 'category_name', render: (r) => r.category_name || '—' },
    { header: 'Location', key: 'location_name', render: (r) => r.location_name || '—' },
    {
      header: 'On-Hand Stock',
      key: 'quantity_on_hand',
      render: (r) => <span>{Number(r.quantity_on_hand)} units</span>,
    },
    {
      header: 'WAC Unit Cost',
      key: 'wac',
      render: (r) => <span>₹{Number(r.wac).toFixed(2)}</span>,
    },
    {
      header: 'Stock Valuation',
      key: 'stock_value',
      render: (r) => <strong>₹{Number(r.stock_value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>,
    },
    {
      header: 'Status',
      key: 'stock_status',
      render: (r) => {
        const isOut = r.stock_status === 'OUT_OF_STOCK';
        const isLow = r.stock_status === 'LOW_STOCK';
        const variant = isOut ? 'error' : isLow ? 'warning' : 'success';
        return <Badge variant={variant}>{r.stock_status}</Badge>;
      },
    },
  ];

  // Columns for Movements Report
  const movementColumns = [
    { header: 'TX ID', key: 'transaction_id', render: (r) => <code>#{r.transaction_id}</code> },
    {
      header: 'Date & Time',
      key: 'timestamp',
      render: (r) => (r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'),
    },
    { header: 'Item', key: 'item_name', render: (r) => <strong>{r.item_name}</strong> },
    { header: 'Location', key: 'location_name' },
    {
      header: 'Type',
      key: 'movement_type',
      render: (r) => <Badge variant="primary">{r.movement_type}</Badge>,
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>{Number(r.quantity)}</span>
      ),
    },
    { header: 'Reference', key: 'reference_no', render: (r) => <code>{r.reference_no || '—'}</code> },
    { header: 'Remarks', key: 'remarks', render: (r) => r.remarks || '—' },
  ];

  // Columns for Inward Report
  const inwardColumns = [
    { header: 'Inward Receipt #', key: 'inward_no', render: (r) => <code>{r.inward_no}</code> },
    { header: 'Receipt Date', key: 'inward_date' },
    { header: 'Item', key: 'item_name', render: (r) => <strong>{r.item_name}</strong> },
    { header: 'Supplier', key: 'supplier_name', render: (r) => r.supplier_name || '—' },
    { header: 'Location', key: 'location_name' },
    { header: 'Quantity Received', key: 'quantity', render: (r) => `${Number(r.quantity)} units` },
    { header: 'Unit Cost', key: 'unit_cost', render: (r) => `₹${Number(r.unit_cost).toFixed(2)}` },
    { header: 'Total Value', key: 'total_cost', render: (r) => <strong>₹{Number(r.total_cost).toLocaleString()}</strong> },
    { header: 'Invoice Ref', key: 'invoice_no', render: (r) => r.invoice_no || '—' },
  ];

  // Columns for Outward Report
  const outwardColumns = [
    { header: 'Outward Dispatch #', key: 'outward_no', render: (r) => <code>{r.outward_no}</code> },
    { header: 'Dispatch Date', key: 'outward_date' },
    { header: 'Item', key: 'item_name', render: (r) => <strong>{r.item_name}</strong> },
    { header: 'Source Location', key: 'location_name' },
    { header: 'Quantity Dispatched', key: 'quantity', render: (r) => `${Number(r.quantity)} units` },
    { header: 'Issued To / Recipient', key: 'issued_to', render: (r) => r.issued_to || r.recipient || '—' },
    { header: 'Purpose', key: 'purpose', render: (r) => r.purpose || '—' },
    { header: 'WAC Valuation', key: 'total_cost', render: (r) => r.total_cost ? `₹${Number(r.total_cost).toLocaleString()}` : '—' },
  ];

  return (
    <div className="reports-page">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate comprehensive inventory valuation, audit movements, receiving and dispatch reports"
        breadcrumbs={['Home', 'Reports']}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" icon={Download} onClick={exportToCSV}>
              Export CSV
            </Button>
            <Button variant="primary" icon={RefreshCw} onClick={fetchReport} loading={loading}>
              Refresh Data
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--neutral-200)',
          marginBottom: '1.5rem',
        }}
      >
        {[
          { id: 'stock', label: 'Stock Audit & Valuation', icon: Package },
          { id: 'movements', label: 'Movements Audit Ledger', icon: Layers },
          { id: 'inward', label: 'Inward Receiving Report', icon: ArrowDownLeft },
          { id: 'outward', label: 'Outward Issue Report', icon: ArrowUpRight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: isActive ? 'var(--primary-600)' : 'var(--neutral-600)',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters Form */}
      <Card style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleApplyFilter} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          {/* Location Filter */}
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>Location</label>
            <select
              value={filters.location_id}
              onChange={(e) => handleFilterChange('location_id', e.target.value)}
              className="input-field"
              style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--neutral-300)' }}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.location_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter for Stock */}
          {activeTab === 'stock' && (
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>Category</label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--neutral-300)' }}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Supplier Filter for Inward */}
          {activeTab === 'inward' && (
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>Supplier</label>
              <select
                value={filters.supplier_id}
                onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--neutral-300)' }}
              >
                <option value="">All Suppliers</option>
                {suppliers.map((sup) => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>
                    {sup.supplier_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Movement Type Filter for Movements */}
          {activeTab === 'movements' && (
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>Movement Type</label>
              <select
                value={filters.movement_type}
                onChange={(e) => handleFilterChange('movement_type', e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--neutral-300)' }}
              >
                <option value="">All Types</option>
                <option value="OPENING">OPENING</option>
                <option value="INWARD">INWARD</option>
                <option value="OUTWARD">OUTWARD</option>
                <option value="RETURN">RETURN</option>
                <option value="ADJUSTMENT">ADJUSTMENT</option>
              </select>
            </div>
          )}

          {/* Date Filters */}
          {['movements', 'inward', 'outward'].includes(activeTab) && (
            <>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>From Date</label>
                <input
                  type="date"
                  value={filters.from_date}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--neutral-300)' }}
                />
              </div>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>To Date</label>
                <input
                  type="date"
                  value={filters.to_date}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                  style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--neutral-300)' }}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button type="submit" variant="primary" icon={Filter}>
              Apply Filters
            </Button>
            <Button type="button" variant="secondary" onClick={handleResetFilter}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

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

      {/* Report Table Content */}
      <Card>
        {activeTab === 'stock' && (
          <Table
            columns={stockColumns}
            data={stockReport}
            emptyTitle="No stock report records"
            emptyDescription="Adjust filters or check database records."
          />
        )}
        {activeTab === 'movements' && (
          <Table
            columns={movementColumns}
            data={movementsReport}
            emptyTitle="No movement records found"
            emptyDescription="Try selecting a wider date range or clearing filters."
          />
        )}
        {activeTab === 'inward' && (
          <Table
            columns={inwardColumns}
            data={inwardReport}
            emptyTitle="No inward receipts found"
            emptyDescription="Inbound procurement records will appear here."
          />
        )}
        {activeTab === 'outward' && (
          <Table
            columns={outwardColumns}
            data={outwardReport}
            emptyTitle="No outward dispatches found"
            emptyDescription="Outbound dispatch logs will render here."
          />
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
