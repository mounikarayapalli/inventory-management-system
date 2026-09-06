import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import StockSummaryCard from '../../components/stock/StockSummaryCard';
import StockFilters from '../../components/stock/StockFilters';
import StockTable from '../../components/stock/StockTable';
import StockDetailDrawer from '../../components/stock/StockDetailDrawer';
import stockAPI from '../../api/stock';
import itemsAPI from '../../api/items';
import locationsAPI from '../../api/locations';
import categoriesAPI from '../../api/categories';
import {
  Package,
  Warehouse,
  IndianRupee,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

export const AvailableStockPage = () => {
  const [stockList, setStockList] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Detail Drawer State
  const [selectedStockRecord, setSelectedStockRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, itemsRes, locationsRes, categoriesRes] = await Promise.all([
        stockAPI.listStock(),
        itemsAPI.listItems(),
        locationsAPI.listLocations(),
        categoriesAPI.listCategories(),
      ]);
      setStockList(stockRes || []);
      setItems(itemsRes || []);
      setLocations(locationsRes || []);
      setCategories(categoriesRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load stock data from backend');
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
    setSelectedCategory('');
    setSelectedStatus('');
  };

  // Filtered Stock List
  const filteredStock = useMemo(() => {
    return stockList.filter((row) => {
      const itemName = row.item_name || '';
      const sku = row.sku || row.item_code || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || itemName.toLowerCase().includes(q) || sku.toLowerCase().includes(q);
      const matchesItem = !selectedItem || String(row.item_id) === selectedItem;
      const matchesLocation = !selectedLocation || String(row.location_id) === selectedLocation;
      const matchesCategory = !selectedCategory || String(row.category_id) === selectedCategory;
      const matchesStatus = !selectedStatus || String(row.status).toLowerCase() === selectedStatus.toLowerCase();

      return (
        matchesSearch &&
        matchesItem &&
        matchesLocation &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [stockList, searchQuery, selectedItem, selectedLocation, selectedCategory, selectedStatus]);

  // Compute Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalItems = new Set(stockList.map((s) => s.item_id)).size;
    const totalStockQty = stockList.reduce((acc, curr) => acc + Number(curr.current_quantity || curr.available_quantity || 0), 0);
    const totalStockValue = stockList.reduce((acc, curr) => acc + Number(curr.total_valuation || curr.stock_value || 0), 0);
    const lowStockCount = stockList.filter((s) => String(s.status).toLowerCase().includes('low')).length;
    const outOfStockCount = stockList.filter((s) => String(s.status).toLowerCase().includes('out')).length;

    return {
      totalItems,
      totalStockQty,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [stockList]);

  const handleViewDetails = async (record) => {
    try {
      const detail = await stockAPI.getItemStock(record.item_id);
      setSelectedStockRecord({ ...record, ...detail });
    } catch {
      setSelectedStockRecord(record);
    }
    setDrawerOpen(true);
  };

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title="Stock"
        subtitle="Stock balance and WAC valuation maintained Item + Location wise."
      />

      {/* Summary Cards Grid (5 Cards) */}
      <div className="dashboard-summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StockSummaryCard
          label="Total Items"
          value={summaryMetrics.totalItems}
          subtext="Unique SKUs in catalog"
          icon={Package}
          color="primary"
        />

        <StockSummaryCard
          label="Available Stock"
          value={`${summaryMetrics.totalStockQty.toLocaleString()} units`}
          subtext="Total available quantity"
          icon={Warehouse}
          color="success"
        />

        <StockSummaryCard
          label="Total Stock Value"
          value={`₹${summaryMetrics.totalStockValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtext="Valuation (Qty × WAC)"
          icon={IndianRupee}
          color="info"
        />

        <StockSummaryCard
          label="Low Stock Items"
          value={summaryMetrics.lowStockCount}
          subtext="Below minimum threshold"
          icon={AlertTriangle}
          color="warning"
        />

        <StockSummaryCard
          label="Out of Stock Items"
          value={summaryMetrics.outOfStockCount}
          subtext="Zero available stock"
          icon={AlertOctagon}
          color="neutral"
        />
      </div>

      {/* Filter Bar */}
      <StockFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedItem={selectedItem}
        onItemChange={setSelectedItem}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        onReset={handleResetFilters}
        items={items}
        locations={locations}
        categories={categories}
      />

      {/* Main Stock Table */}
      <Card>
        {loading ? (
          <LoadingState message="Loading inventory stock balances..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <StockTable stockData={filteredStock} onViewDetails={handleViewDetails} />
        )}
      </Card>

      {/* Stock Detail Drawer Modal */}
      <StockDetailDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        stockRecord={selectedStockRecord}
      />
    </div>
  );
};

export default AvailableStockPage;
