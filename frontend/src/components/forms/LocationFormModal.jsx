import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

export const LocationFormModal = ({
  isOpen,
  onClose,
  onSave,
  location = null,
  mode = 'add', // 'add' | 'edit' | 'view'
}) => {
  const isView = mode === 'view';

  const [formData, setFormData] = useState({
    location_name: '',
    description: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (location && (mode === 'edit' || mode === 'view')) {
      setFormData({
        location_name: location.location_name || '',
        description: location.description || '',
        is_active: location.is_active !== undefined ? location.is_active : true,
      });
    } else {
      setFormData({
        location_name: '',
        description: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [location, mode, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.location_name.trim()) {
      errs.location_name = 'Location Name is required';
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
      ? 'Add New Location'
      : mode === 'edit'
      ? 'Edit Location Details'
      : 'Location Details';

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {isView ? 'Close' : 'Cancel'}
      </Button>
      {!isView && (
        <Button variant="primary" onClick={handleSubmit}>
          {mode === 'add' ? 'Save Location' : 'Update Location'}
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Location Name"
          required
          placeholder="e.g. Vijayawada Hub, Vizag Hub"
          value={formData.location_name}
          onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
          error={errors.location_name}
          disabled={isView}
        />

        <Input
          label="Description"
          placeholder="Storage location description or facility notes"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <span>Active Location</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default LocationFormModal;
