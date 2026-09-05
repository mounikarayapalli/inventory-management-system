import React from 'react';
import Table from '../common/Table';
import Button from '../common/Button';
import MovementTypeBadge from './MovementTypeBadge';
import { Eye } from 'lucide-react';

export const MovementTable = ({ movementData = [], onViewDetails }) => {
  const columns = [
    {
      header: 'Movement ID',
      key: 'id',
      render: (row) => <code style={{ fontSize: '0.8rem' }}>{row.movement_id || row.id}</code>,
    },
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (row) => <span>{row.timestamp || row.date}</span>,
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name}</strong>,
    },
    {
      header: 'Location',
      key: 'location_name',
    },
    {
      header: 'Movement Type',
      key: 'movement_type',
      render: (row) => <MovementTypeBadge type={row.movement_type} />,
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (row) => {
        const isPositive = Number(row.quantity) > 0;
        return (
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: isPositive ? 'var(--success-700)' : 'var(--error-600)',
            }}
          >
            {isPositive ? `+${row.quantity}` : row.quantity}
          </span>
        );
      },
    },
    {
      header: 'Reference Number',
      key: 'reference',
      render: (row) => <code style={{ fontSize: '0.8rem' }}>{row.reference_number || row.reference || '—'}</code>,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(row)}
          title="View Movement Details"
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
      data={movementData}
      emptyTitle="No stock movements found"
      emptyDescription="Try adjusting your filter criteria."
    />
  );
};

export default MovementTable;

