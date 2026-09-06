import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes,
  Warehouse,
  FileBarChart,
  Users,
  X,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  GitFork,
  RotateCcw,
  Sliders,
  History,
  Tags,
  Truck,
  MapPin,
  Archive,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import CaliboLogo from '../common/CaliboLogo';

export const MobileMoreDrawer = ({ isOpen, onClose }) => {
  const { user, logout, activeRole, isAdmin } = useRole();

  if (!isOpen) return null;

  const handleLinkClick = () => {
    onClose();
  };

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <div className="mobile-sheet-backdrop" onClick={onClose} aria-hidden="true">
      <div
        className="mobile-more-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="More Application Modules"
      >
        <div className="more-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CaliboLogo size="sm" layout="horizontal" showSubtitle={false} />
          </div>
          <button className="sheet-close-btn" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="more-drawer-content">
          {/* Inventory Transactions Section */}
          <div className="more-group">
            <h4 className="more-group-title">Inventory Operations</h4>
            <div className="more-links-grid">
              <NavLink to="/inward" onClick={handleLinkClick} className="more-link-item">
                <ArrowDownLeft size={18} className="text-success" />
                <span>Inward Receipts</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              <NavLink to="/outward" onClick={handleLinkClick} className="more-link-item">
                <ArrowUpRight size={18} className="text-primary" />
                <span>Outward Dispatches</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              <NavLink to="/distribution" onClick={handleLinkClick} className="more-link-item">
                <GitFork size={18} className="text-info" />
                <span>Distribution Detail</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              <NavLink to="/returns" onClick={handleLinkClick} className="more-link-item">
                <RotateCcw size={18} className="text-warning" />
                <span>Returns Register</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              <NavLink to="/adjustments" onClick={handleLinkClick} className="more-link-item">
                <Sliders size={18} className="text-danger" />
                <span>Stock Adjustments</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              {isAdmin && (
                <NavLink to="/opening-stock" onClick={handleLinkClick} className="more-link-item">
                  <Archive size={18} className="text-purple" />
                  <span>Opening Stock</span>
                  <ChevronRight size={16} className="chevron" />
                </NavLink>
              )}

              <NavLink to="/stock-movements" onClick={handleLinkClick} className="more-link-item">
                <History size={18} className="text-neutral" />
                <span>Stock Ledger</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>
            </div>
          </div>

          {/* Master Data Section */}
          <div className="more-group">
            <h4 className="more-group-title">Master Catalogs</h4>
            <div className="more-links-grid">
              <NavLink to="/items" onClick={handleLinkClick} className="more-link-item">
                <Package size={18} />
                <span>Item Catalog</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              <NavLink to="/categories" onClick={handleLinkClick} className="more-link-item">
                <Tags size={18} />
                <span>Categories</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              <NavLink to="/suppliers" onClick={handleLinkClick} className="more-link-item">
                <Truck size={18} />
                <span>Suppliers</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>

              <NavLink to="/locations" onClick={handleLinkClick} className="more-link-item">
                <MapPin size={18} />
                <span>Warehouse Hubs</span>
                <ChevronRight size={16} className="chevron" />
              </NavLink>
            </div>
          </div>

          {/* System Admin Section */}
          <div className="more-group">
            <h4 className="more-group-title">System & Account</h4>
            <div className="more-links-grid">
              {isAdmin && (
                <NavLink to="/users" onClick={handleLinkClick} className="more-link-item">
                  <Users size={18} />
                  <span>User Management</span>
                  <ChevronRight size={16} className="chevron" />
                </NavLink>
              )}

              <button onClick={handleLogout} className="more-link-item danger">
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMoreDrawer;
