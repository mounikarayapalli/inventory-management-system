import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export const UserFormModal = ({ isOpen, onClose, onSubmit, initialData = null, isSubmitting = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'stock manager',
    is_active: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        password: '', // Leave blank when editing unless changing password
        role: initialData.role || 'stock manager',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'stock manager',
        is_active: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.username.trim() || formData.username.length < 3) {
      errs.username = 'Username must be at least 3 characters long.';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Valid email is required.';
    }
    if (!initialData && (!formData.password || formData.password.length < 6)) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (initialData && formData.password && formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters if changing.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      username: formData.username.trim(),
      email: formData.email.trim(),
      role: formData.role,
      is_active: formData.is_active,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Edit User: ${initialData.username}` : 'Add New System User'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
            Username <span style={{ color: 'var(--error-600)' }}>*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="e.g. john_doe"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: errors.username ? '1px solid var(--error-500)' : '1px solid var(--neutral-300)',
            }}
          />
          {errors.username && <span style={{ color: 'var(--error-600)', fontSize: '0.75rem' }}>{errors.username}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
            Email Address <span style={{ color: 'var(--error-600)' }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. john@calibo.com"
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: errors.email ? '1px solid var(--error-500)' : '1px solid var(--neutral-300)',
            }}
          />
          {errors.email && <span style={{ color: 'var(--error-600)', fontSize: '0.75rem' }}>{errors.email}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
            Password {!initialData && <span style={{ color: 'var(--error-600)' }}>*</span>}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={initialData ? 'Leave blank to keep unchanged' : 'Min 6 characters'}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: errors.password ? '1px solid var(--error-500)' : '1px solid var(--neutral-300)',
            }}
          />
          {errors.password && <span style={{ color: 'var(--error-600)', fontSize: '0.75rem' }}>{errors.password}</span>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem' }}>
            System Role <span style={{ color: 'var(--error-600)' }}>*</span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--neutral-300)',
            }}
          >
            <option value="admin">Admin</option>
            <option value="stock manager">Stock Manager</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
          />
          <label htmlFor="is_active" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
            Active Account
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {initialData ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
