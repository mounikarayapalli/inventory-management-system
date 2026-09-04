import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';

export const ItemFormModal = ({
  isOpen,
  onClose,
  onSave,
  item = null,
  mode = 'add', // 'add' | 'edit' | 'view'
  categories = [],
}) => {
  const isView = mode === 'view';

  const [formData, setFormData] = useState({
    item_code: '',
    item_name: '',
    category_id: '',
    unit: 'PCS',
    minimum_level: 10,
    default_unit_cost: 0,
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item && (mode === 'edit' || mode === 'view')) {
      setFormData({
        item_code: item.item_code || '',
        item_name: item.item_name || '',
        category_id: item.category_id ? String(item.category_id) : '',
        unit: item.unit || 'PCS',
        minimum_level: item.minimum_level !== undefined ? item.minimum_level : 10,
        default_unit_cost: item.default_unit_cost !== undefined ? item.default_unit_cost : 0,
        is_active: item.is_active !== undefined ? item.is_active : true,
      });
    } else {
      setFormData({
        item_code: '',
        item_name: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        unit: 'PCS',
        minimum_level: 10,
        default_unit_cost: 0,
        is_active: true,
      });
    }
    setErrors({});
  }, [item, mode, isOpen, categories]);

  const validate = () => {
    const errs = {};
    if (!formData.item_code.trim()) {
      errs.item_code = 'Item Code is required';
    }
    if (!formData.item_name.trim()) {
      errs.item_name = 'Item Name is required';
    }
    if (!formData.category_id) {
      errs.category_id = 'Category selection is required';
    }
    if (formData.minimum_level === '' || isNaN(formData.minimum_level) || Number(formData.minimum_level) < 0) {
      errs.minimum_level = 'Minimum Level must be a non-negative number';
    }
    if (formData.default_unit_cost === '' || isNaN(formData.default_unit_cost) || Number(formData.default_unit_cost) < 0) {
      errs.default_unit_cost = 'Default Unit Cost must be a non-negative number';
    }
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
      onSave({
        ...formData,
        category_id: Number(formData.category_id),
        minimum_level: Number(formData.minimum_level),
        default_unit_cost: Number(formData.default_unit_cost),
      });
      onClose();
    }
  };

  const modalTitle =
    mode === 'add'
      ? 'Add New Item'
      : mode === 'edit'
      ? 'Edit Inventory Item'
      : 'Item Details';

  const categoryOptions = categories.map((cat) => ({
    value: String(cat.id),
    label: cat.category_name,
  }));

  const unitOptions = [
    { value: 'PCS', label: 'PCS (Pieces)' },
    { value: 'SET', label: 'SET (Sets)' },
    { value: 'BOX', label: 'BOX (Boxes)' },
    { value: 'KG', label: 'KG (Kilograms)' },
    { value: 'MTR', label: 'MTR (Meters)' },
  ];

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {isView ? 'Close' : 'Cancel'}
      </Button>
      {!isView && (
        <Button variant="primary" onClick={handleSubmit}>
          {mode === 'add' ? 'Save Item' : 'Update Item'}
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Item Code"
            required
            placeholder="e.g. S101"
            value={formData.item_code}
            onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
            error={errors.item_code}
            disabled={isView}
          />

          <Select
            label="Category"
            required
            options={categoryOptions}
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            error={errors.category_id}
            disabled={isView}
          />
        </div>

        <Input
          label="Item Name"
          required
          placeholder="e.g. Laptop Bags + Water Bottles"
          value={formData.item_name}
          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
          error={errors.item_name}
          disabled={isView}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <Select
            label="Unit"
            options={unitOptions}
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            disabled={isView}
          />

          <Input
            label="Minimum Level"
            type="number"
            placeholder="10"
            value={formData.minimum_level}
            onChange={(e) => setFormData({ ...formData, minimum_level: e.target.value })}
            error={errors.minimum_level}
            disabled={isView}
          />

          <Input
            label="Default Unit Cost (₹)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.default_unit_cost}
            onChange={(e) => setFormData({ ...formData, default_unit_cost: e.target.value })}
            error={errors.default_unit_cost}
            disabled={isView}
          />
        </div>

        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isView ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={isView}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
            />
            <span>Active Status</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default ItemFormModal;
