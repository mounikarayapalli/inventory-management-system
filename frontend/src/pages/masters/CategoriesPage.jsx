import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import CategoryFormModal from '../../components/forms/CategoryFormModal';
import { useRole, DevRoleSwitcher } from '../../context/RoleContext';

import { REAL_COMPANY_CATEGORIES } from '../../constants/companyInventoryData';

import { Plus, Search, Eye, Edit2 } from 'lucide-react';

export const CategoriesPage = () => {
  const { isAdmin } = useRole();
  const [categories, setCategories] = useState(REAL_COMPANY_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredCategories = categories.filter((cat) =>
    cat.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
    setSelectedCategory(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleOpenView = (cat) => {
    setSelectedCategory(cat);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSaveCategory = (formData) => {
    if (modalMode === 'add') {
      const newCat = {
        id: Date.now(),
        ...formData,
      };
      setCategories([newCat, ...categories]);
    } else if (modalMode === 'edit' && selectedCategory) {
      setCategories(
        categories.map((c) => (c.id === selectedCategory.id ? { ...c, ...formData } : c))
      );
    }
  };

  const columns = [
    {
      header: 'Category Name',
      key: 'category_name',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>{row.category_name}</strong>
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
              title="Edit Category"
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
        title="Categories"
        subtitle="Manage inventory item categories."
        actions={
          isAdmin && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Add Category
            </Button>
          )
        }
      />

      <Card>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <div style={{ maxWidth: '360px' }}>
            <Input
              placeholder="Search category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredCategories}
          emptyTitle="No categories found"
          emptyDescription="Try adjusting your search filter or add a new category."
        />
      </Card>

      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCategory}
        category={selectedCategory}
        mode={modalMode}
      />
    </div>
  );
};

export default CategoriesPage;
