import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus, LogIn } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import CaliboLogo from '../../components/common/CaliboLogo';
import authAPI from '../../api/auth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useRole();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Signup Form State
  const [signupData, setSignupData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTabSwitch = (newMode) => {
    setMode(newMode);
    setErrors({});
    setAuthError('');
    setSuccessMessage('');
  };

  // 1. Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username or email is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setAuthError('Please fill in all required fields.');
      return;
    }

    setErrors({});
    setAuthError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      await login(username.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Handle Signup Submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!signupData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (!signupData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (signupData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!signupData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (signupData.password !== signupData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setAuthError('Please correct the highlighted validation errors.');
      return;
    }

    setErrors({});
    setAuthError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      await authAPI.register({
        full_name: signupData.full_name.trim(),
        username: signupData.username.trim(),
        email: signupData.email.trim(),
        password: signupData.password,
        role: 'stock manager',
      });

      setSuccessMessage('Account created successfully. Please sign in.');
      setUsername(signupData.email.trim());
      setPassword(signupData.password);
      setMode('login');
      setSignupData({
        full_name: '',
        username: '',
        email: '',
        password: '',
        confirm_password: '',
      });
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Username or email may already be registered.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Calibo Official Branding */}
        <div className="auth-header">
          <CaliboLogo size="lg" showText={true} subtitle="Stock & Inventory Management" variant="dark" />
        </div>

        {/* Tab Toggle: Sign In vs Sign Up */}
        <div className="auth-tabs-toggle">
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('login')}
          >
            <LogIn size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('signup')}
          >
            <UserPlus size={15} style={{ display: 'inline', marginRight: '6px' }} />
            Sign Up
          </button>
        </div>

        {/* Global Feedback Banners */}
        {successMessage && (
          <div className="auth-alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Success:</strong> {successMessage}
            </div>
          </div>
        )}

        {authError && (
          <div className="auth-alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>{mode === 'login' ? 'Sign In Failed:' : 'Registration Failed:'}</strong> {authError}
            </div>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username-input" className="form-label">
                Username or Email <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="username-input"
                  type="text"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="admin@calibo.com"
                  value={username}
                  disabled={submitting}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) setErrors((prev) => ({ ...prev, username: null }));
                  }}
                />
              </div>
              {errors.username && (
                <div className="form-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.username}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password-input" className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  disabled={submitting}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  }}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="form-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.75rem' }}>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                {submitting ? 'Authenticating...' : 'Sign In to Calibo'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
              New user?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('signup')}
                style={{ background: 'none', border: 'none', color: 'var(--calibo-navy)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Create an account
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="fullname-input" className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="fullname-input"
                type="text"
                className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
                placeholder="e.g. Sravya Arege"
                value={signupData.full_name}
                disabled={submitting}
                onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
              />
              {errors.full_name && (
                <div className="form-error-msg">
                  <AlertCircle size={14} />
                  <span>{errors.full_name}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label htmlFor="signup-username" className="form-label">
                  Username <span className="required">*</span>
                </label>
                <input
                  id="signup-username"
                  type="text"
                  className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                  placeholder="e.g. sravya"
                  value={signupData.username}
                  disabled={submitting}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                />
                {errors.username && (
                  <div className="form-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.username}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="signup-email" className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  id="signup-email"
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  placeholder="sravya@calibo.com"
                  value={signupData.email}
                  disabled={submitting}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                />
                {errors.email && (
                  <div className="form-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label htmlFor="signup-password" className="form-label">
                  Password <span className="required">*</span>
                </label>
                <input
                  id="signup-password"
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={signupData.password}
                  disabled={submitting}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                />
                {errors.password && (
                  <div className="form-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label">
                  Confirm Password <span className="required">*</span>
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                  placeholder="••••••••"
                  value={signupData.confirm_password}
                  disabled={submitting}
                  onChange={(e) => setSignupData({ ...signupData, confirm_password: e.target.value })}
                />
                {errors.confirm_password && (
                  <div className="form-error-msg">
                    <AlertCircle size={14} />
                    <span>{errors.confirm_password}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--neutral-600)' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                style={{ background: 'none', border: 'none', color: 'var(--calibo-navy)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
