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
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import CaliboLogo from '../common/CaliboLogo';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import authAPI from '../../api/auth';

export const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, activeRole, updateUserProfile } = useRole();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const dropdownRef = useRef(null);

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
          {/* Notification Icon Placeholder */}
          <button
            className="navbar-icon-btn"
            aria-label="System notifications"
            title="Notifications"
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
