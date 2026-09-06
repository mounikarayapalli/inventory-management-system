import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import AdjustmentFormModal from '../../components/forms/AdjustmentFormModal';
import { useRole } from '../../context/RoleContext';
import itemsAPI from '../../api/items';
import locationsAPI from '../../api/locations';
import transactionsAPI from '../../api/transactions';
import { Plus, Search, Eye, Edit2, CheckCircle2 } from 'lucide-react';

export const AdjustmentsPage = () => {
  const { isAdmin } = useRole();
  const [adjustmentsList, setAdjustmentsList] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Confirm state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, locationsRes, adjRes] = await Promise.all([
        itemsAPI.listItems(),
        locationsAPI.listLocations(),
        transactionsAPI.listAdjustments(),
      ]);
      setItems(itemsRes || []);
      setLocations(locationsRes || []);
      setAdjustmentsList(adjRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load stock adjustments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lookup helpers
  const getItemName = (id) => {
    const found = items.find((i) => (i.id || i.item_id) === id);
    return found ? (found.item_name || found.name) : `Item #${id}`;
  };

  const getLocationName = (id) => {
    const found = locations.find((l) => (l.id || l.location_id) === id);
    return found ? (found.location_name || found.name) : `Location #${id}`;
  };

  const filteredList = adjustmentsList.filter((row) => {
    const itemName = row.item_name || getItemName(row.item_id);
    const reason = row.reason || '';
    const locName = row.location_name || getLocationName(row.location_id);
    const q = searchQuery.toLowerCase();
    return (
      itemName.toLowerCase().includes(q) ||
      reason.toLowerCase().includes(q) ||
      locName.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
    setSelectedAdjustment(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleOpenEdit = (adj) => {
    setSelectedAdjustment(adj);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleOpenView = (adj) => {
    setSelectedAdjustment(adj);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleFormSubmit = (txnData) => {
    setPendingTxn(txnData);
    setModalOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTxn) return;
    setSubmitting(true);
    try {
      if (modalMode === 'add') {
        await transactionsAPI.createAdjustment({
          item_id: Number(pendingTxn.item_id),
          location_id: Number(pendingTxn.location_id),
          adjusted_quantity: Number(pendingTxn.quantity_change ?? pendingTxn.adjusted_quantity),
          reason: pendingTxn.reason || 'Audit Adjustment',
          adjustment_date: pendingTxn.adjustment_date || null,
          remarks: pendingTxn.remarks || null,
        });
        setSuccessBanner('Stock adjustment created successfully.');
      } else if (modalMode === 'edit' && selectedAdjustment) {
        const adjId = selectedAdjustment.adjustment_id || selectedAdjustment.id;
        await transactionsAPI.updateAdjustment(adjId, {
          reason: pendingTxn.reason || 'Updated reason',
          remarks: pendingTxn.remarks || null,
        });
        setSuccessBanner('Stock adjustment updated successfully.');
      }
      setTimeout(() => setSuccessBanner(''), 4000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to process stock adjustment');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setPendingTxn(null);
    }
  };

  const columns = [
    {
      header: 'Adjustment ID',
      key: 'id',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.adjustment_id || row.id}</code>,
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name || getItemName(row.item_id)}</strong>,
    },
    {
      header: 'Location',
      key: 'location_name',
      render: (row) => <span>{row.location_name || getLocationName(row.location_id)}</span>,
    },
    {
      header: 'Quantity Delta',
      key: 'quantity_change',
      render: (row) => {
        const qty = row.quantity_change ?? row.adjusted_quantity ?? 0;
        const isPositive = Number(qty) > 0;
        return (
          <span
            style={{
              fontWeight: 700,
              color: isPositive ? 'var(--success-700)' : 'var(--error-600)',
            }}
          >
            {isPositive ? `+${qty}` : qty}
          </span>
        );
      },
    },
    {
      header: 'Reason',
      key: 'reason',
      render: (row) => <span>{row.reason || '—'}</span>,
    },
    {
      header: 'Date',
      key: 'adjustment_date',
      render: (row) => <span>{row.adjustment_date ? new Date(row.adjustment_date).toLocaleDateString() : '—'}</span>,
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
            title="View Adjustment"
          >
            <Eye size={14} />
            <span>View</span>
          </Button>

          {isAdmin && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenEdit(row)}
              title="Edit Adjustment"
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
        title="Stock Adjustment"
        subtitle="Reconcile physical stock counts, wastage, damages, and audit variances."
        actions={
          isAdmin && (
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Create Adjustment
            </Button>
          )
        }
      />

      {successBanner && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--success-50)',
            border: '1px solid var(--success-100)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--success-700)',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{successBanner}</span>
        </div>
      )}

      <Card>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--neutral-200)' }}>
          <div style={{ maxWidth: '360px' }}>
            <Input
              placeholder="Search by item, reason, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading stock adjustments..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <Table
            columns={columns}
            data={filteredList}
            emptyTitle="No stock adjustments"
            emptyDescription="Physical audit stock adjustments will render here."
          />
        )}
      </Card>

      <AdjustmentFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitTransaction={handleFormSubmit}
        adjustment={selectedAdjustment}
        mode={modalMode}
        items={items}
        locations={locations}
      />

      {pendingTxn && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmTransaction}
          title="Confirm Stock Adjustment"
          message={`Are you sure you want to ${modalMode === 'add' ? 'create' : 'update'} stock adjustment?`}
          confirmText={submitting ? 'Processing...' : 'Confirm Adjustment'}
        />
      )}
    </div>
  );
};

export default AdjustmentsPage;
