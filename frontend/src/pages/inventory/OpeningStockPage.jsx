import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import OpeningStockFormModal from '../../components/forms/OpeningStockFormModal';
import itemsAPI from '../../api/items';
import locationsAPI from '../../api/locations';
import transactionsAPI from '../../api/transactions';
import stockAPI from '../../api/stock';
import { Plus, Search, CheckCircle2 } from 'lucide-react';

export const OpeningStockPage = () => {
  const [openingStockList, setOpeningStockList] = useState([]);
  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form Modal & Confirm Dialog state
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
      
      // Filter for OPENING movements from chronological log
      const openingMovements = (movementsRes || []).filter(
        (m) => m.movement_type === 'OPENING'
      );
      setOpeningStockList(openingMovements);
    } catch (err) {
      setError(err.message || 'Failed to load opening stock data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredList = openingStockList.filter((row) => {
    const itemName = row.item_name || '';
    const locName = row.location_name || '';
    const refNo = row.reference_no || row.reference_id || '';
    const q = searchQuery.toLowerCase();
    return (
      itemName.toLowerCase().includes(q) ||
      locName.toLowerCase().includes(q) ||
      String(refNo).toLowerCase().includes(q)
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
      await transactionsAPI.createOpeningStock({
        item_id: Number(pendingTxn.item_id),
        location_id: Number(pendingTxn.location_id),
        quantity: Number(pendingTxn.quantity),
        unit_cost: Number(pendingTxn.unit_cost || 0),
        opening_date: pendingTxn.opening_date || null,
        remarks: pendingTxn.remarks || null,
      });

      setSuccessBanner('Opening stock record created successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to record opening stock');
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
      header: 'Quantity',
      key: 'quantity',
      render: (row) => <span style={{ fontWeight: 600 }}>{row.quantity}</span>,
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
              placeholder="Search by item or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              rightIcon={<Search size={16} />}
            />
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading opening stock records..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <Table
            columns={columns}
            data={filteredList}
            emptyTitle="No opening stock records"
            emptyDescription="Record baseline opening inventory levels for items and locations."
          />
        )}
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
          confirmText={submitting ? 'Saving...' : 'Confirm & Save'}
        />
      )}
    </div>
  );
};

export default OpeningStockPage;
