import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import MovementFilters from '../../components/stockMovements/MovementFilters';
import MovementTable from '../../components/stockMovements/MovementTable';
import MovementDetailDrawer from '../../components/stockMovements/MovementDetailDrawer';
import stockAPI from '../../api/stock';
import itemsAPI from '../../api/items';
import locationsAPI from '../../api/locations';

export const StockMovementsPage = () => {
  const [movementsList, setMovementsList] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [movementsRes, itemsRes, locationsRes] = await Promise.all([
        stockAPI.listMovements(),
        itemsAPI.listItems(),
        locationsAPI.listLocations(),
      ]);
      setMovementsList(movementsRes || []);
      setItems(itemsRes || []);
      setLocations(locationsRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load stock movements audit log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      const itemName = row.item_name || '';
      const remarks = row.remarks || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        itemName.toLowerCase().includes(q) ||
        remarks.toLowerCase().includes(q);

      const matchesItem = !selectedItem || String(row.item_id) === selectedItem;
      const matchesLocation = !selectedLocation || String(row.location_id) === selectedLocation;
      const matchesType = !selectedType || row.movement_type === selectedType;
      const refVal = String(row.reference_no || row.reference_id || '');
      const matchesRef = !referenceInput || refVal.toLowerCase().includes(referenceInput.toLowerCase());

      const timestampStr = row.timestamp ? String(row.timestamp).split('T')[0] : '';
      const matchesDateFrom = !dateFrom || timestampStr >= dateFrom;
      const matchesDateTo = !dateTo || timestampStr <= dateTo;

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
        {loading ? (
          <LoadingState message="Loading stock movement audit log..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <MovementTable
            movementData={filteredMovements}
            onViewDetails={handleViewDetails}
          />
        )}
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
