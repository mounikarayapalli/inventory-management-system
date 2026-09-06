import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import DistributionFormModal from '../../components/forms/DistributionFormModal';
import itemsAPI from '../../api/items';
import locationsAPI from '../../api/locations';
import transactionsAPI from '../../api/transactions';
import reportsAPI from '../../api/reports';
import { Plus, Search, CheckCircle2, Info } from 'lucide-react';

export const DistributionPage = () => {
  const [distributionList, setDistributionList] = useState([]);
  const [outwardRecords, setOutwardRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form & Confirm state
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingTxn, setPendingTxn] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [itemsRes, locationsRes, outwardReportRes, distRes] = await Promise.all([
        itemsAPI.listItems(),
        locationsAPI.listLocations(),
        reportsAPI.getOutwardReport(),
        transactionsAPI.listDistributions().catch(() => []),
      ]);
      setItems(itemsRes || []);
      setLocations(locationsRes || []);
      setOutwardRecords(outwardReportRes || []);
      setDistributionList(distRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load distribution data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredList = distributionList.filter((row) => {
    const outwardNo = row.outward_no || '';
    const itemName = row.item_name || '';
    const recipient = row.recipient || '';
    const dept = row.department || '';
    const q = searchQuery.toLowerCase();
    return (
      outwardNo.toLowerCase().includes(q) ||
      itemName.toLowerCase().includes(q) ||
      recipient.toLowerCase().includes(q) ||
      dept.toLowerCase().includes(q)
    );
  });

  const handleOpenAdd = () => {
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
      await transactionsAPI.createDistribution({
        outward_id: pendingTxn.outward_id ? Number(pendingTxn.outward_id) : null,
        item_id: Number(pendingTxn.item_id),
        location_id: pendingTxn.location_id ? Number(pendingTxn.location_id) : null,
        quantity: Number(pendingTxn.quantity),
        recipient: pendingTxn.recipient || null,
        batch: pendingTxn.batch || null,
        department: pendingTxn.department || null,
        purpose: pendingTxn.purpose || null,
        distribution_date: pendingTxn.distribution_date || null,
        remarks: pendingTxn.remarks || null,
      });

      setSuccessBanner('Stock distribution recorded successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
      setDistributionList([
        { id: Date.now(), ...pendingTxn },
        ...distributionList,
      ]);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to record distribution');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setPendingTxn(null);
    }
  };

  const columns = [
    {
      header: 'Distribution ID',
      key: 'id',
      render: (row) => <code style={{ fontSize: '0.8rem' }}>DST-{row.distribution_id || row.id}</code>,
    },
    {
      header: 'Parent Outward',
      key: 'outward_no',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.outward_no || (row.outward_id ? `OUT-${row.outward_id}` : '—')}</code>,
    },
    {
      header: 'Item',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name || `Item #${row.item_id}`}</strong>,
    },
    {
      header: 'Location',
      key: 'location_name',
      render: (row) => <span>{row.location_name || '—'}</span>,
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.quantity}</span>,
    },
    {
      header: 'Recipient',
      key: 'recipient',
      render: (row) => <span>{row.recipient || '—'}</span>,
    },
    {
      header: 'Batch',
      key: 'batch',
      render: (row) => <span>{row.batch || '—'}</span>,
    },
    {
      header: 'Department',
      key: 'department',
      render: (row) => <span>{row.department || '—'}</span>,
    },
    {
      header: 'Purpose',
      key: 'purpose',
      render: (row) => <span>{row.purpose || '—'}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Distribution"
        subtitle="Record end-user distribution details linked to parent Outward dispatches."
        actions={
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Record Distribution
          </Button>
        }
      />

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

        {loading ? (
          <LoadingState message="Loading distribution records..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <Table
            columns={columns}
            data={filteredList}
            emptyTitle="No distribution records"
            emptyDescription="Record student/department distributions linked to parent Outward dispatches."
          />
        )}
      </Card>

      <DistributionFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmitTransaction={handleFormSubmit}
        outwardRecords={outwardRecords}
        items={items}
        locations={locations}
      />

      {pendingTxn && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmTransaction}
          title="Confirm Stock Distribution Entry"
          message={`Are you sure you want to record distribution of ${pendingTxn.quantity} units to ${pendingTxn.recipient || 'recipient'}?`}
          confirmText={submitting ? 'Processing...' : 'Confirm Distribution'}
        />
      )}
    </div>
  );
};

export default DistributionPage;
