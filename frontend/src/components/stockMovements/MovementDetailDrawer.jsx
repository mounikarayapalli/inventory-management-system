import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import MovementTypeBadge from './MovementTypeBadge';
import { Calendar, Hash, MapPin, FileText } from 'lucide-react';

export const MovementDetailDrawer = ({ isOpen, onClose, movementRecord }) => {
  if (!movementRecord) return null;

  const isPositive = Number(movementRecord.quantity) > 0;
  const movementId = movementRecord.movement_id || movementRecord.id;
  const refId = movementRecord.reference_id || 'N/A';
  const refNum = movementRecord.reference_number || movementRecord.reference || 'N/A';
  const timestamp = movementRecord.timestamp || movementRecord.date || 'N/A';
  const remarks = movementRecord.remarks;

  const footer = (
    <Button variant="secondary" onClick={onClose}>
      Close Details
    </Button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Movement Detail" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Header Summary Box */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--neutral-50)',
            border: '1px solid var(--neutral-200)',
            borderRadius: 'var(--border-radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <code style={{ fontSize: '0.8rem', color: 'var(--neutral-500)' }}>{movementId}</code>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neutral-900)', marginTop: '0.1rem' }}>
                {movementRecord.item_name}
              </h3>
            </div>
            <MovementTypeBadge type={movementRecord.movement_type} />
          </div>

          <div style={{ fontSize: '0.825rem', color: 'var(--neutral-600)' }}>
            <MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Location: <strong>{movementRecord.location_name}</strong>
          </div>
        </div>

        {/* Movement Transaction Properties */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div
            style={{
              padding: '0.875rem 1rem',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: '#ffffff',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Quantity</span>
            <span
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: isPositive ? 'var(--success-700)' : 'var(--error-600)',
              }}
            >
              {isPositive ? `+${movementRecord.quantity}` : movementRecord.quantity}
            </span>
          </div>

          <div
            style={{
              padding: '0.875rem 1rem',
              border: '1px solid var(--neutral-200)',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: '#ffffff',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Reference Number</span>
            <code style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
              {refNum}
            </code>
          </div>
        </div>

        {/* Metadata Details */}
        <div style={{ fontSize: '0.85rem', color: 'var(--neutral-700)', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Hash size={14} style={{ color: 'var(--neutral-400)' }} />
            <span>Reference ID: <strong><code>{refId}</code></strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={14} style={{ color: 'var(--neutral-400)' }} />
            <span>Timestamp: <strong>{timestamp}</strong></span>
          </div>

          {remarks && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '0.25rem' }}>
              <FileText size={14} style={{ color: 'var(--neutral-400)', marginTop: '2px' }} />
              <div>
                <span style={{ color: 'var(--neutral-500)', display: 'block' }}>Remarks:</span>
                <span style={{ fontStyle: 'italic', color: 'var(--neutral-800)' }}>{remarks}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MovementDetailDrawer;

