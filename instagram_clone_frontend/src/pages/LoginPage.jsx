import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
import { FaTrash, FaUserPlus, FaEye, FaEyeSlash, FaExclamationCircle } from 'react-icons/fa';
import logo from '../assets/insta-logo.jpg';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Field-specific and form-level error states
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });

  const navigate = useNavigate();
  const location = useLocation();

  const { loginUser, savedAccounts, switchAccount, removeSavedAccount } = useUser();
  const { addToast } = useToast();

  const isAddingAccount = location.search.includes('addAccount=true');

  // Auto-redirect if already logged in and not adding a new account
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAddingAccount) {
      navigate('/home', { replace: true });
    }
  }, [navigate, isAddingAccount]);

  // Default to showing saved accounts if available and not adding a new account
  useEffect(() => {
    if (savedAccounts && savedAccounts.length > 0 && !isAddingAccount) {
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  }, [savedAccounts, isAddingAccount]);

  const validate = () => {
    const newErrors = { email: '', password: '', form: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, form: '' }));

    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let data = null;
      let errorMessage = 'Invalid email or password';

      try {
        const contentType = resp.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await resp.json();
        } else {
          const text = await resp.text();
          if (text) errorMessage = text;
        }
      } catch (e) {
        // Fallback
      }

      if (resp.ok && data) {
        addToast('Login successful! Redirecting...', 'success');
        loginUser(data, email.trim());

        setTimeout(() => {
          navigate('/home');
        }, 1000);
      } else {
        if (data && (data.message || data.error)) {
          errorMessage = data.message || data.error;
        }
        setErrors((prev) => ({ ...prev, form: errorMessage }));
        addToast(errorMessage, 'error');
      }
    } catch (error) {
      const networkErr = 'Network error. Please check your internet connection.';
      setErrors((prev) => ({ ...prev, form: networkErr }));
      addToast(networkErr, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center bg-black text-white px-3"
      style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)' }}
    >
      <div
        className="card text-white border-0 shadow-lg p-4 p-md-5 rounded-4"
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header Branding */}
        <div className="text-center mb-4">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <img src={logo} alt="Trend Logo" style={{ width: '38px', height: '38px', borderRadius: '8px' }} />
            <h2 className="m-0 fw-bold" style={{ fontFamily: 'monospace', color: 'orange', fontSize: '28px' }}>
              Trend
            </h2>
          </div>
          <p className="text-secondary small mb-0">Connect with friends & share your moments</p>
        </div>

        {/* ── SAVED ACCOUNTS SECTION ── */}
        {!showForm && savedAccounts && savedAccounts.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            <div className="text-center">
              <h6 className="text-white fw-bold mb-1">Welcome back</h6>
              <p className="text-secondary small mb-0">Select an account to log in</p>
            </div>

            <div className="d-flex flex-column gap-2 overflow-auto py-1" style={{ maxHeight: '280px' }}>
              {savedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className="d-flex align-items-center justify-content-between p-2.5 rounded-3 border border-secondary border-opacity-25 transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div
                    className="d-flex align-items-center gap-3 flex-grow-1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => switchAccount(acc)}
                  >
                    <img
                      src={
                        acc.profilePicUrl ||
                        'https://res.cloudinary.com/dr0yboilf/image/upload/v1754637397/i721vyva5s2broewwwss.jpg'
                      }
                      alt={acc.username}
                      className="rounded-circle border border-secondary"
                      style={{ width: '46px', height: '46px', objectFit: 'cover' }}
                    />
                    <div>
                      <p className="mb-0 fw-bold text-white fs-6">{acc.username || `User #${acc.id}`}</p>
                      <small className="text-primary fw-semibold" style={{ fontSize: '12px' }}>
                        Click to Log In
                      </small>
                    </div>
                  </div>

                  <button
                    className="btn btn-sm btn-outline-danger border-0 p-2"
                    title="Remove saved account"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSavedAccount(acc.id);
                    }}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              className="btn btn-outline-light w-100 py-2.5 mt-2 d-flex align-items-center justify-content-center gap-2 fw-semibold rounded-3"
              onClick={() => setShowForm(true)}
              style={{ fontSize: '14px' }}
            >
              <FaUserPlus size={14} /> Log into another account
            </button>
          </div>
        ) : (
          /* ── STANDARD LOGIN FORM (NO REQUIRED ATTR) ── */
          <form onSubmit={handleLogin} noValidate>
            {/* Top Form Alert Error Banner */}
            {errors.form && (
              <div
                className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded-3 border-0 small"
                style={{ background: 'rgba(220, 53, 69, 0.15)', color: '#ff6b6b' }}
              >
                <FaExclamationCircle size={16} className="flex-shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium mb-1">Email address</label>
              <input
                className={`form-control bg-black text-white py-2.5 px-3 rounded-3 ${
                  errors.email ? 'border-danger' : 'border-secondary'
                }`}
                type="email"
                placeholder="name@example.com"
                value={email}
                disabled={loading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                }}
                style={{ fontSize: '14px' }}
              />
              {errors.email && (
                <div className="text-danger small mt-1.5 d-flex align-items-center gap-1" style={{ fontSize: '12.5px' }}>
                  <FaExclamationCircle size={12} /> {errors.email}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="form-label text-secondary small fw-medium mb-1">Password</label>
              <div className="position-relative">
                <input
                  className={`form-control bg-black text-white py-2.5 px-3 rounded-3 pe-5 ${
                    errors.password ? 'border-danger' : 'border-secondary'
                  }`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  style={{ fontSize: '14px' }}
                />
                <button
                  type="button"
                  className="btn text-secondary position-absolute top-50 end-0 translate-middle-y me-2 p-1 border-0 bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {errors.password && (
                <div className="text-danger small mt-1.5 d-flex align-items-center gap-1" style={{ fontSize: '12.5px' }}>
                  <FaExclamationCircle size={12} /> {errors.password}
                </div>
              )}
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 fw-semibold rounded-3 transition-all"
              disabled={loading}
              style={{ background: '#0095f6', border: 'none', fontSize: '15px' }}
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Logging in...
                </span>
              ) : (
                'Log In'
              )}
            </button>

            {savedAccounts && savedAccounts.length > 0 && (
              <button
                type="button"
                className="btn btn-link w-100 mt-2 text-secondary text-decoration-none small"
                onClick={() => setShowForm(false)}
              >
                ← Back to saved accounts
              </button>
            )}
          </form>
        )}

        {/* Footer */}
        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25">
          <span className="text-secondary small">Don't have an account? </span>
          <button
            className="btn btn-link p-0 text-primary small fw-semibold ms-1"
            disabled={loading}
            onClick={() => navigate('/')}
            style={{ textDecoration: 'none', color: '#0095f6' }}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
