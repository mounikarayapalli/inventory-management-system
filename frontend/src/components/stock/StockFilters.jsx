import React from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { Search, RotateCcw } from 'lucide-react';

export const StockFilters = ({
  searchQuery,
  onSearchChange,
  selectedItem,
  onItemChange,
  selectedLocation,
  onLocationChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onReset,
  items = [],
  locations = [],
  categories = [],
}) => {
  const itemOptions = [
    { value: '', label: 'All Items' },
    ...items.map((i) => ({ value: String(i.id), label: `${i.item_code} - ${i.item_name}` })),
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map((l) => ({ value: String(l.id), label: l.location_name })),
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: String(c.id), label: c.category_name })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'In Stock', label: 'In Stock' },
    { value: 'Low Stock', label: 'Low Stock' },
    { value: 'Out of Stock', label: 'Out of Stock' },
  ];

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: '#ffffff',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--border-radius-lg)',
        marginBottom: '1.5rem',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
        <Input
          label="Search Item"
          placeholder="Search by code or name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          rightIcon={<Search size={16} />}
        />

        <Select
          label="Item"
          options={itemOptions}
          value={selectedItem}
          onChange={(e) => onItemChange(e.target.value)}
        />

        <Select
          label="Location"
          options={locationOptions}
          value={selectedLocation}
          onChange={(e) => onLocationChange(e.target.value)}
        />

        <Select
          label="Category"
          options={categoryOptions}
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        />

        <Select
          label="Status"
          options={statusOptions}
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
        />

        <div>
          <Button variant="outline" icon={RotateCcw} onClick={onReset} fullWidth>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StockFilters;
