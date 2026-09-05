import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import { AlertTriangle, Info } from 'lucide-react';

export const DistributionFormModal = ({
  isOpen,
  onClose,
  onSubmitTransaction,
  outwardRecords = [],
}) => {
  const [selectedOutwardId, setSelectedOutwardId] = useState('');
  const [parentOutward, setParentOutward] = useState(null);

  const [formData, setFormData] = useState({
    quantity: 10,
    recipient: '',
    batch: '',
    department: '',
    purpose: '',
    distribution_date: new Date().toISOString().split('T')[0],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      const defaultOutward = outwardRecords.length > 0 ? outwardRecords[0] : null;
      const defaultId = defaultOutward ? String(defaultOutward.id) : '';
      setSelectedOutwardId(defaultId);
      setParentOutward(defaultOutward);

      const remaining = defaultOutward
        ? defaultOutward.quantity - (defaultOutward.already_distributed || 0)
        : 10;

      setFormData({
        quantity: Math.max(1, Math.min(10, remaining)),
        recipient: '',
        batch: '',
        department: '',
        purpose: defaultOutward ? defaultOutward.purpose : '',
        distribution_date: new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [isOpen, outwardRecords]);

  const handleOutwardChange = (e) => {
    const val = e.target.value;
    setSelectedOutwardId(val);
    const found = outwardRecords.find((o) => String(o.id) === val);
    setParentOutward(found || null);

    if (found) {
      const remaining = found.quantity - (found.already_distributed || 0);
      setFormData((prev) => ({
        ...prev,
        quantity: Math.max(1, Math.min(prev.quantity, remaining)),
        purpose: found.purpose || '',
      }));
    }
  };

  const totalOutwardQty = parentOutward ? parentOutward.quantity : 0;
  const alreadyDistributedQty = parentOutward ? parentOutward.already_distributed || 0 : 0;
  const remainingDistributableQty = Math.max(0, totalOutwardQty - alreadyDistributedQty);

  const isExceedingRemaining =
    !isNaN(formData.quantity) && Number(formData.quantity) > remainingDistributableQty;

  const validate = () => {
    const errs = {};
    if (!selectedOutwardId) errs.outward_id = 'Parent Outward selection is required';
    if (!formData.quantity || isNaN(formData.quantity) || Number(formData.quantity) <= 0) {
      errs.quantity = 'Quantity must be greater than zero';
    } else if (isExceedingRemaining) {
      errs.quantity = `Distribution quantity cannot exceed the remaining quantity of ${remainingDistributableQty}.`;
    }
    if (!formData.recipient.trim()) errs.recipient = 'Recipient is required';
    if (!formData.department.trim()) errs.department = 'Department is required';
    if (!formData.purpose.trim()) errs.purpose = 'Purpose is required';
    if (!formData.distribution_date) errs.distribution_date = 'Distribution Date is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate() && parentOutward) {
      onSubmitTransaction({
        outward_id: Number(selectedOutwardId),
        outward_no: parentOutward.outward_no,
        item_id: parentOutward.item_id,
        item_code: parentOutward.item_code,
        item_name: parentOutward.item_name,
        location_id: parentOutward.location_id,
        location_name: parentOutward.location_name,
        quantity: Number(formData.quantity),
        recipient: formData.recipient,
        batch: formData.batch,
        department: formData.department,
        purpose: formData.purpose,
        distribution_date: formData.distribution_date,
      });
    }
  };

  const outwardOptions = outwardRecords.map((o) => ({
    value: String(o.id),
    label: `${o.outward_no} - ${o.item_name} (${o.location_name})`,
  }));

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={isExceedingRemaining || remainingDistributableQty === 0}
      >
        Record Distribution
      </Button>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Stock Distribution" footer={footer}>
      <form onSubmit={handleSubmit} noValidate>
        {/* Business Rule Banner */}
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: 'var(--info-50)',
            border: '1px solid var(--info-100)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--info-700)',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
          }}
        >
          <Info size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <strong>Distribution Rule:</strong> Distribution is a detail of parent Outward dispatches. Distribution does <em>not</em> create a stock movement or deduct stock again.
          </div>
        </div>

        {/* Step 1: Parent Outward Selection */}
        <Select
          label="Select Parent Outward Transaction"
          required
          options={outwardOptions}
          value={selectedOutwardId}
          onChange={handleOutwardChange}
          error={errors.outward_id}
        />

        {/* Step 2: Parent Outward Summary Box */}
        {parentOutward && (
          <div
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--neutral-100)',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '1rem',
              fontSize: '0.825rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.35rem' }}>
              Parent Outward Summary: {parentOutward.outward_no}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div>Outward Qty: <strong>{totalOutwardQty}</strong></div>
              <div>Already Distributed: <strong>{alreadyDistributedQty}</strong></div>
              <div style={{ color: remainingDistributableQty === 0 ? 'var(--error-600)' : 'var(--success-700)', fontWeight: 700 }}>
                Remaining: {remainingDistributableQty}
              </div>
            </div>
          </div>
        )}

        {isExceedingRemaining && (
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
            <span>Distribution quantity cannot exceed the remaining quantity of {remainingDistributableQty}.</span>
          </div>
        )}

        {/* Step 3: Distribution Detail Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Distribution Quantity"
            type="number"
            required
            placeholder="10"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            error={errors.quantity}
          />

          <Input
            label="Recipient (Name/Class)"
            required
            placeholder="e.g. Student Batch A / Jagan"
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
            error={errors.recipient}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Department"
            required
            placeholder="e.g. Computer Science / Admissions"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            error={errors.department}
          />

          <Input
            label="Batch Code (Optional)"
            placeholder="e.g. BATCH-2026-01"
            value={formData.batch}
            onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label="Purpose"
            required
            placeholder="e.g. Training Goodie Kit"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            error={errors.purpose}
          />

          <Input
            label="Distribution Date"
            type="date"
            required
            value={formData.distribution_date}
            onChange={(e) => setFormData({ ...formData, distribution_date: e.target.value })}
            error={errors.distribution_date}
          />
        </div>
      </form>
    </Modal>
  );
};

export default DistributionFormModal;
