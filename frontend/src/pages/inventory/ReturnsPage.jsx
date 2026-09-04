import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ReturnFormModal from '../../components/forms/ReturnFormModal';
import { DevRoleSwitcher } from '../../context/RoleContext';

import { MOCK_RETURNS_DATA } from '../../constants/mockReturnsData';
import {
  REAL_COMPANY_ITEMS,
  REAL_COMPANY_LOCATIONS,
} from '../../constants/companyInventoryData';

import { Plus, Search, RotateCcw, CheckCircle2 } from 'lucide-react';

export const ReturnsPage = () => {
  const [returnsList, setReturnsList] = useState(MOCK_RETURNS_DATA);
  const [items] = useState(REAL_COMPANY_ITEMS);
  const [locations] = useState(REAL_COMPANY_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Confirm state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const filteredList = returnsList.filter(
    (row) =>
      row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAdd = () => {
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

      const newRecord = {
        id: Date.now(),
        ...pendingTxn,
        item_code: selectedItem ? selectedItem.item_code : 'SKU',
        item_name: selectedItem ? selectedItem.item_name : 'Item',
        location_name: selectedLoc ? selectedLoc.location_name : 'Location',
        status: 'Completed',
      };

      setReturnsList([newRecord, ...returnsList]);
      setSuccessBanner('Stock return recorded successfully.');
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
      header: 'Quantity Returned',
      key: 'quantity',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--info-700)' }}>
          +{row.quantity} units
        </span>
      ),
    },
    {
      header: 'Source',
      key: 'source',
    },
    {
      header: 'Reason',
      key: 'reason',
    },
    {
      header: 'Return Date',
      key: 'return_date',
    },
    {
      header: 'Status',
      key: 'status',
      render: () => <Badge variant="success">Completed</Badge>,
    },
  ];

  return (
    <div>
      <DevRoleSwitcher />

      <PageHeader
        title="Stock Returns"
        subtitle="Manage customer returns, supplier returns, and unused event surplus returns."
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Record Return Entry
          </Button>
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
              placeholder="Search by item, source, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredList}
          emptyTitle="No stock returns"
          emptyDescription="Record returned stock entries from departments or customers."
        />
      </Card>

      <ReturnFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitTransaction={handleFormSubmit}
        items={items}
        locations={locations}
      />

      {pendingTxn && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmTransaction}
          title="Confirm Stock Return Entry"
          message={`Are you sure you want to record Return of +${pendingTxn.quantity} units from ${pendingTxn.source}?`}
          confirmText="Confirm Return"
        />
      )}
    </div>
  );
};

export default ReturnsPage;
