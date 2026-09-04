import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OutwardFormModal from '../../components/forms/OutwardFormModal';
import { DevRoleSwitcher } from '../../context/RoleContext';

import { MOCK_OUTWARD_DATA } from '../../constants/mockOutwardData';
import {
  REAL_COMPANY_ITEMS,
  REAL_COMPANY_LOCATIONS,
} from '../../constants/companyInventoryData';

import { Plus, Search, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const OutwardPage = () => {
  const [outwardList, setOutwardList] = useState(MOCK_OUTWARD_DATA);
  const [items] = useState(REAL_COMPANY_ITEMS);
  const [locations] = useState(REAL_COMPANY_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Confirm state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const filteredList = outwardList.filter(
    (row) =>
      row.outward_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.issued_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.purpose.toLowerCase().includes(searchQuery.toLowerCase())
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
        already_distributed: 0,
      };

      setOutwardList([newRecord, ...outwardList]);
      setSuccessBanner('Stock outward transaction issued successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
    }
    setConfirmOpen(false);
    setPendingTxn(null);
  };

  const columns = [
    {
      header: 'Outward No',
      key: 'outward_no',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.outward_no}</code>,
    },
    {
      header: 'Item',
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
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--warning-700)' }}>
          -{row.quantity} units
        </span>
      ),
    },
    {
      header: 'Issued To',
      key: 'issued_to',
    },
    {
      header: 'Purpose',
      key: 'purpose',
    },
    {
      header: 'Date',
      key: 'outward_date',
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
        title="Stock Outward"
        subtitle="Track stock dispatches, sales orders, issues, and consumption."
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Create Outward Entry
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
              placeholder="Search by outward no, recipient, purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredList}
          emptyTitle="No outward transactions"
          emptyDescription="Record stock dispatches and department issues."
        />
      </Card>

      <OutwardFormModal
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
          title="Confirm Stock Outward Issue"
          message={`Are you sure you want to issue Outward ${pendingTxn.outward_no} (-${pendingTxn.quantity} units to ${pendingTxn.issued_to})?`}
          confirmText="Confirm Issue"
        />
      )}
    </div>
  );
};

export default OutwardPage;
