import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { setProfileImage } = useUser();
  const { addToast } = useToast();

  const validateEmail = (emailVal) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailVal);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      let errorMessage = "Invalid email or password";
      
      try {
        const contentType = resp.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await resp.json();
        } else {
          const text = await resp.text();
          if (text) errorMessage = text;
        }
      } catch (e) {
        // Fallback to default error
      }

      if (resp.ok && data) {
        addToast('Login successful! Redirecting...', 'success');
        setProfileImage(data.profileImage);

        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.id);

        setTimeout(() => {
          navigate('/home');
        }, 1500);
      } else {
        if (data && (data.message || data.error)) {
          errorMessage = data.message || data.error;
        }
        addToast(errorMessage, 'error');
      }
    } catch (error) {
      addToast('Something went wrong. Please check your network connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <form onSubmit={handleLogin}>
          <h2 className="text-center mb-3">Login</h2>
          <label className="form-label mt-3">Enter Email</label>
          <input
            className="form-control"
            type="email"
            placeholder="Email"
            value={email}
            required
            disabled={loading}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="form-label mt-3">Enter Password</label>
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            value={password}
            required
            disabled={loading}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
        <div className="text-center mt-3">
          <span>Don't have an account? </span>
          <button
            className="btn btn-link p-0"
            disabled={loading}
            onClick={() => navigate("/")}
            style={{ textDecoration: "none" }}
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
