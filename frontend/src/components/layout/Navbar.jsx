import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

export const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, activeRole } = useRole();
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
    logout();
    navigate('/login');
  };

  const displayName = user?.full_name || user?.username || 'Authenticated User';
  const displayEmail = user?.email || `${user?.username || 'user'}@calibo.com`;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AU';

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

        {/* Desktop Search Bar matching reference image */}
        <div className="navbar-search-container">
          <Search size={16} className="navbar-search-icon" />
          <input
            type="text"
            className="navbar-search-input"
            placeholder="Search anything..."
          />
        </div>
      </div>

      <div className="navbar-right">
        {/* Notification Icon Button */}
        <button
          className="navbar-icon-btn"
          aria-label="System notifications"
          title="Notifications"
        >
          <Bell size={19} />
          <span className="notification-badge-dot" />
        </button>

        {/* User Profile Area with Interactive Dropdown */}
        <div className="user-profile-container" ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className="user-profile-badge"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
            aria-label="User account menu"
          >
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">
                <ShieldCheck size={12} style={{ display: 'inline', marginRight: '3px' }} />
                {activeRole}
              </span>
            </div>
            <ChevronDown size={14} className={`profile-chevron ${profileDropdownOpen ? 'open' : ''}`} style={{ marginLeft: '4px', color: 'var(--neutral-400)' }} />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="profile-dropdown-menu" role="menu">
              <div className="dropdown-user-header">
                <p className="dropdown-user-name">{displayName}</p>
                <p className="dropdown-user-email">{displayEmail}</p>
              </div>
              <div className="dropdown-divider" />

              <button
                className="dropdown-item"
                role="menuitem"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <UserIcon size={16} />
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
