import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import ReturnFormModal from '../../components/forms/ReturnFormModal';
import itemsAPI from '../../api/items';
import locationsAPI from '../../api/locations';
import transactionsAPI from '../../api/transactions';
import stockAPI from '../../api/stock';
import { Plus, Search, CheckCircle2 } from 'lucide-react';

export const ReturnsPage = () => {
  const [returnsList, setReturnsList] = useState([]);
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
      const [itemsRes, locationsRes, movementsRes] = await Promise.all([
        itemsAPI.listItems(),
        locationsAPI.listLocations(),
        stockAPI.listMovements(),
      ]);
      setItems(itemsRes || []);
      setLocations(locationsRes || []);

      const returnMovements = (movementsRes || []).filter(
        (m) => m.movement_type === 'RETURN'
      );
      setReturnsList(returnMovements);
    } catch (err) {
      setError(err.message || 'Failed to load stock returns data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredList = returnsList.filter((row) => {
    const itemName = row.item_name || '';
    const remarks = row.remarks || '';
    const locName = row.location_name || '';
    const q = searchQuery.toLowerCase();
    return (
      itemName.toLowerCase().includes(q) ||
      remarks.toLowerCase().includes(q) ||
      locName.toLowerCase().includes(q)
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
      await transactionsAPI.createReturn({
        item_id: Number(pendingTxn.item_id),
        location_id: Number(pendingTxn.location_id),
        quantity: Number(pendingTxn.quantity),
        source: pendingTxn.source || 'department',
        return_type: pendingTxn.return_type || 'customer',
        reason: pendingTxn.reason || null,
        return_date: pendingTxn.return_date || null,
        remarks: pendingTxn.remarks || null,
      });

      setSuccessBanner('Stock return recorded successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to record stock return');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setPendingTxn(null);
    }
  };

  const columns = [
    {
      header: 'Movement ID',
      key: 'id',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.id}</code>,
    },
    {
      header: 'Item Name',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name || `Item #${row.item_id}`}</strong>,
    },
    {
      header: 'Location',
      key: 'location_name',
      render: (row) => <span>{row.location_name || `Location #${row.location_id}`}</span>,
    },
    {
      header: 'Quantity Returned',
      key: 'quantity',
      render: (row) => (
        <span style={{ fontWeight: 600, color: 'var(--info-700)' }}>
          +{row.quantity}
        </span>
      ),
    },
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (row) => <span>{row.timestamp ? new Date(row.timestamp).toLocaleString() : '—'}</span>,
    },
    {
      header: 'Remarks',
      key: 'remarks',
      render: (row) => <span style={{ fontSize: '0.8rem', color: 'var(--neutral-600)' }}>{row.remarks || '—'}</span>,
    },
  ];

  return (
    <div>
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
              placeholder="Search by item, location, remarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading stock returns..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <Table
            columns={columns}
            data={filteredList}
            emptyTitle="No stock returns"
            emptyDescription="Record returned stock entries from departments or customers."
          />
        )}
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
          message={`Are you sure you want to record Return of +${pendingTxn.quantity} units?`}
          confirmText={submitting ? 'Processing...' : 'Confirm Return'}
        />
      )}
    </div>
  );
};

export default ReturnsPage;
