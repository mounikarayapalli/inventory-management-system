import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OpeningStockFormModal from '../../components/forms/OpeningStockFormModal';
import { DevRoleSwitcher } from '../../context/RoleContext';

import { MOCK_OPENING_STOCK_DATA } from '../../constants/mockOpeningStockData';
import { REAL_COMPANY_ITEMS, REAL_COMPANY_LOCATIONS } from '../../constants/companyInventoryData';

import { Plus, Search, Archive, CheckCircle2 } from 'lucide-react';

export const OpeningStockPage = () => {
  const [openingStockList, setOpeningStockList] = useState(MOCK_OPENING_STOCK_DATA);
  const [items] = useState(REAL_COMPANY_ITEMS);
  const [locations] = useState(REAL_COMPANY_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal & Confirm Dialog state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const filteredList = openingStockList.filter(
    (row) =>
      row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.location_name.toLowerCase().includes(searchQuery.toLowerCase())
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
        created_by: 'Current User',
        status: 'Completed',
      };

      setOpeningStockList([newRecord, ...openingStockList]);
      setSuccessBanner('Opening stock record created successfully.');
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
      header: 'Quantity',
      key: 'quantity',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.quantity} units</span>,
    },
    {
      header: 'Unit Cost',
      key: 'unit_cost',
      render: (row) => <span>₹{Number(row.unit_cost).toFixed(2)}</span>,
    },
    {
      header: 'Opening Date',
      key: 'opening_date',
    },
    {
      header: 'Remarks',
      key: 'remarks',
      render: (row) => <span style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>{row.remarks || '—'}</span>,
    },
    {
      header: 'Created By',
      key: 'created_by',
    },
  ];

  return (
    <div>
      <DevRoleSwitcher />

      <PageHeader
        title="Opening Stock Setup"
        subtitle="Initialize baseline stock quantities and initial valuations."
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Record Opening Stock
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
              placeholder="Search by code, item, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredList}
          emptyTitle="No opening stock records"
          emptyDescription="Record baseline opening inventory levels for items and locations."
        />
      </Card>

      <OpeningStockFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitTransaction={handleFormSubmit}
        items={items}
        locations={locations}
        existingOpeningStock={openingStockList}
      />

      {pendingTxn && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmTransaction}
          title="Confirm Opening Stock Entry"
          message={`Are you sure you want to record ${pendingTxn.quantity} units of opening stock at ₹${pendingTxn.unit_cost}?`}
          confirmText="Confirm & Save"
        />
      )}
    </div>
  );
};

export default OpeningStockPage;
