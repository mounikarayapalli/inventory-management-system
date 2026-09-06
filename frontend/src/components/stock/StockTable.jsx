import React from 'react';
import Table from '../common/Table';
import Button from '../common/Button';
import StockStatusBadge from './StockStatusBadge';
import { Eye, MapPin, Tag, Warehouse, ChevronRight } from 'lucide-react';

export const StockTable = ({ stockData = [], onViewDetails }) => {
  const columns = [
    {
      header: 'Item Code',
      key: 'item_code',
      render: (row) => (
        <code style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)' }}>
          {row.item_code}
        </code>
      ),
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name}</strong>,
    },
    {
      header: 'Category',
      key: 'category_name',
    },
    {
      header: 'Location',
      key: 'location_name',
    },
    {
      header: 'Available Qty',
      key: 'available_quantity',
      render: (row) => (
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {row.available_quantity} {row.unit}
        </span>
      ),
    },
    {
      header: 'WAC',
      key: 'wac',
      render: (row) => <span>₹{Number(row.wac).toFixed(2)}</span>,
    },
    {
      header: 'Stock Value',
      key: 'stock_value',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>
          ₹{Number(row.stock_value).toFixed(2)}
        </strong>
      ),
    },
    {
      header: 'Min Level',
      key: 'minimum_level',
      render: (row) => <span>{row.minimum_level} {row.unit}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StockStatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(row)}
          title="View Stock Position Details"
        >
          <Eye size={14} />
          <span>View</span>
        </Button>
      ),
    },
  ];

  return (
    <>
      {/* Desktop View (>= 768px) */}
      <div className="desktop-table-container">
        <Table
          columns={columns}
          data={stockData}
          emptyTitle="No stock records found"
          emptyDescription="Try adjusting your filter criteria."
        />
      </div>

      {/* Mobile Card List View (< 768px) */}
      <div className="mobile-card-list">
        {stockData.length === 0 ? (
          <div className="mobile-empty-state">
            <Warehouse size={36} className="text-neutral-400" />
            <p className="mobile-empty-title">No stock records found</p>
            <p className="mobile-empty-desc">Try adjusting your filter criteria.</p>
          </div>
        ) : (
          stockData.map((row) => (
            <div
              key={`${row.item_id}-${row.location_id}`}
              className="mobile-stock-card"
              onClick={() => onViewDetails(row)}
            >
              <div className="card-top-header">
                <code className="mobile-sku-badge">{row.item_code}</code>
                <StockStatusBadge status={row.status} />
              </div>

              <div className="card-item-title">{row.item_name}</div>

              <div className="card-meta-chips">
                <span className="meta-chip">
                  <MapPin size={13} />
                  <span>{row.location_name}</span>
                </span>
                <span className="meta-chip">
                  <Tag size={13} />
                  <span>{row.category_name}</span>
                </span>
              </div>

              <div className="card-metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Available Qty</span>
                  <span className="metric-value highlight">
                    {row.available_quantity} {row.unit}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Stock Value</span>
                  <span className="metric-value">
                    ₹{Number(row.stock_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">WAC Cost</span>
                  <span className="metric-value">₹{Number(row.wac).toFixed(2)}</span>
                </div>
              </div>

              <div className="card-footer-action">
                <span>View Details & History</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default StockTable;
