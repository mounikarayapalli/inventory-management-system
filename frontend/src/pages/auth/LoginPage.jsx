import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Package, AlertCircle } from 'lucide-react';
import { useRole } from '../../context/RoleContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useRole();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = 'Username is required';
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

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Application Branding */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Package size={28} />
          </div>
          <h1 className="auth-title">Calibo AI Academy</h1>
          <p className="auth-subtitle">Stock & Inventory Management System</p>
        </div>

        {/* Global Auth Error */}
        {authError && (
          <div className="auth-alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Sign In Failed:</strong> {authError}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Username Input */}
          <div className="form-group">
            <label htmlFor="username-input" className="form-label">
              Username or Email <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="username-input"
                type="text"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                placeholder="Enter username or email"
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

          {/* Password Input with Show/Hide Toggle */}
          <div className="form-group">
            <label htmlFor="password-input" className="form-label">
              Password <span className="required">*</span>
            </label>
            <div className="input-wrapper">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Enter password"
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

          {/* Submit Button */}
          <div style={{ marginTop: '1.75rem' }}>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
              {submitting ? 'Authenticating...' : 'Sign In to System'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
