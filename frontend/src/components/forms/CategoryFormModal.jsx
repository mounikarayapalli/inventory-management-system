import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';

export const CategoryFormModal = ({
  isOpen,
  onClose,
  onSave,
  category = null,
  mode = 'add', // 'add' | 'edit' | 'view'
}) => {
  const isView = mode === 'view';

  const [formData, setFormData] = useState({
    category_name: '',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (category && (mode === 'edit' || mode === 'view')) {
      setFormData({
        category_name: category.category_name || '',
        is_active: category.is_active !== undefined ? category.is_active : true,
      });
    } else {
      setFormData({
        category_name: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [category, mode, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.category_name.trim()) {
      errs.category_name = 'Category Name is required';
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
      ? 'Add New Category'
      : mode === 'edit'
      ? 'Edit Item Category'
      : 'Category Details';

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {isView ? 'Close' : 'Cancel'}
      </Button>
      {!isView && (
        <Button variant="primary" onClick={handleSubmit}>
          {mode === 'add' ? 'Save Category' : 'Update Category'}
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Category Name"
          required
          placeholder="e.g. Branding, T Shirts, Goodies"
          value={formData.category_name}
          onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
          error={errors.category_name}
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
            <span>Active Category</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
