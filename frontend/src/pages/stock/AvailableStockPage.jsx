import React, { useState, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import StockSummaryCard from '../../components/stock/StockSummaryCard';
import StockFilters from '../../components/stock/StockFilters';
import StockTable from '../../components/stock/StockTable';
import StockDetailDrawer from '../../components/stock/StockDetailDrawer';
import DevRoleSwitcher from '../../context/RoleContext';

import { MOCK_STOCK_OVERVIEW_DATA } from '../../constants/mockStockOverviewData';
import {
  REAL_COMPANY_ITEMS,
  REAL_COMPANY_LOCATIONS,
  REAL_COMPANY_CATEGORIES,
} from '../../constants/companyInventoryData';

import {
  Package,
  Warehouse,
  IndianRupee,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';

export const AvailableStockPage = () => {
  const [stockList] = useState(MOCK_STOCK_OVERVIEW_DATA);
  const [items] = useState(REAL_COMPANY_ITEMS);
  const [locations] = useState(REAL_COMPANY_LOCATIONS);
  const [categories] = useState(REAL_COMPANY_CATEGORIES);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Detail Drawer State
  const [selectedStockRecord, setSelectedStockRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      const matchesSearch =
        !searchQuery ||
        row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.item_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesItem = !selectedItem || String(row.item_id) === selectedItem;
      const matchesLocation = !selectedLocation || String(row.location_id) === selectedLocation;
      const matchesCategory = !selectedCategory || String(row.category_id) === selectedCategory;
      const matchesStatus = !selectedStatus || row.status === selectedStatus;

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
    const totalStockQty = stockList.reduce((acc, curr) => acc + curr.available_quantity, 0);
    const totalStockValue = stockList.reduce((acc, curr) => acc + curr.stock_value, 0);
    const lowStockCount = stockList.filter((s) => s.status === 'Low Stock').length;
    const outOfStockCount = stockList.filter((s) => s.status === 'Out of Stock').length;

    return {
      totalItems,
      totalStockQty,
      totalStockValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [stockList]);

  const handleViewDetails = (record) => {
    setSelectedStockRecord(record);
    setDrawerOpen(true);
  };

  return (
    <div>
      {/* Dev Role Switcher Bar */}
      <DevRoleSwitcher />

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
        <StockTable stockData={filteredStock} onViewDetails={handleViewDetails} />
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
