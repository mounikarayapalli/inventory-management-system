import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import SupplierFormModal from '../../components/forms/SupplierFormModal';
import { useRole } from '../../context/RoleContext';
import suppliersAPI from '../../api/suppliers';
import { Plus, Search, Eye, Edit2 } from 'lucide-react';

export const SuppliersPage = () => {
  const { isAdmin } = useRole();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await suppliersAPI.listSuppliers();
      setSuppliers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const filteredSuppliers = suppliers.filter(
    (sup) =>
      (sup.supplier_name || sup.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sup.contact_person && sup.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setSelectedSupplier(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupplier(sup);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleOpenView = (sup) => {
    setSelectedSupplier(sup);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSaveSupplier = async (formData) => {
    try {
      const supId = selectedSupplier?.id || selectedSupplier?.supplier_id;
      if (modalMode === 'add') {
        await suppliersAPI.createSupplier(formData);
      } else if (modalMode === 'edit' && supId) {
        await suppliersAPI.updateSupplier(supId, formData);
      }
      setModalOpen(false);
      await loadSuppliers();
    } catch (err) {
      alert(err.message || 'Failed to save supplier');
    }
  };

  const columns = [
    {
      header: 'Supplier Name',
      key: 'supplier_name',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>{row.supplier_name || row.name}</strong>
      ),
    },
    {
      header: 'Contact Person',
      key: 'contact_person',
      render: (row) => <span>{row.contact_person || '—'}</span>,
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (row) => <span>{row.phone || '—'}</span>,
    },
    {
      header: 'Email',
      key: 'email',
      render: (row) => <span>{row.email || '—'}</span>,
    },
    {
      header: 'Address',
      key: 'address',
      render: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>
          {row.address || '—'}
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
              title="Edit Supplier"
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
        title="Suppliers"
        subtitle="Manage inventory suppliers and contact information."
        actions={
          isAdmin && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Add Supplier
            </Button>
          )
        }
      />

      <Card>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <div style={{ maxWidth: '360px' }}>
            <Input
              placeholder="Search supplier name or contact..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading suppliers..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadSuppliers} />
        ) : (
          <Table
            columns={columns}
            data={filteredSuppliers}
            emptyTitle="No suppliers found"
            emptyDescription="Try adjusting your search filter or add a new supplier."
          />
        )}
      </Card>

      <SupplierFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSupplier}
        supplier={selectedSupplier}
        mode={modalMode}
      />
    </div>
  );
};

export default SuppliersPage;
