import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../config';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

const { setProfileImage } = useUser();


  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const resp = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();

      if (resp.ok) {
        setMessage('✅ Login successful!');

        
        setProfileImage(data.profileImage);

        // optional: still keep id/token in localStorage if needed
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.id);

        setTimeout(() => {
          navigate('/home');
        }, 2000);
      } else {
        setMessage('❌ error: ' + (data.message || data));
      }
    } catch (error) {
      setMessage('something went wrong');
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
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="form-label mt-3">Enter Password</label>
          <input
            className="form-control mb-3"
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary w-100">Login</button>
        </form>
        {message && (
          <div
            className={`alert mt-3 ${
              message.startsWith("✅") ? "alert-success" : "alert-danger"
            }`}
          >
            {message}
          </div>
        )}
        <div className="text-center mt-3">
          <span>Already have an account? </span>
          <button
            className="btn btn-link p-0"
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
