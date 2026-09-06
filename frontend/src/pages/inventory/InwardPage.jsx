import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import InwardFormModal from '../../components/forms/InwardFormModal';
import itemsAPI from '../../api/items';
import suppliersAPI from '../../api/suppliers';
import locationsAPI from '../../api/locations';
import transactionsAPI from '../../api/transactions';
import reportsAPI from '../../api/reports';
import { Plus, Search, CheckCircle2 } from 'lucide-react';

export const InwardPage = () => {
  const [inwardList, setInwardList] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
      const [itemsRes, suppliersRes, locationsRes, inwardReportRes] = await Promise.all([
        itemsAPI.listItems(),
        suppliersAPI.listSuppliers(),
        locationsAPI.listLocations(),
        reportsAPI.getInwardReport(),
      ]);
      setItems(itemsRes || []);
      setSuppliers(suppliersRes || []);
      setLocations(locationsRes || []);
      setInwardList(inwardReportRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load inward stock receipts data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredList = inwardList.filter((row) => {
    const inwardNo = row.inward_no || '';
    const itemName = row.item_name || '';
    const supName = row.supplier_name || '';
    const locName = row.location_name || '';
    const q = searchQuery.toLowerCase();
    return (
      inwardNo.toLowerCase().includes(q) ||
      itemName.toLowerCase().includes(q) ||
      supName.toLowerCase().includes(q) ||
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
      await transactionsAPI.createInward({
        item_id: Number(pendingTxn.item_id),
        location_id: Number(pendingTxn.location_id),
        supplier_id: Number(pendingTxn.supplier_id),
        quantity: Number(pendingTxn.quantity),
        unit_cost: Number(pendingTxn.unit_cost),
        inward_no: pendingTxn.inward_no || null,
        total_cost: pendingTxn.total_cost ? Number(pendingTxn.total_cost) : null,
        inward_date: pendingTxn.inward_date || null,
        invoice_no: pendingTxn.invoice_no || null,
        remarks: pendingTxn.remarks || null,
      });

      setSuccessBanner('Stock inward receipt (GRN) created successfully.');
      setTimeout(() => setSuccessBanner(''), 4000);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to record inward stock receipt');
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setPendingTxn(null);
    }
  };

  const columns = [
    {
      header: 'Inward No',
      key: 'inward_no',
      render: (row) => <code style={{ fontSize: '0.85rem', fontWeight: 600 }}>{row.inward_no || `INW-${row.transaction_id || row.inward_id}`}</code>,
    },
    {
      header: 'Item',
      key: 'item_name',
      render: (row) => <strong style={{ color: 'var(--neutral-900)' }}>{row.item_name}</strong>,
    },
    {
      header: 'Supplier',
      key: 'supplier_name',
      render: (row) => <span>{row.supplier_name || '—'}</span>,
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
        <span style={{ fontWeight: 600, color: 'var(--success-700)' }}>
          +{row.quantity}
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
      render: (row) => <span>{row.inward_date ? new Date(row.inward_date).toLocaleDateString() : '—'}</span>,
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

        {loading ? (
          <LoadingState message="Loading stock inward receipts..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <Table
            columns={columns}
            data={filteredList}
            emptyTitle="No inward transactions"
            emptyDescription="Record goods receipt notes (GRN) for received inventory stock."
          />
        )}
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
          message={`Are you sure you want to record Inward ${pendingTxn.inward_no || ''} (+${pendingTxn.quantity} units, Total Cost ₹${pendingTxn.total_cost})?`}
          confirmText={submitting ? 'Processing...' : 'Confirm Receipt'}
        />
      )}
    </div>
  );
};

export default InwardPage;
