import React from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { Search, RotateCcw } from 'lucide-react';

export const MovementFilters = ({
  searchQuery,
  onSearchChange,
  selectedItem,
  onItemChange,
  selectedLocation,
  onLocationChange,
  selectedType,
  onTypeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  referenceInput,
  onReferenceChange,
  onReset,
  items = [],
  locations = [],
}) => {
  const itemOptions = [
    { value: '', label: 'All Items' },
    ...items.map((i) => ({ value: String(i.id), label: `${i.item_code} - ${i.item_name}` })),
  ];

  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...locations.map((l) => ({ value: String(l.id), label: l.location_name })),
  ];

  const typeOptions = [
    { value: '', label: 'All Movement Types' },
    { value: 'OPENING', label: 'OPENING' },
    { value: 'INWARD', label: 'INWARD' },
    { value: 'OUTWARD', label: 'OUTWARD' },
    { value: 'RETURN', label: 'RETURN' },
    { value: 'ADJUSTMENT', label: 'ADJUSTMENT' },
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
          label="Search Keyword"
          placeholder="Search item or notes..."
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
          label="Movement Type"
          options={typeOptions}
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
        />

        <Input
          label="Reference / GRN"
          placeholder="e.g. GRN-001 or OUT-101"
          value={referenceInput}
          onChange={(e) => onReferenceChange(e.target.value)}
        />

        <Input
          label="Date From"
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
        />

        <Input
          label="Date To"
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
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

export default MovementFilters;
