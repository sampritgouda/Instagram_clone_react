import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
import { 
  FaTrash, 
  FaUserPlus, 
  FaEye, 
  FaEyeSlash, 
  FaExclamationCircle, 
  FaLock, 
  FaKey, 
  FaCheckCircle, 
  FaArrowLeft 
} from 'react-icons/fa';
import logo from '../assets/insta-logo.jpg';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SEC = 60;

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Field-specific and form-level error states
  const [errors, setErrors] = useState({ email: '', password: '', form: '' });

  // Rate Limiting & Lockout State
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const saved = localStorage.getItem('login_failed_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(() => {
    const lockUntil = localStorage.getItem('login_locked_until');
    if (lockUntil) {
      const diff = Math.ceil((parseInt(lockUntil, 10) - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return 0;
  });

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP Verification, 3: Reset Password, 4: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser, savedAccounts, switchAccount, removeSavedAccount } = useUser();
  const { addToast } = useToast();

  const isAddingAccount = location.search.includes('addAccount=true');

  // Lockout countdown timer effect
  useEffect(() => {
    let timer;
    if (lockoutTimeLeft > 0) {
      timer = setInterval(() => {
        setLockoutTimeLeft((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('login_locked_until');
            localStorage.removeItem('login_failed_attempts');
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  // OTP Resend countdown timer effect
  useEffect(() => {
    let timer;
    if (otpResendTimer > 0) {
      timer = setInterval(() => {
        setOtpResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpResendTimer]);

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

  // Strict email regex validation
  const isValidEmail = (val) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val.trim());
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next field
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData.length > 0) {
      const digits = pastedData.slice(0, 6).split('');
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtpCode(newOtp);

      const targetIndex = Math.min(digits.length - 1, 5);
      const targetInput = document.getElementById(`otp-input-${targetIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const validate = () => {
    const newErrors = { email: '', password: '', form: '' };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
      isValid = false;
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address (e.g. user@example.com)';
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

    if (lockoutTimeLeft > 0) {
      addToast(`Account locked. Try again in ${lockoutTimeLeft}s`, 'error');
      return;
    }

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
        localStorage.removeItem('login_failed_attempts');
        localStorage.removeItem('login_locked_until');
        setFailedAttempts(0);

        addToast('Login successful! Redirecting...', 'success');
        loginUser(data, email.trim());

        setTimeout(() => {
          navigate('/home');
        }, 800);
      } else {
        if (data && (data.message || data.error)) {
          errorMessage = data.message || data.error;
        }

        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        localStorage.setItem('login_failed_attempts', newAttempts.toString());

        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          const lockUntil = Date.now() + LOCKOUT_DURATION_SEC * 1000;
          localStorage.setItem('login_locked_until', lockUntil.toString());
          setLockoutTimeLeft(LOCKOUT_DURATION_SEC);
          const lockMsg = `Too many failed login attempts. Account temporarily locked for ${LOCKOUT_DURATION_SEC} seconds.`;
          setErrors((prev) => ({ ...prev, form: lockMsg }));
          addToast(lockMsg, 'error');
        } else {
          const remaining = MAX_FAILED_ATTEMPTS - newAttempts;
          const attemptMsg = `${errorMessage} (${remaining} attempt${remaining > 1 ? 's' : ''} remaining)`;
          setErrors((prev) => ({ ...prev, form: attemptMsg }));
          addToast(errorMessage, 'error');
        }
      }
    } catch (error) {
      const networkErr = 'Network error. Please check your internet connection.';
      setErrors((prev) => ({ ...prev, form: networkErr }));
      addToast(networkErr, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Send OTP via Spring Boot backend (using Resend API)
  const sendOtpCode = async (emailTo) => {
    setForgotLoading(true);
    setForgotError('');
    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTo }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setOtpResendTimer(60);
        addToast(`OTP verification code sent to ${emailTo}`, 'info');
        setForgotStep(2);
      } else {
        setForgotError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setForgotError('Network error. Please check your internet connection.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password Submit Handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (forgotStep === 1) {
      if (!forgotEmail.trim()) {
        setForgotError('Please enter your email address');
        return;
      }
      if (!isValidEmail(forgotEmail)) {
        setForgotError('Please enter a valid email address');
        return;
      }
      await sendOtpCode(forgotEmail.trim());

    } else if (forgotStep === 2) {
      const enteredOtp = otpCode.join('');
      if (enteredOtp.length < 6) {
        setForgotError('Please enter the complete 6-digit OTP code');
        return;
      }

      setForgotLoading(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/api/auth/forgot-password/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail.trim(), otp: enteredOtp }),
        });
        const data = await resp.json();
        if (resp.ok) {
          addToast('OTP verified successfully!', 'success');
          setForgotStep(3);
        } else {
          setForgotError(data.message || 'Invalid OTP code.');
        }
      } catch (err) {
        setForgotError('Network error while verifying OTP.');
      } finally {
        setForgotLoading(false);
      }

    } else if (forgotStep === 3) {
      if (!forgotNewPassword) {
        setForgotError('New password is required');
        return;
      }
      if (forgotNewPassword.length < 6) {
        setForgotError('Password must be at least 6 characters');
        return;
      }
      if (forgotNewPassword !== forgotConfirmPassword) {
        setForgotError('Passwords do not match');
        return;
      }

      setForgotLoading(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/api/auth/forgot-password/reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: forgotEmail.trim(),
            otp: otpCode.join(''),
            newPassword: forgotNewPassword
          }),
        });
        const data = await resp.json();
        if (resp.ok) {
          setForgotStep(4);
          addToast('Password updated successfully!', 'success');
        } else {
          setForgotError(data.message || 'Failed to reset password.');
        }
      } catch (err) {
        setForgotError('Network error while resetting password.');
      } finally {
        setForgotLoading(false);
      }
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotEmail('');
    setOtpCode(['', '', '', '', '', '']);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
  };


  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center bg-black text-white px-3 py-4"
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
                  className="d-flex align-items-center justify-content-between p-2 rounded-3 border border-secondary border-opacity-25 transition-all"
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
          /* ── STANDARD LOGIN FORM ── */
          <form onSubmit={handleLogin} noValidate>
            {/* Lockout Warning Banner */}
            {lockoutTimeLeft > 0 && (
              <div
                className="alert alert-warning d-flex align-items-center gap-2 py-2.5 px-3 mb-3 rounded-3 border-0 small"
                style={{ background: 'rgba(255, 193, 7, 0.15)', color: '#ffc107' }}
              >
                <FaLock size={16} className="flex-shrink-0" />
                <div>
                  <strong>Account Locked!</strong> Too many failed attempts. Try again in{' '}
                  <span className="badge bg-warning text-dark fw-bold ms-1">{lockoutTimeLeft}s</span>
                </div>
              </div>
            )}

            {/* Top Form Alert Error Banner */}
            {errors.form && lockoutTimeLeft === 0 && (
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
                disabled={loading || lockoutTimeLeft > 0}
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
            <div className="mb-2">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label text-secondary small fw-medium mb-0">Password</label>
                <button
                  type="button"
                  className="btn btn-link p-0 text-primary small text-decoration-none"
                  style={{ fontSize: '12.5px', color: '#0095f6' }}
                  onClick={() => setShowForgotModal(true)}
                >
                  Forgot password?
                </button>
              </div>
              <div className="position-relative">
                <input
                  className={`form-control bg-black text-white py-2.5 px-3 rounded-3 pe-5 ${
                    errors.password ? 'border-danger' : 'border-secondary'
                  }`}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading || lockoutTimeLeft > 0}
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

            {/* Failed attempts indicator */}
            {failedAttempts > 0 && lockoutTimeLeft === 0 && (
              <div className="text-end mb-3">
                <small className="text-muted" style={{ fontSize: '11.5px' }}>
                  Failed attempts: {failedAttempts}/{MAX_FAILED_ATTEMPTS}
                </small>
              </div>
            )}

            {/* Login Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 fw-semibold rounded-3 transition-all mt-3"
              disabled={loading || lockoutTimeLeft > 0}
              style={{ background: lockoutTimeLeft > 0 ? '#555' : '#0095f6', border: 'none', fontSize: '15px' }}
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Logging in...
                </span>
              ) : lockoutTimeLeft > 0 ? (
                `Locked (${lockoutTimeLeft}s)`
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

      {/* ── FORGOT PASSWORD / OTP MODAL ── */}
      {showForgotModal && (
        <div
          className="position-fixed inset-0 d-flex align-items-center justify-content-center px-3"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(8px)',
            zIndex: 1050
          }}
        >
          <div
            className="card text-white border-0 shadow-lg p-4 rounded-4"
            style={{
              width: '100%',
              maxWidth: '410px',
              background: '#181818',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary border-opacity-25 pb-2">
              <div className="d-flex align-items-center gap-2">
                <FaKey className="text-warning" size={18} />
                <h5 className="m-0 fw-bold fs-6">Reset Password with OTP</h5>
              </div>
              <button
                className="btn-close btn-close-white"
                onClick={closeForgotModal}
              />
            </div>

            {forgotError && (
              <div
                className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded-3 border-0 small"
                style={{ background: 'rgba(220, 53, 69, 0.15)', color: '#ff6b6b' }}
              >
                <FaExclamationCircle size={14} className="flex-shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <form onSubmit={handleForgotSubmit}>
                <p className="text-secondary small mb-3">
                  Enter your registered email address. We will send a 6-digit OTP verification code to reset your password.
                </p>
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium mb-1">Account Email</label>
                  <input
                    type="email"
                    className="form-control bg-black text-white py-2.5 px-3 rounded-3 border-secondary"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      if (forgotError) setForgotError('');
                    }}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-3 rounded-3"
                    onClick={closeForgotModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4 rounded-3"
                    disabled={forgotLoading}
                    style={{ background: '#0095f6', border: 'none' }}
                  >
                    {forgotLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Verify 6-digit OTP */}
            {forgotStep === 2 && (
              <form onSubmit={handleForgotSubmit}>
                <p className="text-secondary small mb-3">
                  Enter the 6-digit OTP sent to <strong>{forgotEmail}</strong>.
                </p>
                <div className="d-flex justify-content-between gap-1 gap-sm-2 mb-3">
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      maxLength={1}
                      className="form-control bg-black text-white text-center rounded-3 border-secondary fw-bold p-0 flex-fill"
                      style={{
                        minWidth: '0',
                        height: '46px',
                        fontSize: '18px'
                      }}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>


                <div className="d-flex align-items-center justify-content-between mb-4">
                  <small className="text-secondary" style={{ fontSize: '12px' }}>
                    Didn't receive code?
                  </small>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-primary small text-decoration-none"
                    style={{ fontSize: '12.5px', color: '#0095f6' }}
                    disabled={otpResendTimer > 0}
                    onClick={() => sendOtpCode(forgotEmail)}
                  >
                    {otpResendTimer > 0 ? `Resend code (${otpResendTimer}s)` : 'Resend OTP'}
                  </button>
                </div>

                <div className="d-flex gap-2 justify-content-between align-items-center">
                  <button
                    type="button"
                    className="btn btn-link text-secondary p-0 text-decoration-none small d-flex align-items-center gap-1"
                    onClick={() => setForgotStep(1)}
                  >
                    <FaArrowLeft size={12} /> Change Email
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4 rounded-3"
                    disabled={forgotLoading}
                    style={{ background: '#0095f6', border: 'none' }}
                  >
                    {forgotLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      'Verify OTP'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Reset Password */}
            {forgotStep === 3 && (
              <form onSubmit={handleForgotSubmit}>
                <p className="text-secondary small mb-3">
                  OTP verified! Create a new strong password for your account.
                </p>
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium mb-1">New Password</label>
                  <div className="position-relative">
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      className="form-control bg-black text-white py-2 px-3 rounded-3 border-secondary pe-5"
                      placeholder="At least 6 characters"
                      value={forgotNewPassword}
                      onChange={(e) => {
                        setForgotNewPassword(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      style={{ fontSize: '14px' }}
                    />
                    <button
                      type="button"
                      className="btn text-secondary position-absolute top-50 end-0 translate-middle-y me-2 p-1 border-0 bg-transparent"
                      onClick={() => setShowForgotPass(!showForgotPass)}
                      tabIndex={-1}
                    >
                      {showForgotPass ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-medium mb-1">Confirm New Password</label>
                  <input
                    type={showForgotPass ? 'text' : 'password'}
                    className="form-control bg-black text-white py-2 px-3 rounded-3 border-secondary"
                    placeholder="Re-enter new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => {
                      setForgotConfirmPassword(e.target.value);
                      if (forgotError) setForgotError('');
                    }}
                    style={{ fontSize: '14px' }}
                  />
                </div>
                <div className="d-flex gap-2 justify-content-between align-items-center mt-4">
                  <button
                    type="button"
                    className="btn btn-link text-secondary p-0 text-decoration-none small d-flex align-items-center gap-1"
                    onClick={() => setForgotStep(2)}
                  >
                    <FaArrowLeft size={12} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-4 rounded-3"
                    disabled={forgotLoading}
                    style={{ background: '#0095f6', border: 'none' }}
                  >
                    {forgotLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    ) : (
                      'Save Password'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Success */}
            {forgotStep === 4 && (
              <div className="text-center py-3">
                <FaCheckCircle className="text-success mb-2" size={42} />
                <h6 className="fw-bold text-white mb-1">Password Reset Successful!</h6>
                <p className="text-secondary small mb-4">
                  Your account password has been updated. You can now log in with your new password.
                </p>
                <button
                  type="button"
                  className="btn btn-primary w-100 rounded-3"
                  onClick={() => {
                    closeForgotModal();
                    setEmail(forgotEmail);
                  }}
                  style={{ background: '#0095f6', border: 'none' }}
                >
                  Return to Log In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;

