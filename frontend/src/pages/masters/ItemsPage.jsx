import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ItemFormModal from '../../components/forms/ItemFormModal';
import { useRole } from '../../context/RoleContext';
import itemsAPI from '../../api/items';
import categoriesAPI from '../../api/categories';
import { Plus, Search, Eye, Edit2 } from 'lucide-react';

export const ItemsPage = () => {
  const { isAdmin } = useRole();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedItem, setSelectedItem] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, categoriesRes] = await Promise.all([
        itemsAPI.listItems(),
        categoriesAPI.listCategories(),
      ]);
      setItems(itemsRes || []);
      setCategories(categoriesRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load items data from backend');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Category lookup helper
  const getCategoryName = (catId) => {
    const found = categories.find((c) => (c.id || c.category_id) === catId);
    return found ? (found.category_name || found.name) : `Category #${catId}`;
  };

  // Client-side search filter
  const filteredItems = items.filter(
    (item) =>
      (item.item_name || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.item_code || item.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setSelectedItem(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSaveItem = async (formData) => {
    try {
      const itemId = selectedItem?.id || selectedItem?.item_id;
      if (modalMode === 'add') {
        await itemsAPI.createItem(formData);
      } else if (modalMode === 'edit' && itemId) {
        await itemsAPI.updateItem(itemId, formData);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save item');
    }
  };

  const columns = [
    {
      header: 'Item Code',
      key: 'item_code',
      render: (row) => (
        <code style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)' }}>
          {row.item_code || row.sku}
        </code>
      ),
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name || row.name}</strong>
      ),
    },
    {
      header: 'Category',
      key: 'category_id',
      render: (row) => <Badge variant="neutral">{row.category_name || getCategoryName(row.category_id)}</Badge>,
    },
    {
      header: 'Unit',
      key: 'unit',
    },
    {
      header: 'Min Level',
      key: 'minimum_level',
      render: (row) => <span>{row.minimum_level ?? row.min_stock_level ?? 0} units</span>,
    },
    {
      header: 'Default Unit Cost',
      key: 'default_unit_cost',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {row.default_unit_cost !== null && row.default_unit_cost !== undefined
            ? `₹${Number(row.default_unit_cost).toFixed(2)}`
            : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'error'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenView(row)}
            title="View Details"
          >
            <Eye size={14} />
            <span>View</span>
          </Button>

          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Item"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Items Master"
        subtitle="Manage inventory items and their category information."
        actions={
          isAdmin && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Add Item
            </Button>
          )
        }
      />

      <Card>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <div style={{ maxWidth: '360px' }}>
            <Input
              placeholder="Search items by code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading catalog items..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <Table
            columns={columns}
            data={filteredItems}
            emptyTitle="No items found"
            emptyDescription="Try adjusting your search filter or add a new item."
          />
        )}
      </Card>

      <ItemFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveItem}
        item={selectedItem}
        mode={modalMode}
        categories={categories}
      />
    </div>
  );
};

export default ItemsPage;
