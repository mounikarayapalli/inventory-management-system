import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Package,
  User,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import authAPI from '../../api/auth';
import calibo3dIllustration from '../../assets/calibo_3d_illustration.png';
import caliboHeaderLogo from '../../assets/calibo_header_logo.png';
import caliboLogoMark from '../../assets/calibo_logo_mark.png';
import caliboLeftVisual from '../../assets/calibo_left_visual.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useRole();

  // Auth Modes: 'login' | 'role_select' | 'signup_form' | 'success'
  const [mode, setMode] = useState('login');

  // Selected Role ('admin' | 'stock manager')
  const [selectedRole, setSelectedRole] = useState(null);

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup Form State
  const [signupData, setSignupData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });

  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetState = () => {
    setErrors({});
    setAuthError('');
    setSuccessMessage('');
  };

  const handleTabSwitch = (targetMode) => {
    resetState();
    setMode(targetMode);
  };

  // Handle Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!username.trim()) newErrors.username = 'Email or Username is required';
    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setAuthError('Please fill in all required fields.');
      return;
    }

    resetState();
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

  // Handle Role Selection Continue
  const handleRoleSelectContinue = () => {
    if (!selectedRole) {
      setAuthError('Please choose a role to continue.');
      return;
    }
    resetState();
    setMode('signup_form');
  };

  // Handle Signup Submission
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!signupData.full_name.trim()) {
      newErrors.full_name = 'Full Name is required';
    }

    if (!signupData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!signupData.confirm_password) {
      newErrors.confirm_password = 'Confirm Password is required';
    } else if (signupData.password !== signupData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      if (signupData.password && signupData.confirm_password && signupData.password !== signupData.confirm_password) {
        setAuthError('Passwords do not match');
      } else {
        setAuthError('Please fill in all required signup fields correctly.');
      }
      return;
    }

    resetState();
    setSubmitting(true);

    try {
      const derivedUsername = signupData.email.trim().split('@')[0] || signupData.full_name.trim().replace(/\s+/g, '_').toLowerCase();

      await authAPI.register({
        full_name: signupData.full_name.trim(),
        username: derivedUsername,
        email: signupData.email.trim(),
        password: signupData.password,
        role: selectedRole,
      });

      setUsername(signupData.email.trim());
      setPassword(signupData.password);
      setSuccessMessage('Account created successfully!');
      setMode('success');
    } catch (err) {
      setAuthError(err.message || 'Registration failed. Email or user may already exist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="calibo-auth-page">
      {/* Decorative Gradient Wave Background Elements */}
      <div className="gradient-wave-top-left" />
      <div className="gradient-wave-bottom-left" />

      {/* Subtle Corporate Calibo Logo Background Watermark */}
      <div className="calibo-auth-watermark" aria-hidden="true">
        <img
          src={caliboLogoMark}
          alt=""
          className="calibo-watermark-img"
        />
      </div>

      <div className="calibo-auth-container">
        {/* ========================================================================= */}
        {/* LEFT PANEL: BRANDING, 3D ILLUSTRATION & FEATURE BADGES */}
        {/* ========================================================================= */}
        <div className="calibo-left-panel">
          <div className="calibo-brand-hero">
            <img
              src={caliboLogoMark}
              alt="Calibo Logo"
              className="calibo-brand-logo-img"
            />
            <h1 className="calibo-brand-title">
              Calibo <span className="highlight-teal">Inventory</span>
            </h1>
            <p className="calibo-brand-tagline">Smarter Inventory. Better Tomorrow.</p>
          </div>

          <div className="calibo-hero-illustration-wrapper">
            <img
              src={calibo3dIllustration}
              alt="Calibo Inventory Smartphone Analytics & Warehouse Boxes"
              className="calibo-hero-3d-img"
            />
          </div>

          <div className="calibo-features-row">
            <div className="feature-item">
              <div className="feature-icon-circle">
                <Shield size={18} />
              </div>
              <div className="feature-text">
                <strong>Secure</strong>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-circle">
                <Zap size={18} />
              </div>
              <div className="feature-text">
                <strong>Efficient</strong>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-circle">
                <BarChart3 size={18} />
              </div>
              <div className="feature-text">
                <strong>Scalable</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: FLOATING WHITE LOGIN CARD */}
        {/* ========================================================================= */}
        <div className="calibo-right-panel">
          <div className="calibo-auth-card">
            {/* Top Logo Mark */}
            <div className="card-logo-mark-wrapper">
              <img src={caliboLogoMark} alt="Calibo Mark" className="card-logo-mark-img" />
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="auth-banner-error">
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* ===================================================================== */}
            {/* MODE 1: LOGIN */}
            {/* ===================================================================== */}
            {mode === 'login' && (
              <>
                <div className="card-header-text">
                  <h2 className="card-title">Welcome Back</h2>
                  <p className="card-subtitle">Sign in to your Calibo Inventory account</p>
                </div>

                {successMessage && (
                  <div className="auth-banner-success">
                    <CheckCircle2 size={16} />
                    <span>{successMessage}</span>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} noValidate>
                  <div className="form-field">
                    <div className="field-input-box">
                      <Mail size={18} className="field-left-icon" />
                      <input
                        type="text"
                        className={`custom-input ${errors.username ? 'has-error' : ''}`}
                        placeholder="Email or Username"
                        value={username}
                        disabled={submitting}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    {errors.username && <div className="field-error-msg">{errors.username}</div>}
                  </div>

                  <div className="form-field">
                    <div className="field-input-box">
                      <Lock size={18} className="field-left-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`custom-input ${errors.password ? 'has-error' : ''}`}
                        placeholder="Password"
                        value={password}
                        disabled={submitting}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="field-right-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label="Toggle password view"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <div className="field-error-msg">{errors.password}</div>}
                  </div>

                  <div className="auth-options-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember Me</span>
                    </label>
                    <a
                      href="#forgot"
                      className="forgot-link"
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Please contact your System Administrator to reset your password.');
                      }}
                    >
                      Forgot Password?
                    </a>
                  </div>

                  <button type="submit" className="calibo-btn-navy-pill" disabled={submitting}>
                    <span>{submitting ? 'Signing In...' : 'Sign In'}</span>
                    <ArrowRight size={18} />
                  </button>

                  <div className="auth-divider-or">
                    <span>or</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTabSwitch('role_select')}
                    className="calibo-btn-outline-pill"
                  >
                    New user? Sign Up
                  </button>

                  <div className="card-powered-footer">
                    Powered by <strong>Calibo AI Academy</strong>
                  </div>
                </form>
              </>
            )}

            {/* ===================================================================== */}
            {/* MODE 2: SIGNUP - ROLE SELECTION */}
            {/* ===================================================================== */}
            {mode === 'role_select' && (
              <>
                <div className="card-header-text">
                  <h2 className="card-title">Select Your Access Role</h2>
                  <p className="card-subtitle">Select your role to get started in Calibo Inventory.</p>
                </div>

                <div className="role-cards-container">
                  {/* ADMIN ROLE CARD */}
                  <div
                    className={`interactive-role-card ${selectedRole === 'admin' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('admin')}
                  >
                    <div className="role-icon-box">
                      <Shield size={20} />
                    </div>
                    <div className="role-card-info">
                      <div className="role-card-top">
                        <span className="role-name">Admin</span>
                        {selectedRole === 'admin' && (
                          <span className="check-badge">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <p className="role-desc">
                        Manage inventory operations, users, master data, locations, suppliers and reports.
                      </p>
                    </div>
                  </div>

                  {/* STOCK MANAGER ROLE CARD */}
                  <div
                    className={`interactive-role-card ${selectedRole === 'stock manager' ? 'active' : ''}`}
                    onClick={() => setSelectedRole('stock manager')}
                  >
                    <div className="role-icon-box">
                      <Package size={20} />
                    </div>
                    <div className="role-card-info">
                      <div className="role-card-top">
                        <span className="role-name">Stock Manager</span>
                        {selectedRole === 'stock manager' && (
                          <span className="check-badge">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                      <p className="role-desc">
                        Manage stock movements, inward, outward, distribution, returns and inventory operations.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRoleSelectContinue}
                  className="calibo-btn-navy-pill"
                  disabled={!selectedRole}
                  style={{ opacity: !selectedRole ? 0.5 : 1, cursor: !selectedRole ? 'not-allowed' : 'pointer' }}
                >
                  <span>Continue</span>
                  <ChevronRight size={18} />
                </button>

                <div className="switch-auth-link" style={{ marginTop: '1.25rem' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => handleTabSwitch('login')}>
                    Sign In
                  </button>
                </div>
              </>
            )}

            {/* ===================================================================== */}
            {/* MODE 3: SIGNUP FORM */}
            {/* ===================================================================== */}
            {mode === 'signup_form' && (
              <>
                <div className="card-header-text">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <h2 className="card-title" style={{ fontSize: '1.4rem' }}>Create Your Account</h2>
                    <span className="selected-role-tag">
                      Role: {selectedRole === 'admin' ? 'Admin' : 'Stock Manager'}
                    </span>
                  </div>
                  <p className="card-subtitle">Enter your details to complete setup</p>
                </div>

                <form onSubmit={handleSignupSubmit} noValidate style={{ marginTop: '1rem' }}>
                  {/* 1. Full Name */}
                  <div className="form-field">
                    <div className="field-input-box">
                      <User size={18} className="field-left-icon" />
                      <input
                        type="text"
                        className={`custom-input ${errors.full_name ? 'has-error' : ''}`}
                        placeholder="Full Name"
                        value={signupData.full_name}
                        disabled={submitting}
                        onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                      />
                    </div>
                    {errors.full_name && <div className="field-error-msg">{errors.full_name}</div>}
                  </div>

                  {/* 2. Email */}
                  <div className="form-field">
                    <div className="field-input-box">
                      <Mail size={18} className="field-left-icon" />
                      <input
                        type="email"
                        className={`custom-input ${errors.email ? 'has-error' : ''}`}
                        placeholder="Email"
                        value={signupData.email}
                        disabled={submitting}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      />
                    </div>
                    {errors.email && <div className="field-error-msg">{errors.email}</div>}
                  </div>

                  {/* 3. Password */}
                  <div className="form-field">
                    <div className="field-input-box">
                      <Lock size={18} className="field-left-icon" />
                      <input
                        type={showSignupPassword ? 'text' : 'password'}
                        className={`custom-input ${errors.password ? 'has-error' : ''}`}
                        placeholder="Password"
                        value={signupData.password}
                        disabled={submitting}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="field-right-toggle"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        aria-label="Toggle password view"
                      >
                        {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <div className="field-error-msg">{errors.password}</div>}
                  </div>

                  {/* 4. Confirm Password */}
                  <div className="form-field">
                    <div className="field-input-box">
                      <Lock size={18} className="field-left-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`custom-input ${errors.confirm_password ? 'has-error' : ''}`}
                        placeholder="Confirm Password"
                        value={signupData.confirm_password}
                        disabled={submitting}
                        onChange={(e) => setSignupData({ ...signupData, confirm_password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="field-right-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle confirm password view"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirm_password && <div className="field-error-msg">{errors.confirm_password}</div>}
                  </div>

                  {/* Buttons Row: Back & Create Account */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                    <button
                      type="button"
                      className="calibo-btn-outline-pill"
                      style={{ flex: '0 0 auto', width: 'auto', padding: '0 1.25rem', height: '48px' }}
                      onClick={() => setMode('role_select')}
                    >
                      Back
                    </button>
                    <button type="submit" className="calibo-btn-navy-pill" disabled={submitting} style={{ flex: 1 }}>
                      <span>{submitting ? 'Creating...' : 'Create Account'}</span>
                    </button>
                  </div>

                  <div className="switch-auth-link" style={{ marginTop: '1.25rem' }}>
                    Already have an account?{' '}
                    <button type="button" onClick={() => handleTabSwitch('login')}>
                      Sign In
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ===================================================================== */}
            {/* MODE 4: SUCCESS REGISTRATION */}
            {/* ===================================================================== */}
            {mode === 'success' && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div className="success-icon-circle">
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1B365D', margin: '0 0 0.5rem 0' }}>
                  Account Created Successfully!
                </h2>
                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                  {successMessage}
                </p>
                <button type="button" onClick={() => handleTabSwitch('login')} className="calibo-btn-navy-pill">
                  <span>Continue to Login</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
