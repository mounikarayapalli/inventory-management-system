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
import categoriesAPI from '../../api/categories';

export const StockMovementsPage = () => {
  const [movementsList, setMovementsList] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState('__placeholder__');
  const [selectedLocation, setSelectedLocation] = useState('__placeholder__');
  const [selectedCategory, setSelectedCategory] = useState('__placeholder__');
  const [selectedType, setSelectedType] = useState('__placeholder__');
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
      const [movementsRes, itemsRes, locationsRes, categoriesRes] = await Promise.all([
        stockAPI.listMovements(),
        itemsAPI.listItems().catch(() => []),
        locationsAPI.listLocations().catch(() => []),
        categoriesAPI.listCategories().catch(() => []),
      ]);
      setMovementsList(movementsRes || []);
      setItems(itemsRes || []);
      setLocations(locationsRes || []);
      setCategories(categoriesRes || []);
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
    setSelectedItem('__placeholder__');
    setSelectedLocation('__placeholder__');
    setSelectedCategory('__placeholder__');
    setSelectedType('__placeholder__');
    setDateFrom('');
    setDateTo('');
    setReferenceInput('');
  };

  // Filtered Movements List
  const filteredMovements = useMemo(() => {
    const itemsMap = new Map((items || []).map((i) => [i.item_id || i.id, i]));
    return movementsList.filter((row) => {
      const matchingItem = itemsMap.get(row.item_id) || {};
      const itemName = row.item_name || matchingItem.item_name || '';
      const remarks = row.remarks || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        itemName.toLowerCase().includes(q) ||
        remarks.toLowerCase().includes(q);

      const matchesItem = !selectedItem || selectedItem === '__placeholder__' || String(row.item_id) === selectedItem;
      const matchesLocation = !selectedLocation || selectedLocation === '__placeholder__' || String(row.location_id) === selectedLocation;

      const rowCategoryId = row.category_id || matchingItem.category_id;
      const matchesCategory = !selectedCategory || selectedCategory === '__placeholder__' || String(rowCategoryId) === selectedCategory;

      const matchesType = !selectedType || selectedType === '__placeholder__' || row.movement_type === selectedType;
      const refVal = String(row.reference_no || row.reference_id || '');
      const matchesRef = !referenceInput || refVal.toLowerCase().includes(referenceInput.toLowerCase());

      const movementTime = row.movement_date || row.timestamp;
      const timestampStr = movementTime ? String(movementTime).split('T')[0] : '';
      const matchesDateFrom = !dateFrom || timestampStr >= dateFrom;
      const matchesDateTo = !dateTo || timestampStr <= dateTo;

      return (
        matchesSearch &&
        matchesItem &&
        matchesLocation &&
        matchesCategory &&
        matchesType &&
        matchesRef &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    movementsList,
    items,
    searchQuery,
    selectedItem,
    selectedLocation,
    selectedCategory,
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
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
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
        categories={categories}
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
