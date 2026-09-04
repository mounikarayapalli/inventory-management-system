import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import MovementFilters from '../../components/stockMovements/MovementFilters';
import MovementTable from '../../components/stockMovements/MovementTable';
import MovementDetailDrawer from '../../components/stockMovements/MovementDetailDrawer';
import DevRoleSwitcher from '../../context/RoleContext';

import { MOCK_STOCK_MOVEMENTS_DATA } from '../../constants/mockStockMovementsData';
import {
  REAL_COMPANY_ITEMS,
  REAL_COMPANY_LOCATIONS,
} from '../../constants/companyInventoryData';

export const StockMovementsPage = () => {
  const [movementsList] = useState(MOCK_STOCK_MOVEMENTS_DATA);
  const [items] = useState(REAL_COMPANY_ITEMS);
  const [locations] = useState(REAL_COMPANY_LOCATIONS);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [referenceInput, setReferenceInput] = useState('');

  // Drawer State
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedItem('');
    setSelectedLocation('');
    setSelectedType('');
    setDateFrom('');
    setDateTo('');
    setReferenceInput('');
  };

  // Filtered Movements List
  const filteredMovements = useMemo(() => {
    return movementsList.filter((row) => {
      const matchesSearch =
        !searchQuery ||
        row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (row.item_code && row.item_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (row.remarks && row.remarks.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesItem = !selectedItem || String(row.item_id) === selectedItem;
      const matchesLocation = !selectedLocation || String(row.location_id) === selectedLocation;
      const matchesType = !selectedType || row.movement_type === selectedType;
      const refVal = row.reference_number || row.reference || '';
      const matchesRef = !referenceInput || refVal.toLowerCase().includes(referenceInput.toLowerCase());

      const dateStr = (row.timestamp || row.date || '').split(' ')[0];
      const matchesDateFrom = !dateFrom || dateStr >= dateFrom;
      const matchesDateTo = !dateTo || dateStr <= dateTo;

      return (
        matchesSearch &&
        matchesItem &&
        matchesLocation &&
        matchesType &&
        matchesRef &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    movementsList,
    searchQuery,
    selectedItem,
    selectedLocation,
    selectedType,
    referenceInput,
    dateFrom,
    dateTo,
  ]);

  const handleViewDetails = (record) => {
    setSelectedMovement(record);
    setDrawerOpen(true);
  };

  return (
    <div>
      {/* Dev Role Switcher Bar */}
      <DevRoleSwitcher />

      {/* Page Header */}
      <PageHeader
        title="Stock Movements"
        subtitle="Track every stock movement and its source transaction."
      />

      {/* Movement Filter Bar */}
      <MovementFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedItem={selectedItem}
        onItemChange={setSelectedItem}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        dateFrom={dateFrom}
        onDateFromChange={setDateFrom}
        dateTo={dateTo}
        onDateToChange={setDateTo}
        referenceInput={referenceInput}
        onReferenceChange={setReferenceInput}
        onReset={handleResetFilters}
        items={items}
        locations={locations}
      />

      {/* Movements Audit Trail Table */}
      <Card>
        <MovementTable
          movementData={filteredMovements}
          onViewDetails={handleViewDetails}
        />
      </Card>

      {/* Movement Detail Drawer Modal */}
      <MovementDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        movementRecord={selectedMovement}
      />
    </div>
  );
};

export default StockMovementsPage;
