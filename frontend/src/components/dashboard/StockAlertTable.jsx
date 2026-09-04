import React from 'react';
import Card from '../common/Card';
import Table from '../common/Table';
import Badge from '../common/Badge';
import { AlertOctagon, AlertTriangle } from 'lucide-react';

export const StockAlertTable = ({ alerts = [] }) => {
  const columns = [
    {
      header: 'Item',
      key: 'itemName',
      render: (row) => (
        <div>
          <strong style={{ color: 'var(--neutral-900)' }}>{row.itemName}</strong>
        </div>
      ),
    },
    {
      header: 'Item Code',
      key: 'itemCode',
      render: (row) => <code style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>{row.itemCode}</code>,
    },
    {
      header: 'Location',
      key: 'location',
    },
    {
      header: 'Available Stock',
      key: 'availableStock',
      render: (row) => (
        <span style={{ fontWeight: 600, color: row.availableStock === 0 ? 'var(--error-600)' : 'var(--warning-700)' }}>
          {row.availableStock} units
        </span>
      ),
    },
    {
      header: 'Min Level',
      key: 'minimumLevel',
      render: (row) => <span>{row.minimumLevel} units</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => {
        const isOutOfStock = row.status === 'Out of Stock';
        return (
          <Badge
            variant={isOutOfStock ? 'error' : 'warning'}
            icon={isOutOfStock ? AlertOctagon : AlertTriangle}
          >
            {row.status}
          </Badge>
        );
      },
    },
  ];

  return (
    <Card
      title="Stock Alerts"
      subtitle="Items that have fallen below minimum safety reorder thresholds"
    >
      <Table
        columns={columns}
        data={alerts}
        emptyTitle="No stock alerts"
        emptyDescription="All inventory items are currently above safety threshold levels."
      />
    </Card>
  );
};

export default StockAlertTable;
