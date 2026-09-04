import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

export const InwardFormModal = ({
  isOpen,
  onClose,
  onSubmitTransaction,
  items = [],
  suppliers = [],
  locations = [],
}) => {
  const [formData, setFormData] = useState({
    inward_no: 'GRN-' + Math.floor(1000 + Math.random() * 9000),
    item_id: '',
    supplier_id: '',
    location_id: '',
    quantity: 50,
    unit_cost: 0,
    inward_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const defaultItemId = items.length > 0 ? String(items[0].id) : '';
      const defaultSupId = suppliers.length > 0 ? String(suppliers[0].id) : '';
      const defaultLocId = locations.length > 0 ? String(locations[0].id) : '';
      const defaultItemCost = items.length > 0 && items[0].default_unit_cost ? items[0].default_unit_cost : 0;

      setFormData({
        inward_no: 'GRN-' + Math.floor(1000 + Math.random() * 9000),
        item_id: defaultItemId,
        supplier_id: defaultSupId,
        location_id: defaultLocId,
        quantity: 50,
        unit_cost: defaultItemCost,
        inward_date: new Date().toISOString().split('T')[0],
        remarks: '',
      });
      setErrors({});
    }
  }, [isOpen, items, suppliers, locations]);

  const handleItemChange = (e) => {
    const val = e.target.value;
    const selectedItem = items.find((i) => String(i.id) === val);
    const unitCost = selectedItem && selectedItem.default_unit_cost ? selectedItem.default_unit_cost : 0;
    setFormData((prev) => ({ ...prev, item_id: val, unit_cost: unitCost }));
  };

  const totalCostPreview =
    !isNaN(formData.quantity) && !isNaN(formData.unit_cost)
      ? (Number(formData.quantity) * Number(formData.unit_cost)).toFixed(2)
      : '0.00';

  const validate = () => {
    const errs = {};
    if (!formData.inward_no.trim()) errs.inward_no = 'Inward No (GRN) is required';
    if (!formData.item_id) errs.item_id = 'Item selection is required';
    if (!formData.supplier_id) errs.supplier_id = 'Supplier selection is required';
    if (!formData.location_id) errs.location_id = 'Location selection is required';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than zero';
    }
    if (formData.unit_cost === '' || isNaN(formData.unit_cost) || Number(formData.unit_cost) < 0) {
      errs.unit_cost = 'Unit Cost must be a non-negative number';
    }
    if (!formData.inward_date) errs.inward_date = 'Inward Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmitTransaction({
        ...formData,
        item_id: Number(formData.item_id),
        supplier_id: Number(formData.supplier_id),
        location_id: Number(formData.location_id),
        quantity: Number(formData.quantity),
        unit_cost: Number(formData.unit_cost),
        total_cost: Number(totalCostPreview),
      });
    }
  };

  const itemOptions = items.map((i) => ({
    value: String(i.id),
    label: `${i.item_code} - ${i.item_name}`,
  }));

  const supplierOptions = suppliers.map((s) => ({
    value: String(s.id),
    label: s.supplier_name,
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
        Save Inward Receipt
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Stock Inward Entry" footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Inward No (GRN)"
            required
            placeholder="e.g. GRN-9012"
            value={formData.inward_no}
            onChange={(e) => setFormData({ ...formData, inward_no: e.target.value })}
            error={errors.inward_no}
          />

          <Select
            label="Supplier"
            required
            options={supplierOptions}
            value={formData.supplier_id}
            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
            error={errors.supplier_id}
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
            onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
            error={errors.location_id}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <Input
            label="Quantity"
            type="number"
            required
            placeholder="50"
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

          <div className="form-group">
            <label className="form-label">Total Cost Preview</label>
            <div className="form-control" style={{ backgroundColor: 'var(--neutral-100)', fontWeight: 600 }}>
              ₹{totalCostPreview}
            </div>
          </div>
        </div>

        <Input
          label="Inward Date"
          type="date"
          required
          value={formData.inward_date}
          onChange={(e) => setFormData({ ...formData, inward_date: e.target.value })}
          error={errors.inward_date}
        />

        <Input
          label="Remarks (Optional)"
          placeholder="e.g. Purchase order receipt notes"
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
        />
      </form>
    </Modal>
  );
};

export default InwardFormModal;
