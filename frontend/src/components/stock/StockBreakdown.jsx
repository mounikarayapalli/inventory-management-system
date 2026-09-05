import React from 'react';

export const StockBreakdown = ({ breakdown }) => {
  if (!breakdown) return null;

  const { opening_stock, inward, outward, returns, adjustments } = breakdown;

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'var(--neutral-100)',
        border: '1px solid var(--neutral-200)',
        borderRadius: 'var(--border-radius-md)',
        marginTop: '1rem',
      }}
    >
      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--neutral-900)', marginBottom: '0.75rem' }}>
        Stock Balance Breakdown (Item + Location)
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
        <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--neutral-200)' }}>
          <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '0.725rem' }}>Opening Stock</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--neutral-800)' }}>+{opening_stock || 0}</strong>
        </div>

        <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--neutral-200)' }}>
          <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '0.725rem' }}>Inward</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--success-700)' }}>+{inward || 0}</strong>
        </div>

        <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--neutral-200)' }}>
          <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '0.725rem' }}>Outward</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--warning-700)' }}>-{outward || 0}</strong>
        </div>

        <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--neutral-200)' }}>
          <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '0.725rem' }}>Returns</span>
          <strong style={{ fontSize: '0.95rem', color: 'var(--info-700)' }}>+{returns || 0}</strong>
        </div>

        <div style={{ padding: '0.5rem', backgroundColor: '#ffffff', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--neutral-200)' }}>
          <span style={{ color: 'var(--neutral-500)', display: 'block', fontSize: '0.725rem' }}>Adjustments</span>
          <strong style={{ fontSize: '0.95rem', color: (adjustments || 0) >= 0 ? 'var(--success-700)' : 'var(--error-600)' }}>
            {(adjustments || 0) >= 0 ? `+${adjustments || 0}` : adjustments}
          </strong>
        </div>
      </div>
    </div>
  );
};

export default StockBreakdown;
