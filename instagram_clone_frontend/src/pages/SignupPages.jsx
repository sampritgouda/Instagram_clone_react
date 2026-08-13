import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const validateEmail = (emailVal) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailVal);
  };

  const validateUsername = (userVal) => {
    // Alphanumeric, underscores and dots only, 3-20 characters
    const re = /^[a-zA-Z0-9_.]+$/;
    return re.test(userVal) && userVal.length >= 3 && userVal.length <= 20;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateUsername(name)) {
      addToast("Username must be between 3 and 20 characters and contain only letters, numbers, underscores (_), or dots (.)", "error");
      return;
    }

    if (!validateEmail(email)) {
      addToast("Please enter a valid email address.", "error");
      return;
    }

    if (password.length < 6) {
      addToast("Password must be at least 6 characters long.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, email, password }),
      });

      let data = null;
      let errorMessage = "Registration failed";

      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          if (text) errorMessage = text;
        }
      } catch (err) {
        // ignore parse error
      }

      if (response.ok && data) {
        addToast("Signup successful! Welcome onboard.", "success");
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.id);
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      } else {
        if (data && (data.message || data.error)) {
          errorMessage = data.message || data.error;
        }
        addToast(errorMessage, "error");
      }
    } catch (error) {
      addToast("Something went wrong. Please check your network connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container w-100 .justify-content-center d-flex" style={{ minHeight: "100vh" }}>
      <div className="card shadow p-4" style={{ maxWidth: "450px", margin: "auto" }}>
        <h2 className="text-center mb-4">Sign Up</h2>
        <form onSubmit={handleSignup}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your username (e.g. trend_user)"
              value={name}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password (min 6 characters)"
              value={password}
              disabled={loading}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? (
              <span className="d-flex align-items-center justify-content-center gap-2">
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Signing up...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <span>Already have an account? </span>
          <button
            className="btn btn-link p-0"
            disabled={loading}
            onClick={() => navigate("/login")}
            style={{ textDecoration: "none" }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
