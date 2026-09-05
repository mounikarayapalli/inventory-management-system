import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setProfileDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle mobile menu"
        >
          <Menu size={20} />
        </button>

        <div className="navbar-context-title">
          <span className="context-brand">Calibo AI Academy</span>
          <span className="context-divider">/</span>
          <span className="context-app">Inventory Manager</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Notification Icon Placeholder */}
        <button
          className="navbar-icon-btn"
          aria-label="System notifications"
          title="Notifications (3 unread)"
        >
          <Bell size={19} />
          <span className="notification-badge-dot" />
        </button>

        {/* User Profile Area with Interactive Dropdown */}
        <div className="user-profile-container" ref={dropdownRef}>
          <button
            className="user-profile-badge"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
            aria-label="User account menu"
          >
            <div className="user-avatar">AU</div>
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <span className="user-role">
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                Administrator
              </span>
            </div>
            <ChevronDown size={14} className={`profile-chevron ${profileDropdownOpen ? 'open' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="dropdown-user-header">
                <p className="dropdown-user-name">Admin User</p>
                <p className="dropdown-user-email">admin@calibo-academy.internal</p>
              </div>
              <div className="dropdown-divider" />

              <button
                className="dropdown-item"
                role="menuitem"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <User size={16} />
                <span>My Profile</span>
              </button>

              <button
                className="dropdown-item"
                role="menuitem"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <Settings size={16} />
                <span>Account Settings</span>
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item danger"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
