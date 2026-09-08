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
  const [selectedItem, setSelectedItem] = useState('__placeholder__');
  const [selectedLocation, setSelectedLocation] = useState('__placeholder__');
  const [selectedCategory, setSelectedCategory] = useState('__placeholder__');
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
        itemsAPI.listItems().catch(() => []),
        locationsAPI.listLocations().catch(() => []),
        categoriesAPI.listCategories().catch(() => []),
      ]);

      const itemsMap = new Map((itemsRes || []).map((i) => [i.item_id || i.id, i]));
      const locsMap = new Map((locationsRes || []).map((l) => [l.location_id || l.id, l]));

      // Normalize stock item properties for UI rendering
      const normalizedStock = (stockRes || []).map((item) => {
        const matchingItem = itemsMap.get(item.item_id) || {};
        const matchingLoc = locsMap.get(item.location_id) || {};

        const qty = Number(item.current_quantity ?? item.available_quantity ?? item.quantity_on_hand ?? 0);
        const wacVal = Number(item.average_unit_cost ?? item.wac ?? 0);
        const totalVal = Number(item.total_valuation ?? item.stock_value ?? (qty * wacVal));
        const minLevel = Number(item.min_stock_level ?? item.minimum_level ?? matchingItem.min_stock_level ?? 0);

        return {
          ...item,
          item_code: item.sku || item.item_code || matchingItem.item_code || `ITEM-${item.item_id}`,
          item_name: item.item_name || matchingItem.item_name || 'Item',
          category_id: item.category_id || matchingItem.category_id,
          category_name: item.category_name || matchingItem.category_name || '—',
          location_name: item.location_name || matchingLoc.location_name || 'Warehouse',
          unit: item.unit || matchingItem.unit || 'units',
          available_quantity: qty,
          current_quantity: qty,
          wac: wacVal,
          average_unit_cost: wacVal,
          stock_value: totalVal,
          total_valuation: totalVal,
          minimum_level: minLevel,
          min_stock_level: minLevel,
          status: item.status || (qty === 0 ? 'Out of Stock' : qty <= minLevel ? 'Low Stock' : 'In Stock'),
        };
      });

      setStockList(normalizedStock);
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
    setSelectedItem('__placeholder__');
    setSelectedLocation('__placeholder__');
    setSelectedCategory('__placeholder__');
    setSelectedStatus('');
  };

  // Filtered Stock List
  const filteredStock = useMemo(() => {
    return stockList.filter((row) => {
      const itemName = row.item_name || '';
      const sku = row.item_code || row.sku || '';
      const q = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || itemName.toLowerCase().includes(q) || sku.toLowerCase().includes(q);
      const matchesItem = !selectedItem || selectedItem === '__placeholder__' || String(row.item_id) === selectedItem;
      const matchesLocation = !selectedLocation || selectedLocation === '__placeholder__' || String(row.location_id) === selectedLocation;
      const matchesCategory = !selectedCategory || selectedCategory === '__placeholder__' || String(row.category_id) === selectedCategory;
      const normStatus = String(row.status || '').toLowerCase().replace(/_/g, ' ');
      const normFilter = selectedStatus.toLowerCase().replace(/_/g, ' ');
      const matchesStatus = !selectedStatus || normStatus.includes(normFilter);

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
    const totalStockQty = stockList.reduce((acc, curr) => acc + Number(curr.current_quantity || 0), 0);
    const totalStockValue = stockList.reduce((acc, curr) => acc + Number(curr.total_valuation || 0), 0);
    const lowStockCount = stockList.filter((s) => String(s.status).toLowerCase().replace(/_/g, ' ').includes('low')).length;
    const outOfStockCount = stockList.filter((s) => String(s.status).toLowerCase().replace(/_/g, ' ').includes('out')).length;

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
      setSelectedStockRecord({
        ...detail,
        ...record,
        item_code: record.item_code || detail.sku,
        category_name: record.category_name || detail.category_name,
        location_name: record.location_name,
        available_quantity: record.available_quantity,
        current_quantity: record.available_quantity,
        wac: record.wac,
        stock_value: record.stock_value,
        breakdown: record.breakdown,
        status: record.status,
      });
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
