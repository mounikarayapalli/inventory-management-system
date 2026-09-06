import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Plus,
  FileBarChart,
  MoreHorizontal,
} from 'lucide-react';

export const MobileBottomNav = ({ onOpenQuickActions, onOpenMoreDrawer }) => {
  const location = useLocation();

  const isMoreActive =
    location.pathname.startsWith('/items') ||
    location.pathname.startsWith('/categories') ||
    location.pathname.startsWith('/suppliers') ||
    location.pathname.startsWith('/locations') ||
    location.pathname.startsWith('/users') ||
    location.pathname.startsWith('/opening-stock') ||
    location.pathname.startsWith('/inward') ||
    location.pathname.startsWith('/outward') ||
    location.pathname.startsWith('/distribution') ||
    location.pathname.startsWith('/returns') ||
    location.pathname.startsWith('/adjustments') ||
    location.pathname.startsWith('/stock-movements');

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `mobile-nav-item ${isActive ? 'active' : ''}`
        }
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink
        to="/stock"
        className={({ isActive }) =>
          `mobile-nav-item ${isActive ? 'active' : ''}`
        }
      >
        <Boxes size={20} />
        <span>Stock</span>
      </NavLink>

      {/* Central Quick Action Button */}
      <button
        type="button"
        className="mobile-fab-btn"
        onClick={onOpenQuickActions}
        aria-label="Open Quick Actions Menu"
      >
        <div className="fab-icon-wrapper">
          <Plus size={24} />
        </div>
        <span className="fab-label">Action</span>
      </button>

      <NavLink
        to="/reports"
        className={({ isActive }) =>
          `mobile-nav-item ${isActive ? 'active' : ''}`
        }
      >
        <FileBarChart size={20} />
        <span>Reports</span>
      </NavLink>

      <button
        type="button"
        className={`mobile-nav-item ${isMoreActive ? 'active' : ''}`}
        onClick={onOpenMoreDrawer}
        aria-label="Open More Modules Menu"
      >
        <MoreHorizontal size={20} />
        <span>More</span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
