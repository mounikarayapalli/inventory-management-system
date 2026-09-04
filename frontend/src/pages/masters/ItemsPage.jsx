import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import ItemFormModal from '../../components/forms/ItemFormModal';
import { useRole, DevRoleSwitcher } from '../../context/RoleContext';

import {
  REAL_COMPANY_ITEMS,
  REAL_COMPANY_CATEGORIES,
} from '../../constants/companyInventoryData';

import { Plus, Search, Eye, Edit2 } from 'lucide-react';

export const ItemsPage = () => {
  const { isAdmin } = useRole();
  const [items, setItems] = useState(REAL_COMPANY_ITEMS);
  const [categories] = useState(REAL_COMPANY_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [selectedItem, setSelectedItem] = useState(null);

  // Category lookup helper
  const getCategoryName = (catId) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.category_name : `Category #${catId}`;
  };

  // Client-side search filter
  const filteredItems = items.filter(
    (item) =>
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleSaveItem = (formData) => {
    if (modalMode === 'add') {
      const newItem = {
        id: Date.now(),
        ...formData,
      };
      setItems([newItem, ...items]);
    } else if (modalMode === 'edit' && selectedItem) {
      setItems(
        items.map((i) => (i.id === selectedItem.id ? { ...i, ...formData } : i))
      );
    }
  };

  const columns = [
    {
      header: 'Item Code',
      key: 'item_code',
      render: (row) => (
        <code style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)' }}>
          {row.item_code}
        </code>
      ),
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name}</strong>
      ),
    },
    {
      header: 'Category',
      key: 'category_id',
      render: (row) => <Badge variant="neutral">{getCategoryName(row.category_id)}</Badge>,
    },
    {
      header: 'Unit',
      key: 'unit',
    },
    {
      header: 'Min Level',
      key: 'minimum_level',
      render: (row) => <span>{row.minimum_level} units</span>,
    },
    {
      header: 'Default Unit Cost',
      key: 'default_unit_cost',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {row.default_unit_cost !== undefined
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
      <DevRoleSwitcher />

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

        <Table
          columns={columns}
          data={filteredItems}
          emptyTitle="No items found"
          emptyDescription="Try adjusting your search filter or add a new item."
        />
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
