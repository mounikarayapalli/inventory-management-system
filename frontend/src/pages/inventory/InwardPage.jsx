import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import InwardFormModal from '../../components/forms/InwardFormModal';
import { DevRoleSwitcher } from '../../context/RoleContext';

import { MOCK_INWARD_DATA } from '../../constants/mockInwardData';
import {
  REAL_COMPANY_ITEMS,
  REAL_COMPANY_SUPPLIERS,
  REAL_COMPANY_LOCATIONS,
} from '../../constants/companyInventoryData';

import { Plus, Search, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

export const InwardPage = () => {
  const [inwardList, setInwardList] = useState(MOCK_INWARD_DATA);
  const [items] = useState(REAL_COMPANY_ITEMS);
  const [suppliers] = useState(REAL_COMPANY_SUPPLIERS);
  const [locations] = useState(REAL_COMPANY_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Confirm state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const filteredList = inwardList.filter(
    (row) =>
      row.inward_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      const selectedSup = suppliers.find((s) => s.id === pendingTxn.supplier_id);
      const selectedLoc = locations.find((l) => l.id === pendingTxn.location_id);

      const newRecord = {
        id: Date.now(),
        ...pendingTxn,
        item_code: selectedItem ? selectedItem.item_code : 'SKU',
        item_name: selectedItem ? selectedItem.item_name : 'Item',
        supplier_name: selectedSup ? selectedSup.supplier_name : 'Supplier',
        location_name: selectedLoc ? selectedLoc.location_name : 'Location',
      };

      setInwardList([newRecord, ...inwardList]);
      setSuccessBanner('Stock inward receipt (GRN) created successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
    }
    setConfirmOpen(false);
    setPendingTxn(null);
  };

  const columns = [
    {
      header: 'Inward No',
      key: 'inward_no',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.inward_no}</code>,
    },
    {
      header: 'Item',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name}</strong>,
    },
    {
      header: 'Supplier',
      key: 'supplier_name',
    },
    {
      header: 'Location',
      key: 'location_name',
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--success-700)' }}>
          +{row.quantity} units
        </span>
      ),
    },
    {
      header: 'Unit Cost',
      key: 'unit_cost',
      render: (row) => <span>₹{Number(row.unit_cost).toFixed(2)}</span>,
    },
    {
      header: 'Total Cost',
      key: 'total_cost',
      render: (row) => (
        <strong style={{ color: 'var(--neutral-900)' }}>
          ₹{Number(row.total_cost).toFixed(2)}
        </strong>
      ),
    },
    {
      header: 'Date',
      key: 'inward_date',
    },
    {
      header: 'Remarks',
      key: 'remarks',
      render: (row) => <span style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>{row.remarks || '—'}</span>,
    },
  ];

  return (
    <div>
      <DevRoleSwitcher />

      <PageHeader
        title="Stock Inward"
        subtitle="Record received stock from suppliers, purchase orders, and goods receipts."
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Create Inward Entry
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
              placeholder="Search by GRN no, item, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredList}
          emptyTitle="No inward transactions"
          emptyDescription="Record goods receipt notes (GRN) for received inventory stock."
        />
      </Card>

      <InwardFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitTransaction={handleFormSubmit}
        items={items}
        suppliers={suppliers}
        locations={locations}
      />

      {pendingTxn && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmTransaction}
          title="Confirm Stock Inward Receipt"
          message={`Are you sure you want to record Inward ${pendingTxn.inward_no} (+${pendingTxn.quantity} units, Total Cost ₹${pendingTxn.total_cost})?`}
          confirmText="Confirm Receipt"
        />
      )}
    </div>
  );
};

export default InwardPage;
