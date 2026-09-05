import React, { useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DistributionFormModal from '../../components/forms/DistributionFormModal';
import { DevRoleSwitcher } from '../../context/RoleContext';

import { MOCK_DISTRIBUTION_DATA } from '../../constants/mockDistributionData';
import { MOCK_OUTWARD_DATA } from '../../constants/mockOutwardData';

import { Plus, Search, GitFork, CheckCircle2, Info } from 'lucide-react';

export const DistributionPage = () => {
  const [distributionList, setDistributionList] = useState(MOCK_DISTRIBUTION_DATA);
  const [outwardRecords, setOutwardRecords] = useState(MOCK_OUTWARD_DATA);
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Confirm state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const filteredList = distributionList.filter(
    (row) =>
      row.outward_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.department.toLowerCase().includes(searchQuery.toLowerCase())
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
      const newRecord = {
        id: Date.now(),
        ...pendingTxn,
      };

      setDistributionList([newRecord, ...distributionList]);

      // Update parent outward's already_distributed count
      setOutwardRecords(
        outwardRecords.map((o) =>
          o.id === pendingTxn.outward_id
            ? { ...o, already_distributed: (o.already_distributed || 0) + pendingTxn.quantity }
            : o
        )
      );

      setSuccessBanner('Stock distribution recorded successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
    }
    setConfirmOpen(false);
    setPendingTxn(null);
  };

  const columns = [
    {
      header: 'Distribution ID',
      key: 'id',
      render: (row) => <code style={{ fontSize: '0.8rem' }}>DST-{row.id}</code>,
    },
    {
      header: 'Parent Outward No',
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
      render: (row) => <span style={{ fontWeight: 600 }}>{row.quantity} units</span>,
    },
    {
      header: 'Recipient',
      key: 'recipient',
    },
    {
      header: 'Batch',
      key: 'batch',
      render: (row) => <span>{row.batch || '—'}</span>,
    },
    {
      header: 'Department',
      key: 'department',
    },
    {
      header: 'Purpose',
      key: 'purpose',
    },
    {
      header: 'Date',
      key: 'distribution_date',
    },
  ];

  return (
    <div>
      <DevRoleSwitcher />

      <PageHeader
        title="Stock Distribution"
        subtitle="Record end-user distribution details linked to parent Outward dispatches."
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Record Distribution
          </Button>
        }
      />

      {/* Info Banner */}
      <div
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--info-50)',
          border: '1px solid var(--info-100)',
          borderRadius: 'var(--border-radius-md)',
          color: 'var(--info-700)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <Info size={18} />
        <span>
          <strong>Note:</strong> Distribution is a detail of Outward dispatches. Distribution records do <em>not</em> create stock movements or deduct stock again.
        </span>
      </div>

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
              placeholder="Search distribution by recipient, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredList}
          emptyTitle="No distribution records"
          emptyDescription="Record student/department distributions linked to parent Outward dispatches."
        />
      </Card>

      <DistributionFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitTransaction={handleFormSubmit}
        outwardRecords={outwardRecords}
      />

      {pendingTxn && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmTransaction}
          title="Confirm Stock Distribution Entry"
          message={`Are you sure you want to record distribution of ${pendingTxn.quantity} units for Outward ${pendingTxn.outward_no} to ${pendingTxn.recipient}?`}
          confirmText="Confirm Distribution"
        />
      )}
    </div>
  );
};

export default DistributionPage;
