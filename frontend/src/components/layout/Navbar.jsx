import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  X,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import CaliboLogo from '../common/CaliboLogo';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import authAPI from '../../api/auth';
import dashboardAPI from '../../api/dashboard';

export const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, activeRole, updateUserProfile } = useRole();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Theme Toggle State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Notifications State & Logic
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const [outOfStock, lowStock, recentTx] = await Promise.allSettled([
        dashboardAPI.getOutOfStock(),
        dashboardAPI.getLowStock(),
        dashboardAPI.getRecentTransactions(5),
      ]);

      const items = [];

      if (outOfStock.status === 'fulfilled' && Array.isArray(outOfStock.value)) {
        outOfStock.value.forEach((item) => {
          items.push({
            id: `oos-${item.item_id}-${item.location_id || 0}`,
            type: 'out_of_stock',
            severity: 'error',
            title: 'Out of Stock Alert',
            message: `${item.item_name} ${item.location_name ? `(${item.location_name})` : ''} is out of stock`,
            time: 'Action Required',
          });
        });
      }

      if (lowStock.status === 'fulfilled' && Array.isArray(lowStock.value)) {
        lowStock.value.forEach((item) => {
          items.push({
            id: `low-${item.item_id}-${item.location_id || 0}`,
            type: 'low_stock',
            severity: 'warning',
            title: 'Low Stock Warning',
            message: `${item.item_name} ${item.location_name ? `(${item.location_name})` : ''} reached min threshold (${item.current_quantity} remaining)`,
            time: 'Attention Needed',
          });
        });
      }

      if (recentTx.status === 'fulfilled' && Array.isArray(recentTx.value)) {
        recentTx.value.slice(0, 3).forEach((tx) => {
          const timeStr = tx.timestamp
            ? new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recently';
          items.push({
            id: `tx-${tx.id}`,
            type: 'transaction',
            severity: 'info',
            title: `${tx.transaction_type || 'Transaction'} Activity`,
            message: `${tx.item_name} - Qty: ${tx.quantity} ${tx.reference_no ? `(${tx.reference_no})` : ''}`,
            time: timeStr,
          });
        });
      }

      setNotifications(items);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Settings Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync form data when user or modal state changes
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || user.username || '',
        email: user.email || '',
        password: '',
        confirm_password: '',
      });
    }
  }, [user, settingsModalOpen]);

  // Close profile & notification dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
        setNotificationOpen(false);
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

  const handleOpenProfile = () => {
    setProfileDropdownOpen(false);
    setProfileModalOpen(true);
  };

  const handleOpenSettings = () => {
    setProfileDropdownOpen(false);
    setSettingsError('');
    setSettingsSuccess('');
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (formData.password && formData.password !== formData.confirm_password) {
      setSettingsError('New password and confirmation do not match.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setSettingsError('Password must be at least 6 characters long.');
      return;
    }

    setSavingSettings(true);
    try {
      const payload = {
        email: formData.email.trim(),
        username: formData.full_name.trim() || user.username,
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const updated = await authAPI.updateMe(payload);
      if (updateUserProfile) {
        updateUserProfile(updated);
      }
      setSettingsSuccess('Account settings updated successfully!');
      setFormData((prev) => ({ ...prev, password: '', confirm_password: '' }));
    } catch (err) {
      setSettingsError(err.message || 'Failed to update account settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const displayName = user?.full_name || user?.username || 'Authenticated User';
  const displayEmail = user?.email || `${user?.username || 'user'}@inventory.internal`;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AU';

  return (
    <>
      <header className="app-navbar">
        <div className="navbar-left">
          <button
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle mobile menu"
          >
            <Menu size={20} />
          </button>

          <div className="navbar-context-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CaliboLogo size="sm" showText={false} />
            <span className="context-brand">Calibo AI Academy</span>
            <span className="context-divider">/</span>
            <span className="context-app">Inventory Manager</span>
          </div>
        </div>

        <div className="navbar-right">
          {/* Light / Dark Theme Toggle Button */}
          <button
            className="navbar-icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {/* System Notifications Menu */}
          <div className="notification-container" ref={notificationRef}>
            <button
              className="navbar-icon-btn"
              onClick={() => setNotificationOpen((prev) => !prev)}
              aria-expanded={notificationOpen}
              aria-haspopup="true"
              aria-label="System notifications"
              title="Notifications"
            >
              <Bell size={19} />
              {notifications.length > 0 && (
                <span className="notification-badge-count">
                  {notifications.length > 99 ? '99+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notificationOpen && (
              <div className="notification-dropdown-panel" role="menu">
                <div className="notification-panel-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="notification-header-count">{notifications.length}</span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      className="notification-mark-read-btn"
                      onClick={() => setNotifications([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="notification-panel-body">
                  {notifications.length === 0 ? (
                    <div className="notification-empty-state">
                      <CheckCircle2 size={32} style={{ color: 'var(--success-500)', marginBottom: '4px' }} />
                      <div className="empty-title">All caught up!</div>
                      <div className="empty-desc">No new system alerts or inventory warnings.</div>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const Icon =
                        item.severity === 'error'
                          ? AlertCircle
                          : item.severity === 'warning'
                          ? AlertTriangle
                          : Package;
                      const iconColor =
                        item.severity === 'error'
                          ? 'var(--error-600)'
                          : item.severity === 'warning'
                          ? 'var(--warning-600)'
                          : 'var(--info-600)';

                      return (
                        <div key={item.id} className={`notification-item ${item.severity}`}>
                          <div className="notification-icon-box">
                            <Icon size={16} style={{ color: iconColor }} />
                          </div>
                          <div className="notification-content">
                            <div className="notification-title-row">
                              <span className="notification-item-title">{item.title}</span>
                              <span className="notification-item-time">{item.time}</span>
                            </div>
                            <p className="notification-item-msg">{item.message}</p>
                          </div>
                          <button
                            onClick={() =>
                              setNotifications((prev) => prev.filter((n) => n.id !== item.id))
                            }
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--neutral-400)',
                              cursor: 'pointer',
                              padding: '2px',
                              borderRadius: '4px',
                            }}
                            title="Dismiss"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Area with Interactive Dropdown */}
          <div className="user-profile-container" ref={dropdownRef}>
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
              <ChevronDown size={14} className={`profile-chevron ${profileDropdownOpen ? 'open' : ''}`} />
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
                  onClick={handleOpenProfile}
                >
                  <UserIcon size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  className="dropdown-item"
                  role="menuitem"
                  onClick={handleOpenSettings}
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

      {/* 1. View Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="User Profile Details"
        footer={
          <Button variant="secondary" onClick={() => setProfileModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--neutral-200)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--primary-600)', color: '#ffffff', fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initials}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--neutral-900)' }}>{displayName}</h3>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: 'var(--neutral-600)' }}>{displayEmail}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Full Name</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--neutral-900)' }}>{displayName}</strong>
            </div>

            <div style={{ padding: '0.75rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Email Address</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--neutral-900)' }}>{displayEmail}</strong>
            </div>

            <div style={{ padding: '0.75rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Assigned Role</span>
              <Badge variant="primary" icon={ShieldCheck} style={{ marginTop: '0.25rem' }}>
                {activeRole}
              </Badge>
            </div>

            <div style={{ padding: '0.75rem', border: '1px solid var(--neutral-200)', borderRadius: 'var(--border-radius-sm)', backgroundColor: '#ffffff' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>Account Status</span>
              <Badge variant={user?.is_active !== false ? 'success' : 'warning'} style={{ marginTop: '0.25rem' }}>
                {user?.is_active !== false ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </Modal>

      {/* 2. Account Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Account Settings"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setSettingsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {settingsError && (
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--error-50, #fef2f2)', border: '1px solid var(--error-200, #fecaca)', borderRadius: '6px', color: 'var(--error-700, #b91c1c)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{settingsError}</span>
            </div>
          )}

          {settingsSuccess && (
            <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--success-50, #f0fdf4)', border: '1px solid var(--success-200, #bbf7d0)', borderRadius: '6px', color: 'var(--success-700, #15803d)', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <Input
            label="Full Name / Username"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Enter full name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
            required
          />

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', display: 'block' }}>System Role</span>
              <strong style={{ fontSize: '0.9rem', color: 'var(--neutral-900)' }}>{activeRole}</strong>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontStyle: 'italic' }}>Role managed by System Admin</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--neutral-200)', margin: '0.25rem 0' }} />

          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--neutral-900)', margin: 0 }}>Change Password (Optional)</h4>

          <Input
            label="New Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Leave blank to keep current password"
          />

          <Input
            label="Confirm New Password"
            type="password"
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            placeholder="Confirm new password"
          />
        </form>
      </Modal>
    </>
  );
};

export default Navbar;
