import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export const OpeningStockFormModal = ({
  isOpen,
  onClose,
  onSubmitTransaction,
  items = [],
  locations = [],
  existingOpeningStock = [],
}) => {
  const [formData, setFormData] = useState({
    item_id: '',
    location_id: '',
    quantity: 100,
    unit_cost: 0,
    opening_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultItemId = items.length > 0 ? String(items[0].id) : '';
      const defaultLocId = locations.length > 0 ? String(locations[0].id) : '';
      setFormData({
        item_id: defaultItemId,
        location_id: defaultLocId,
        quantity: 100,
        unit_cost: items.length > 0 && items[0].default_unit_cost ? items[0].default_unit_cost : 0,
        opening_date: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      setErrors({});
      checkDuplicate(defaultItemId, defaultLocId);
    }
  }, [isOpen, items, locations]);

  const checkDuplicate = (itemId, locId) => {
    if (!itemId || !locId) {
      setDuplicateWarning(false);
      return;
    }
    const exists = existingOpeningStock.some(
      (rec) => rec.item_id === Number(itemId) && rec.location_id === Number(locId)
    );
    setDuplicateWarning(exists);
  };

  const handleItemChange = (e) => {
    const val = e.target.value;
    const selectedItem = items.find((i) => String(i.id) === val);
    const unitCost = selectedItem && selectedItem.default_unit_cost ? selectedItem.default_unit_cost : 0;
    setFormData((prev) => ({ ...prev, item_id: val, unit_cost: unitCost }));
    checkDuplicate(val, formData.location_id);
  };

  const handleLocationChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, location_id: val }));
    checkDuplicate(formData.item_id, val);
  };

  const validate = () => {
    const errs = {};
    if (!formData.item_id) errs.item_id = 'Item selection is required';
    if (!formData.location_id) errs.location_id = 'Location selection is required';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than zero';
    }
    if (formData.unit_cost === '' || isNaN(formData.unit_cost) || Number(formData.unit_cost) < 0) {
      errs.unit_cost = 'Unit cost must be a valid non-negative number';
    }
    if (!formData.opening_date) errs.opening_date = 'Opening date is required';

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
        unit_cost: Number(formData.unit_cost),
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
      <Button variant="primary" onClick={handleSubmit}>
        Record Opening Stock
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Opening Stock" footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        {duplicateWarning && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--warning-50)',
              border: '1px solid var(--warning-100)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--warning-700)',
              fontSize: '0.825rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong>Duplicate Entry Warning:</strong> An opening stock record already exists for this Item and Location pair.
            </div>
          </div>
        )}

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Quantity"
            type="number"
            required
            placeholder="e.g. 100"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            error={errors.quantity}
          />

          <Input
            label="Unit Cost (₹)"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={formData.unit_cost}
            onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
            error={errors.unit_cost}
          />
        </div>

        <Input
          label="Opening Date"
          type="date"
          required
          value={formData.opening_date}
          onChange={(e) => setFormData({ ...formData, opening_date: e.target.value })}
          error={errors.opening_date}
        />

        <Input
          label="Remarks (Optional)"
          placeholder="e.g. Initial baseline stock"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
        />
      </form>
    </Modal>
  );
};

export default OpeningStockFormModal;
