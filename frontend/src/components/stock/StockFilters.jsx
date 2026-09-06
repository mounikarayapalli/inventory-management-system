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
    ...items.map((i) => ({ value: String(i.item_id ?? i.id), label: `${i.item_code} - ${i.item_name}` })),
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map((l) => ({ value: String(l.location_id ?? l.id), label: l.location_name })),
  ];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: String(c.category_id ?? c.id), label: c.category_name })),
  ];

  const tabs = [
    { id: '', label: 'All' },
    { id: 'In Stock', label: 'In Stock' },
    { id: 'Low Stock', label: 'Low Stock' },
    { id: 'Out of Stock', label: 'Out of Stock' },
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
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Visual Status Filter Tabs matching reference image */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--neutral-100)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id || 'all'}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '20px',
                fontSize: '0.825rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: isActive ? 'var(--calibo-navy)' : '#F1F5F9',
                color: isActive ? '#ffffff' : 'var(--neutral-600)',
                boxShadow: isActive ? '0 2px 6px rgba(13,21,39,0.18)' : 'none',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

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
