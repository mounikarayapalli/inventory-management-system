import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

export const ReturnFormModal = ({
  isOpen,
  onClose,
  onSubmitTransaction,
  items = [],
  locations = [],
}) => {
  const [formData, setFormData] = useState({
    item_id: '',
    location_id: '',
    quantity: 5,
    source: '',
    reason: '',
    return_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const defaultItemId = items.length > 0 ? String(items[0].id) : '';
      const defaultLocId = locations.length > 0 ? String(locations[0].id) : '';
      setFormData({
        item_id: defaultItemId,
        location_id: defaultLocId,
        quantity: 5,
        source: '',
        reason: '',
        return_date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [isOpen, items, locations]);

  const validate = () => {
    const errs = {};
    if (!formData.item_id) errs.item_id = 'Item selection is required';
    if (!formData.location_id) errs.location_id = 'Location selection is required';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than zero';
    }
    if (!formData.source.trim()) errs.source = 'Source (Department/Vendor) is required';
    if (!formData.reason.trim()) errs.reason = 'Reason for return is required';
    if (!formData.return_date) errs.return_date = 'Return Date is required';

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
      <Button variant="primary" onClick={handleSubmit}>
        Record Stock Return
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Stock Return" footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Select
            label="Item"
            required
            options={itemOptions}
            value={formData.item_id}
            onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
            error={errors.item_id}
          />

          <Select
            label="Location"
            required
            options={locationOptions}
            value={formData.location_id}
            onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
            error={errors.location_id}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Quantity Returned"
            type="number"
            required
            placeholder="5"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            error={errors.quantity}
          />

          <Input
            label="Source (Department/Vendor)"
            required
            placeholder="e.g. Admissions Team / Vendor Team"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            error={errors.source}
          />
        </div>

        <Input
          label="Reason for Return"
          required
          placeholder="e.g. Unused event surplus / Size exchange return"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          error={errors.reason}
        />

        <Input
          label="Return Date"
          type="date"
          required
          value={formData.return_date}
          onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
          error={errors.return_date}
        />
      </form>
    </Modal>
  );
};

export default ReturnFormModal;
