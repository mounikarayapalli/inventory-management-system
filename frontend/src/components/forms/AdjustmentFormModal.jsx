import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { getMockAvailableStock } from '../../constants/mockStockData';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const AdjustmentFormModal = ({
  isOpen,
  onClose,
  onSubmitTransaction,
  adjustment = null,
  mode = 'add', // 'add' | 'edit' | 'view'
  items = [],
  locations = [],
}) => {
  const isView = mode === 'view';

  const [formData, setFormData] = useState({
    item_id: '',
    location_id: '',
    quantity_change: -1,
    reason: '',
    adjustment_date: new Date().toISOString().split('T')[0],
  });

  const [currentStock, setCurrentStock] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (adjustment && (mode === 'edit' || mode === 'view')) {
        const itemId = String(adjustment.item_id || items[0]?.id || '');
        const locId = String(adjustment.location_id || locations[0]?.id || '');
        setFormData({
          item_id: itemId,
          location_id: locId,
          quantity_change: adjustment.quantity_change || -1,
          reason: adjustment.reason || '',
          adjustment_date: adjustment.adjustment_date || new Date().toISOString().split('T')[0],
        });
        setCurrentStock(getMockAvailableStock(itemId, locId));
      } else {
        const defaultItemId = items.length > 0 ? String(items[0].id) : '';
        const defaultLocId = locations.length > 0 ? String(locations[0].id) : '';
        setFormData({
          item_id: defaultItemId,
          location_id: defaultLocId,
          quantity_change: -1,
          reason: '',
          adjustment_date: new Date().toISOString().split('T')[0],
        });
        setCurrentStock(getMockAvailableStock(defaultItemId, defaultLocId));
      }
      setErrors({});
    }
  }, [isOpen, adjustment, mode, items, locations]);

  const updateCurrentStock = (itemId, locId) => {
    const stock = getMockAvailableStock(itemId, locId);
    setCurrentStock(stock);
  };

  const handleItemChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, item_id: val }));
    updateCurrentStock(val, formData.location_id);
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, location_id: val }));
    updateCurrentStock(formData.item_id, val);
  };

  const changeNum = Number(formData.quantity_change) || 0;
  const expectedStock = currentStock + changeNum;
  const isNegativeStock = expectedStock < 0;

  const validate = () => {
    const errs = {};
    if (!formData.item_id) errs.item_id = 'Item selection is required';
    if (!formData.location_id) errs.location_id = 'Location selection is required';
    if (!formData.quantity_change || isNaN(formData.quantity_change) || changeNum === 0) {
      errs.quantity_change = 'Quantity change cannot be zero';
    } else if (isNegativeStock) {
      errs.quantity_change = 'Stock balance cannot become negative';
    }
    if (!formData.reason.trim()) errs.reason = 'Reason for adjustment is required';
    if (!formData.adjustment_date) errs.adjustment_date = 'Adjustment Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView) {
      onClose();
      return;
    }
    if (validate()) {
      onSubmitTransaction({
        ...formData,
        item_id: Number(formData.item_id),
        location_id: Number(formData.location_id),
        quantity_change: changeNum,
      });
    }
  };

  const itemOptions = items.map((i) => ({
    value: String(i.id),
    label: `${i.item_code} - ${i.item_name}`,
  }));

  const locationOptions = locations.map((l) => ({
    value: String(l.id),
    label: l.location_name,
  }));

  const modalTitle =
    mode === 'add'
      ? 'Create Stock Adjustment'
      : mode === 'edit'
      ? 'Edit Adjustment Entry'
      : 'Adjustment Details';

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {isView ? 'Close' : 'Cancel'}
      </Button>
      {!isView && (
        <Button variant="primary" onClick={handleSubmit} disabled={isNegativeStock}>
          {mode === 'add' ? 'Apply Adjustment' : 'Update Adjustment'}
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        {/* Stock Impact Preview Box */}
        <div
          style={{
            padding: '0.875rem 1rem',
            backgroundColor: isNegativeStock ? 'var(--error-50)' : 'var(--neutral-100)',
            border: `1px solid ${isNegativeStock ? 'var(--error-100)' : 'var(--neutral-200)'}`,
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.35rem' }}>
            Stock Balance Impact Preview
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 500 }}>
            <span>Current Stock: <strong>{currentStock}</strong></span>
            <ArrowRight size={14} style={{ color: 'var(--neutral-400)' }} />
            <span>Adjustment: <strong style={{ color: changeNum > 0 ? 'var(--success-700)' : 'var(--error-600)' }}>{changeNum > 0 ? `+${changeNum}` : changeNum}</strong></span>
            <ArrowRight size={14} style={{ color: 'var(--neutral-400)' }} />
            <span style={{ color: isNegativeStock ? 'var(--error-600)' : 'var(--neutral-900)', fontWeight: 700 }}>
              Expected: {expectedStock} units
            </span>
          </div>
        </div>

        {isNegativeStock && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--error-50)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--error-600)',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <AlertTriangle size={16} />
            <span>Stock balance cannot become negative ({expectedStock} units).</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Item"
            required
            options={itemOptions}
            value={formData.item_id}
            onChange={handleItemChange}
            error={errors.item_id}
            disabled={isView}
          />

          <Select
            label="Location"
            required
            options={locationOptions}
            value={formData.location_id}
            onChange={handleLocationChange}
            error={errors.location_id}
            disabled={isView}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Quantity Change (+ / -)"
            type="number"
            required
            placeholder="e.g. -5 or +10"
            value={formData.quantity_change}
            onChange={(e) => setFormData({ ...formData, quantity_change: e.target.value })}
            error={errors.quantity_change}
            disabled={isView}
          />

          <Input
            label="Adjustment Date"
            type="date"
            required
            value={formData.adjustment_date}
            onChange={(e) => setFormData({ ...formData, adjustment_date: e.target.value })}
            error={errors.adjustment_date}
            disabled={isView}
          />
        </div>

        <Input
          label="Reason for Adjustment"
          required
          placeholder="e.g. Damaged stock / Physical count reconciliation"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          error={errors.reason}
          disabled={isView}
        />
      </form>
    </Modal>
  );
};

export default AdjustmentFormModal;
