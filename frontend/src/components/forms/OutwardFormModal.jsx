import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { getMockAvailableStock } from '../../constants/mockStockData';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export const OutwardFormModal = ({
  isOpen,
  onClose,
  onSubmitTransaction,
  items = [],
  locations = [],
}) => {
  const [formData, setFormData] = useState({
    outward_no: 'OUT-' + Math.floor(1000 + Math.random() * 9000),
    item_id: '',
    location_id: '',
    quantity: 10,
    issued_to: '',
    purpose: '',
    outward_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [availableStock, setAvailableStock] = useState(0);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const defaultItemId = items.length > 0 ? String(items[0].id) : '';
      const defaultLocId = locations.length > 0 ? String(locations[0].id) : '';
      const stock = getMockAvailableStock(defaultItemId, defaultLocId);

      setFormData({
        outward_no: 'OUT-' + Math.floor(1000 + Math.random() * 9000),
        item_id: defaultItemId,
        location_id: defaultLocId,
        quantity: 10,
        issued_to: '',
        purpose: '',
        outward_date: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      setAvailableStock(stock);
      setErrors({});
    }
  }, [isOpen, items, locations]);

  const updateAvailableStock = (itemId, locId) => {
    const stock = getMockAvailableStock(itemId, locId);
    setAvailableStock(stock);
  };

  const handleItemChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, item_id: val }));
    updateAvailableStock(val, formData.location_id);
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, location_id: val }));
    updateAvailableStock(formData.item_id, val);
  };

  const isExceedingStock =
    !isNaN(formData.quantity) && Number(formData.quantity) > availableStock;

  const validate = () => {
    const errs = {};
    if (!formData.outward_no.trim()) errs.outward_no = 'Outward No is required';
    if (!formData.item_id) errs.item_id = 'Item selection is required';
    if (!formData.location_id) errs.location_id = 'Location selection is required';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than zero';
    } else if (isExceedingStock) {
      errs.quantity = `Requested quantity exceeds available stock of ${availableStock} units.`;
    }
    if (!formData.issued_to.trim()) errs.issued_to = 'Issued To (Recipient/Department) is required';
    if (!formData.purpose.trim()) errs.purpose = 'Purpose is required';
    if (!formData.outward_date) errs.outward_date = 'Outward Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmitTransaction({
        ...formData,
        item_id: Number(formData.item_id),
        location_id: Number(formData.location_id),
        quantity: Number(formData.quantity),
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

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={isExceedingStock}
      >
        Issue Outward Dispatch
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Stock Outward Entry" footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        {/* Available Stock Indicator */}
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: isExceedingStock ? 'var(--error-50)' : 'var(--primary-50)',
            border: `1px solid ${isExceedingStock ? 'var(--error-100)' : 'var(--primary-200)'}`,
            borderRadius: 'var(--border-radius-md)',
            color: isExceedingStock ? 'var(--error-700)' : 'var(--primary-800)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isExceedingStock ? (
              <AlertTriangle size={18} style={{ color: 'var(--error-600)' }} />
            ) : (
              <CheckCircle2 size={18} style={{ color: 'var(--primary-600)' }} />
            )}
            <span>
              Available Stock Balance: <strong>{availableStock} units</strong>
            </span>
          </div>
        </div>

        {isExceedingStock && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'var(--error-50)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--error-600)',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              fontWeight: 500,
            }}
          >
            ⚠️ Requested quantity ({formData.quantity}) exceeds available stock ({availableStock} units). Dispatch submission disabled.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Outward No"
            required
            placeholder="e.g. OUT-1042"
            value={formData.outward_no}
            onChange={(e) => setFormData({ ...formData, outward_no: e.target.value })}
            error={errors.outward_no}
          />

          <Input
            label="Quantity"
            type="number"
            required
            placeholder="10"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            error={errors.quantity}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Item"
            required
            options={itemOptions}
            value={formData.item_id}
            onChange={handleItemChange}
            error={errors.item_id}
          />

          <Select
            label="Location"
            required
            options={locationOptions}
            value={formData.location_id}
            onChange={handleLocationChange}
            error={errors.location_id}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Issued To (Recipient)"
            required
            placeholder="e.g. Admissions Team / Jagan"
            value={formData.issued_to}
            onChange={(e) => setFormData({ ...formData, issued_to: e.target.value })}
            error={errors.issued_to}
          />

          <Input
            label="Purpose"
            required
            placeholder="e.g. KL Event / Campus Drive"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            error={errors.purpose}
          />
        </div>

        <Input
          label="Outward Date"
          type="date"
          required
          value={formData.outward_date}
          onChange={(e) => setFormData({ ...formData, outward_date: e.target.value })}
          error={errors.outward_date}
        />

        <Input
          label="Remarks (Optional)"
          placeholder="e.g. Issue comments"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
        />
      </form>
    </Modal>
  );
};

export default OutwardFormModal;
