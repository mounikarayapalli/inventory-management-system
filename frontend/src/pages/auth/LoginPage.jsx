import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus, LogIn, Lock, Mail, ArrowRight } from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import CaliboLogo from '../../components/common/CaliboLogo';
import authAPI from '../../api/auth';
import loginIllustration from '../../assets/login_illustration.jpg';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useRole();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('fetch') || err.status === 0) {
        setAuthError('Unable to connect to the server. Please check that the inventory server is running.');
      } else {
        setAuthError(msg || 'Authentication failed. Please check your credentials.');
      }
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
      const msg = err.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('fetch') || err.status === 0) {
        setAuthError('Unable to connect to the server. Please check that the inventory server is running.');
      } else {
        setAuthError(msg || 'Registration failed. Username or email may already be registered.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split-wrapper">
        {/* LEFT PANEL: DESKTOP BRANDING & ILLUSTRATION */}
        <div className="auth-left-panel">
          <div className="auth-left-content">
            <CaliboLogo size="lg" variant="light" showText={true} showSubtitle={false} />
            <p className="auth-left-tagline">Smarter Inventory. Better Tomorrow.</p>
          </div>

          <div className="auth-illustration-container">
            <img
              src={loginIllustration}
              alt="Calibo Inventory Mobile & Warehouse Analytics"
              className="auth-illustration-img"
            />
          </div>

          <div style={{ fontSize: '0.75rem', opacity: 0.7, color: '#ffffff' }}>
            &copy; {new Date().getFullYear()} Calibo AI Academy. All rights reserved.
          </div>
        </div>

        {/* RIGHT PANEL: AUTHENTICATION FORM CARD */}
        <div className="auth-right-panel">
          <div style={{ textAlign: 'center', marginBottom: '1rem' }} className="mobile-only-logo">
            <CaliboLogo size="md" variant="dark" showText={true} subtitle="Stock & Inventory Management" />
          </div>

          {mode === 'login' ? (
            <div>
              <h2 className="auth-card-title">Welcome Back</h2>
              <p className="auth-card-subtitle">Sign in to your Calibo Inventory account</p>
            </div>
          ) : (
            <div>
              <h2 className="auth-card-title">Create Account</h2>
              <p className="auth-card-subtitle">Join Calibo Inventory today</p>
            </div>
          )}

          {/* Feedback Banners */}
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

          {/* MODE 1: SIGN IN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="username-input" className="form-label">
                  Email or Username <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <span style={{ position: 'absolute', left: '0.85rem', color: 'var(--neutral-400)', pointerEvents: 'none' }}>
                    <Mail size={18} />
                  </span>
                  <input
                    id="username-input"
                    type="text"
                    className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                    style={{ paddingLeft: '2.4rem' }}
                    placeholder="Enter your email or username"
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
                  <span style={{ position: 'absolute', left: '0.85rem', color: 'var(--neutral-400)', pointerEvents: 'none' }}>
                    <Lock size={18} />
                  </span>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                    style={{ paddingLeft: '2.4rem', paddingRight: '2.4rem' }}
                    placeholder="Enter your password"
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

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--neutral-700)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: 'var(--calibo-navy)', borderRadius: '4px' }}
                  />
                  Remember me
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your administrator to reset password.'); }} style={{ color: 'var(--calibo-teal)', fontWeight: 600 }}>
                  Forgot Password?
                </a>
              </div>

              <div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting}>
                  <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--neutral-400)', fontSize: '0.75rem' }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--calibo-border)' }} />
                <span style={{ padding: '0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--calibo-border)' }} />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className="btn btn-outline btn-full btn-lg"
                >
                  New user? <span style={{ color: 'var(--calibo-teal)', fontWeight: 700, marginLeft: '4px' }}>Sign Up</span>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                Powered by <strong>Calibo AI Academy</strong>
              </div>
            </form>
          )}

          {/* MODE 2: SIGN UP FORM */}
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
                  placeholder="Enter your full name"
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
                    placeholder="Choose a username"
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
                    placeholder="Enter your email"
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
                    placeholder="Create a password"
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
                    placeholder="Confirm your password"
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
                  style={{ background: 'none', border: 'none', color: 'var(--calibo-teal)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Sign In
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                Powered by <strong>Calibo AI Academy</strong>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
