import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Warehouse,
  Database,
  FileBarChart,
  Users,
  ChevronRight,
  Package,
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  GitFork,
  RotateCcw,
  Sliders,
  History,
  Tags,
  Truck,
  MapPin,
  X,
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../constants/navigation';

// Map string icon names to Lucide icons
const iconMap = {
  LayoutDashboard,
  Boxes,
  Warehouse,
  Database,
  FileBarChart,
  Users,
  Package,
  Archive,
  ArrowDownLeft,
  ArrowUpRight,
  GitFork,
  RotateCcw,
  Sliders,
  History,
  Tags,
  Truck,
  MapPin,
};

export const Sidebar = ({ mobileOpen, onMobileClose }) => {
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState({
    inventory: true,
    stock: false,
    masters: false,
  });

  // Automatically expand parent submenu if a child route is active
  useEffect(() => {
    NAVIGATION_ITEMS.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((child) =>
          location.pathname.startsWith(child.path)
        );
        if (isChildActive) {
          setOpenSubmenus((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleSubmenu = (id) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleKeyDownSubmenu = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSubmenu(id);
    }
  };

  return (
    <aside
      className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Sidebar Navigation"
    >
      {/* Sidebar Header & Product Branding */}
      <div className="sidebar-header">
        <div className="sidebar-brand-logo">
          <Package size={20} />
        </div>
        <div className="sidebar-brand-text">
          <span className="brand-title">Calibo AI Academy</span>
          <span className="brand-subtitle">Inventory Management</span>
        </div>
        <button
          className="sidebar-close-mobile"
          onClick={onMobileClose}
          aria-label="Close mobile sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <div className="nav-group-title">Navigation</div>

        {NAVIGATION_ITEMS.map((item) => {
          const IconComponent = iconMap[item.icon] || Package;

          if (item.children) {
            const isSubmenuOpen = !!openSubmenus[item.id];
            const isChildActive = item.children.some((child) =>
              location.pathname.startsWith(child.path)
            );

            return (
              <div key={item.id} className="nav-item">
                <div
                  className={`nav-link ${isChildActive ? 'active' : ''}`}
                  onClick={() => toggleSubmenu(item.id)}
                  onKeyDown={(e) => handleKeyDownSubmenu(e, item.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isSubmenuOpen}
                  aria-controls={`submenu-${item.id}`}
                >
                  <IconComponent size={18} className="nav-link-icon" />
                  <span className="nav-link-label">{item.label}</span>
                  <ChevronRight
                    size={16}
                    className={`nav-link-chevron ${isSubmenuOpen ? 'open' : ''}`}
                  />
                </div>
                {isSubmenuOpen && (
                  <div className="nav-submenu" id={`submenu-${item.id}`} role="region">
                    {item.children.map((child) => {
                      const ChildIcon = iconMap[child.icon] || Package;
                      return (
                        <NavLink
                          key={child.id}
                          to={child.path}
                          onClick={onMobileClose}
                          className={({ isActive }) =>
                            `nav-link nav-sub-link ${isActive ? 'active' : ''}`
                          }
                        >
                          <ChildIcon size={15} className="nav-sub-icon" />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={item.id} className="nav-item">
              <NavLink
                to={item.path}
                onClick={onMobileClose}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                <IconComponent size={18} className="nav-link-icon" />
                <span className="nav-link-label">{item.label}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
