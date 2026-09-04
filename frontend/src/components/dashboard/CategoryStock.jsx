import React from 'react';
import Card from '../common/Card';
import Table from '../common/Table';

export const CategoryStock = ({ categoryData = [] }) => {
  const columns = [
    {
      header: 'Category',
      key: 'categoryName',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.categoryName}</strong>,
    },
    {
      header: 'Total Items',
      key: 'totalItems',
      render: (row) => <span>{row.totalItems} SKUs</span>,
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
      title="Category Stock Summary"
      subtitle="Stock balances and valuations per category"
    >
      <Table
        columns={columns}
        data={categoryData}
        emptyTitle="No category data"
        emptyDescription="Category valuations will display here."
      />
    </Card>
  );
};

export default CategoryStock;
