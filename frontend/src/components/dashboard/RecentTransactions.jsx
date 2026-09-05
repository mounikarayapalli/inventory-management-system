import React from 'react';
import Card from '../common/Card';
import Table from '../common/Table';
import Badge from '../common/Badge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Archive,
  RotateCcw,
  Sliders,
} from 'lucide-react';

const transactionBadgeConfig = {
  INWARD: { variant: 'success', icon: ArrowDownLeft, label: 'INWARD' },
  OUTWARD: { variant: 'warning', icon: ArrowUpRight, label: 'OUTWARD' },
  OPENING: { variant: 'primary', icon: Archive, label: 'OPENING' },
  RETURN: { variant: 'info', icon: RotateCcw, label: 'RETURN' },
  ADJUSTMENT: { variant: 'neutral', icon: Sliders, label: 'ADJUSTMENT' },
};

export const RecentTransactions = ({ transactions = [] }) => {
  const columns = [
    {
      header: 'Transaction',
      key: 'transactionType',
      render: (row) => {
        const config = transactionBadgeConfig[row.transactionType] || {
          variant: 'neutral',
          icon: Sliders,
          label: row.transactionType,
        };
        return (
          <Badge variant={config.variant} icon={config.icon}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      header: 'Reference',
      key: 'reference',
      render: (row) => <code style={{ fontSize: '0.8rem' }}>{row.reference}</code>,
    },
    {
      header: 'Item',
      key: 'itemName',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.itemName}</span>,
    },
    {
      header: 'Location',
      key: 'location',
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (row) => {
        const isPositive = row.quantity.startsWith('+');
        return (
          <span
            style={{
              fontWeight: 600,
              color: isPositive ? 'var(--success-700)' : 'var(--error-600)',
            }}
          >
            {row.quantity}
          </span>
        );
      },
    },
    {
      header: 'Date & Time',
      key: 'date',
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge variant="success">{row.status}</Badge>,
    },
  ];

  return (
    <Card
      title="Recent Transactions Log"
      subtitle="Latest stock movements (Opening, Inward, Outward, Return, Adjustment)"
    >
      <Table
        columns={columns}
        data={transactions}
        emptyTitle="No recent transactions"
        emptyDescription="Transaction logs recorded across warehouses will render here."
      />
    </Card>
  );
};

export default RecentTransactions;
