import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Sliders,
  Archive,
  X,
  Package,
  Shield,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

export const MobileQuickActionsSheet = ({ isOpen, onClose, onSelectAction }) => {
  const navigate = useNavigate();
  const { isAdmin, activeRole } = useRole();

  if (!isOpen) return null;

  const handleActionClick = (route, actionType) => {
    onClose();
    if (onSelectAction) {
      onSelectAction(actionType);
    }
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="mobile-sheet-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="mobile-sheet-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Quick Inventory Actions"
      >
        <div className="sheet-header">
          <div className="sheet-title-wrapper">
            <div className="sheet-logo-badge">
              <Package size={18} />
            </div>
            <div>
              <h3 className="sheet-title">Quick Inventory Actions</h3>
              <p className="sheet-subtitle">
                <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                Active Role: <strong>{activeRole}</strong>
              </p>
            </div>
          </div>
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close action sheet">
            <X size={20} />
          </button>
        </div>

        <div className="sheet-actions-grid">
          <button
            className="sheet-action-item action-inward"
            onClick={() => handleActionClick('/inward?action=new', 'inward')}
          >
            <div className="action-icon-circle bg-success">
              <ArrowDownLeft size={22} />
            </div>
            <div className="action-text">
              <span className="action-label">Stock Inward</span>
              <span className="action-desc">Record GRN purchase receipt</span>
            </div>
          </button>

          <button
            className="sheet-action-item action-outward"
            onClick={() => handleActionClick('/outward?action=new', 'outward')}
          >
            <div className="action-icon-circle bg-primary">
              <ArrowUpRight size={22} />
            </div>
            <div className="action-text">
              <span className="action-label">Stock Outward</span>
              <span className="action-desc">Issue dispatch to event/dept</span>
            </div>
          </button>

          <button
            className="sheet-action-item action-return"
            onClick={() => handleActionClick('/returns?action=new', 'return')}
          >
            <div className="action-icon-circle bg-info">
              <RotateCcw size={22} />
            </div>
            <div className="action-text">
              <span className="action-label">Stock Return</span>
              <span className="action-desc">Receive surplus or vendor return</span>
            </div>
          </button>

          <button
            className="sheet-action-item action-adjustment"
            onClick={() => handleActionClick('/adjustments?action=new', 'adjustment')}
          >
            <div className="action-icon-circle bg-warning">
              <Sliders size={22} />
            </div>
            <div className="action-text">
              <span className="action-label">Stock Adjustment</span>
              <span className="action-desc">Reconcile count / write-off damage</span>
            </div>
          </button>

          {isAdmin && (
            <button
              className="sheet-action-item action-opening"
              onClick={() => handleActionClick('/opening-stock?action=new', 'opening_stock')}
            >
              <div className="action-icon-circle bg-purple">
                <Archive size={22} />
              </div>
              <div className="action-text">
                <span className="action-label">Opening Stock</span>
                <span className="action-desc">Initialize baseline inventory</span>
              </div>
            </button>
          )}
        </div>

        <div className="sheet-footer">
          <button className="btn btn-secondary btn-full" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileQuickActionsSheet;
