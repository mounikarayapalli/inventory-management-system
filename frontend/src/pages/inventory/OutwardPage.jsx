import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import OutwardFormModal from '../../components/forms/OutwardFormModal';
import itemsAPI from '../../api/items';
import locationsAPI from '../../api/locations';
import transactionsAPI from '../../api/transactions';
import reportsAPI from '../../api/reports';
import { Plus, Search, CheckCircle2 } from 'lucide-react';

export const OutwardPage = () => {
  const [outwardList, setOutwardList] = useState([]);
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
      const [itemsRes, locationsRes, outwardReportRes] = await Promise.all([
        itemsAPI.listItems(),
        locationsAPI.listLocations(),
        reportsAPI.getOutwardReport(),
      ]);
      setItems(itemsRes || []);
      setLocations(locationsRes || []);
      setOutwardList(outwardReportRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load outward stock dispatches data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredList = outwardList.filter((row) => {
    const outwardNo = row.outward_no || '';
    const itemName = row.item_name || '';
    const issuedTo = row.issued_to || row.recipient || '';
    const purpose = row.purpose || '';
    const q = searchQuery.toLowerCase();
    return (
      outwardNo.toLowerCase().includes(q) ||
      itemName.toLowerCase().includes(q) ||
      issuedTo.toLowerCase().includes(q) ||
      purpose.toLowerCase().includes(q)
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
      await transactionsAPI.createOutward({
        item_id: Number(pendingTxn.item_id),
        location_id: Number(pendingTxn.location_id),
        quantity: Number(pendingTxn.quantity),
        outward_no: pendingTxn.outward_no || null,
        issued_to: pendingTxn.issued_to || null,
        purpose: pendingTxn.purpose || null,
        outward_date: pendingTxn.outward_date || null,
        reference_no: pendingTxn.reference_no || null,
        remarks: pendingTxn.remarks || null,
      });

      setSuccessBanner('Stock outward transaction issued successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to record outward stock dispatch');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setPendingTxn(null);
    }
  };

  const columns = [
    {
      header: 'Outward No',
      key: 'outward_no',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.outward_no || `OUT-${row.transaction_id || row.outward_id}`}</code>,
    },
    {
      header: 'Item',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name}</strong>,
    },
    {
      header: 'Location',
      key: 'location_name',
      render: (row) => <span>{row.location_name || '—'}</span>,
    },
    {
      header: 'Quantity',
      key: 'quantity',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--warning-700)' }}>
          -{row.quantity}
        </span>
      ),
    },
    {
      header: 'Issued To',
      key: 'issued_to',
      render: (row) => <span>{row.issued_to || row.recipient || '—'}</span>,
    },
    {
      header: 'Purpose',
      key: 'purpose',
      render: (row) => <span>{row.purpose || '—'}</span>,
    },
    {
      header: 'Date',
      key: 'outward_date',
      render: (row) => <span>{row.outward_date ? new Date(row.outward_date).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div>
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

        {loading ? (
          <LoadingState message="Loading outward stock dispatches..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <Table
            columns={columns}
            data={filteredList}
            emptyTitle="No outward transactions"
            emptyDescription="Record stock dispatches and department issues."
          />
        )}
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
          message={`Are you sure you want to issue Outward ${pendingTxn.outward_no || ''} (-${pendingTxn.quantity} units to ${pendingTxn.issued_to || 'recipient'})?`}
          confirmText={submitting ? 'Processing...' : 'Confirm Issue'}
        />
      )}
    </div>
  );
};

export default OutwardPage;
