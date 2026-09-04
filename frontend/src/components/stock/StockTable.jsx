import React from 'react';
import Table from '../common/Table';
import Button from '../common/Button';
import StockStatusBadge from './StockStatusBadge';
import { Eye } from 'lucide-react';

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
    <Table
      columns={columns}
      data={stockData}
      emptyTitle="No stock records found"
      emptyDescription="Try adjusting your filter criteria."
    />
  );
};

export default StockTable;
