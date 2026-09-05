import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

export const SupplierFormModal = ({
  isOpen,
  onClose,
  onSave,
  supplier = null,
  mode = 'add', // 'add' | 'edit' | 'view'
}) => {
  const isView = mode === 'view';

  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (supplier && (mode === 'edit' || mode === 'view')) {
      setFormData({
        supplier_name: supplier.supplier_name || '',
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        is_active: supplier.is_active !== undefined ? supplier.is_active : true,
      });
    } else {
      setFormData({
        supplier_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [supplier, mode, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.supplier_name.trim()) {
      errs.supplier_name = 'Supplier Name is required';
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (formData.phone && formData.phone.length < 5) {
      errs.phone = 'Please enter a valid phone number';
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
      onSave(formData);
      onClose();
    }
  };

  const modalTitle =
    mode === 'add'
      ? 'Add New Supplier'
      : mode === 'edit'
      ? 'Edit Supplier Information'
      : 'Supplier Details';

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {isView ? 'Close' : 'Cancel'}
      </Button>
      {!isView && (
        <Button variant="primary" onClick={handleSubmit}>
          {mode === 'add' ? 'Save Supplier' : 'Update Supplier'}
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Supplier Name"
          required
          placeholder="e.g. Red Chariot, Local Print"
          value={formData.supplier_name}
          onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
          error={errors.supplier_name}
          disabled={isView}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Contact Person"
            placeholder="Contact manager name"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            disabled={isView}
          />

          <Input
            label="Phone"
            placeholder="+91 98480 12345"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={errors.phone}
            disabled={isView}
          />
        </div>

        <Input
          label="Email"
          type="email"
          placeholder="vendor@company.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          disabled={isView}
        />

        <Input
          label="Address"
          placeholder="Vendor office/factory address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          disabled={isView}
        />

        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isView ? 'default' : 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              disabled={isView}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary-600)' }}
            />
            <span>Active Supplier</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierFormModal;
