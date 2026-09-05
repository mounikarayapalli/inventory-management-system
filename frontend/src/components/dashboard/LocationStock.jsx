import React from 'react';
import Card from '../common/Card';
import Table from '../common/Table';

export const LocationStock = ({ locationData = [] }) => {
  const columns = [
    {
      header: 'Location / Warehouse',
      key: 'locationName',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.locationName}</strong>,
    },
    {
      header: 'Items',
      key: 'itemsCount',
      render: (row) => <span>{row.itemsCount} SKUs</span>,
    },
    {
      header: 'Available Stock',
      key: 'availableStock',
    },
    {
      header: 'Stock Value',
      key: 'stockValue',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.stockValue}</span>,
    },
  ];

  return (
    <Card
      title="Location Stock Summary"
      subtitle="Stock balances per warehouse location (Item + Location wise)"
    >
      <Table
        columns={columns}
        data={locationData}
        emptyTitle="No location data"
        emptyDescription="Warehouse location stock balances will display here."
      />
    </Card>
  );
};

export default LocationStock;
