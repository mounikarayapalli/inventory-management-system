import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import StockStatusBadge from './StockStatusBadge';
import StockBreakdown from './StockBreakdown';
import { Info, Package, MapPin, Layers } from 'lucide-react';

export const StockDetailDrawer = ({ isOpen, onClose, stockRecord }) => {
  if (!stockRecord) return null;

  const footer = (
    <Button variant="secondary" onClick={onClose}>
      Close Details
    </Button>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Position & Valuation Details" footer={footer}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Explanation Note Banner */}
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: 'var(--info-50)',
            border: '1px solid var(--info-100)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--info-700)',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Info size={18} style={{ flexShrink: 0 }} />
          <span>
            Current <strong>Available Quantity</strong> reflects the net inventory balance maintained Item + Location wise.
          </span>
        </div>

        {/* Item & Location Summary */}
        <div style={{ padding: '1rem', backgroundColor: 'var(--neutral-50)', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <code style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 700 }}>
                {stockRecord.item_code}
              </code>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--neutral-900)', marginTop: '0.1rem' }}>
                {stockRecord.item_name}
              </h3>
            </div>
            <StockStatusBadge status={stockRecord.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--neutral-600)' }}>
            <div><Layers size={13} style={{ display: 'inline', marginRight: '4px' }} />Category: <strong>{stockRecord.category_name}</strong></div>
            <div><MapPin size={13} style={{ display: 'inline', marginRight: '4px' }} />Location: <strong>{stockRecord.location_name}</strong></div>
          </div>
        </div>

        {/* Stock Metrics & WAC Valuation Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '0.875rem 1rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-md)', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Available Quantity</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--neutral-900)' }}>
              {stockRecord.available_quantity} {stockRecord.unit}
            </span>
          </div>

          <div style={{ padding: '0.875rem 1rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-md)', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Minimum Safety Level</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--neutral-700)' }}>
              {stockRecord.minimum_level} {stockRecord.unit}
            </span>
          </div>

          <div style={{ padding: '0.875rem 1rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-md)', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Weighted Average Cost (WAC)</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-700)' }}>
              ₹{Number(stockRecord.wac).toFixed(2)}
            </span>
          </div>

          <div style={{ padding: '0.875rem 1rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-md)', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Total Stock Value (Qty × WAC)</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--success-700)' }}>
              ₹{Number(stockRecord.stock_value).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Breakdown Section */}
        <StockBreakdown breakdown={stockRecord.breakdown} />
      </div>
    </Modal>
  );
};

export default StockDetailDrawer;
