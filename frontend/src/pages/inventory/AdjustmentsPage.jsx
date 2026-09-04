import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AdjustmentFormModal from '../../components/forms/AdjustmentFormModal';
import { useRole, DevRoleSwitcher } from '../../context/RoleContext';

import { MOCK_ADJUSTMENTS_DATA } from '../../constants/mockAdjustmentsData';
import {
  REAL_COMPANY_ITEMS,
  REAL_COMPANY_LOCATIONS,
} from '../../constants/companyInventoryData';

import { Plus, Search, Eye, Edit2, CheckCircle2 } from 'lucide-react';

export const AdjustmentsPage = () => {
  const { isAdmin } = useRole();
  const [adjustmentsList, setAdjustmentsList] = useState(MOCK_ADJUSTMENTS_DATA);
  const [items] = useState(REAL_COMPANY_ITEMS);
  const [locations] = useState(REAL_COMPANY_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Confirm state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedAdjustment, setSelectedAdjustment] = useState(null);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const filteredList = adjustmentsList.filter(
    (row) =>
      row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const handleConfirmTransaction = () => {
    if (pendingTxn) {
      const selectedItem = items.find((i) => i.id === pendingTxn.item_id);
      const selectedLoc = locations.find((l) => l.id === pendingTxn.location_id);

      if (modalMode === 'add') {
        const newRecord = {
          id: Date.now(),
          ...pendingTxn,
          item_code: selectedItem ? selectedItem.item_code : 'SKU',
          item_name: selectedItem ? selectedItem.item_name : 'Item',
          location_name: selectedLoc ? selectedLoc.location_name : 'Location',
          created_by: 'Admin User',
          status: 'Completed',
        };
        setAdjustmentsList([newRecord, ...adjustmentsList]);
        setSuccessBanner('Stock adjustment transaction created successfully.');
      } else if (modalMode === 'edit' && selectedAdjustment) {
        setAdjustmentsList(
          adjustmentsList.map((a) =>
            a.id === selectedAdjustment.id ? { ...a, ...pendingTxn } : a
          )
        );
        setSuccessBanner('Stock adjustment updated successfully.');
      }
      setTimeout(() => setSuccessBanner(''), 4000);
    }
    setConfirmOpen(false);
    setPendingTxn(null);
  };

  const columns = [
    {
      header: 'Item Code',
      key: 'item_code',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.item_code}</code>,
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name}</strong>,
    },
    {
      header: 'Location',
      key: 'location_name',
    },
    {
      header: 'Quantity Change',
      key: 'quantity_change',
      render: (row) => {
        const isPositive = Number(row.quantity_change) > 0;
        return (
          <span
            style={{
              fontWeight: 700,
              color: isPositive ? 'var(--success-700)' : 'var(--error-600)',
            }}
          >
            {isPositive ? `+${row.quantity_change}` : row.quantity_change} units
          </span>
        );
      },
    },
    {
      header: 'Reason',
      key: 'reason',
    },
    {
      header: 'Adjustment Date',
      key: 'adjustment_date',
    },
    {
      header: 'Created By',
      key: 'created_by',
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
      <DevRoleSwitcher />

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

        <Table
          columns={columns}
          data={filteredList}
          emptyTitle="No stock adjustments"
          emptyDescription="Physical audit stock adjustments will render here."
        />
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
          message={`Are you sure you want to ${modalMode === 'add' ? 'create' : 'update'} stock adjustment of ${pendingTxn.quantity_change > 0 ? `+${pendingTxn.quantity_change}` : pendingTxn.quantity_change} units?`}
          confirmText="Confirm Adjustment"
        />
      )}
    </div>
  );
};

export default AdjustmentsPage;
