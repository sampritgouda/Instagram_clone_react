import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useUser } from "../context/UserContext";
import { API_BASE_URL } from "../config";
import { FaEye, FaEyeSlash, FaExclamationCircle } from "react-icons/fa";
import logo from "../assets/insta-logo.jpg";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-specific and form-level error states
  const [errors, setErrors] = useState({ name: "", email: "", password: "", form: "" });

  const navigate = useNavigate();
  const { addToast } = useToast();
  const { loginUser } = useUser();

  // Auto-redirect if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const validate = () => {
    const newErrors = { name: "", email: "", password: "", form: "" };
    let isValid = true;

    // Username Validation
    if (!name.trim()) {
      newErrors.name = "Username is required";
      isValid = false;
    } else if (name.trim().length < 3 || name.trim().length > 20) {
      newErrors.name = "Username must be between 3 and 20 characters";
      isValid = false;
    } else if (!/^[a-zA-Z0-9_.]+$/.test(name.trim())) {
      newErrors.name = "Username can only contain letters, numbers, underscores (_), and dots (.)";
      isValid = false;
    }

    // Email Validation
    if (!email.trim()) {
      newErrors.email = "Email address is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Password Validation
    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setErrors((prev) => ({ ...prev, form: "" }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name.trim(), email: email.trim(), password }),
      });

      let data = null;
      let errorMessage = "Registration failed. Please try again.";

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
        loginUser(data, email.trim(), name.trim());
        setTimeout(() => {
          navigate("/home");
        }, 1000);
      } else {
        if (data && (data.message || data.error)) {
          errorMessage = data.message || data.error;
        }
        setErrors((prev) => ({ ...prev, form: errorMessage }));
        addToast(errorMessage, "error");
      }
    } catch (error) {
      const networkErr = "Something went wrong. Please check your network connection.";
      setErrors((prev) => ({ ...prev, form: networkErr }));
      addToast(networkErr, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center bg-black text-white px-3 py-4"
      style={{ minHeight: "100vh", background: "radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)" }}
    >
      <div
        className="card text-white border-0 shadow-lg p-4 p-md-5 rounded-4"
        style={{
          width: "100%",
          maxWidth: "440px",
          background: "#121212",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.7)"
        }}
      >
        {/* Header Branding */}
        <div className="text-center mb-4">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
            <img src={logo} alt="Trend Logo" style={{ width: "38px", height: "38px", borderRadius: "8px" }} />
            <h2 className="m-0 fw-bold" style={{ fontFamily: "monospace", color: "orange", fontSize: "28px" }}>
              Trend
            </h2>
          </div>
          <p className="text-secondary small mb-0">Sign up to see photos and videos from your friends.</p>
        </div>

        {/* ── SIGNUP FORM (NO REQUIRED ATTR) ── */}
        <form onSubmit={handleSignup} noValidate>
          {/* Top Form Alert Error Banner */}
          {errors.form && (
            <div
              className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 mb-3 rounded-3 border-0 small"
              style={{ background: "rgba(220, 53, 69, 0.15)", color: "#ff6b6b" }}
            >
              <FaExclamationCircle size={16} className="flex-shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium mb-1">Username</label>
            <input
              type="text"
              className={`form-control bg-black text-white py-2.5 px-3 rounded-3 ${
                errors.name ? "border-danger" : "border-secondary"
              }`}
              placeholder="e.g. trend_user"
              value={name}
              disabled={loading}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
              }}
              style={{ fontSize: "14px" }}
            />
            {errors.name && (
              <div className="text-danger small mt-1.5 d-flex align-items-center gap-1" style={{ fontSize: "12.5px" }}>
                <FaExclamationCircle size={12} /> {errors.name}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="mb-3">
            <label className="form-label text-secondary small fw-medium mb-1">Email Address</label>
            <input
              type="email"
              className={`form-control bg-black text-white py-2.5 px-3 rounded-3 ${
                errors.email ? "border-danger" : "border-secondary"
              }`}
              placeholder="name@example.com"
              value={email}
              disabled={loading}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
              }}
              style={{ fontSize: "14px" }}
            />
            {errors.email && (
              <div className="text-danger small mt-1.5 d-flex align-items-center gap-1" style={{ fontSize: "12.5px" }}>
                <FaExclamationCircle size={12} /> {errors.email}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label className="form-label text-secondary small fw-medium mb-1">Password</label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control bg-black text-white py-2.5 px-3 rounded-3 pe-5 ${
                  errors.password ? "border-danger" : "border-secondary"
                }`}
                placeholder="At least 6 characters"
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                style={{ fontSize: "14px" }}
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
              <div className="text-danger small mt-1.5 d-flex align-items-center gap-1" style={{ fontSize: "12.5px" }}>
                <FaExclamationCircle size={12} /> {errors.password}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 fw-semibold rounded-3 transition-all"
            disabled={loading}
            style={{ background: "#0095f6", border: "none", fontSize: "15px" }}
          >
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

        {/* Footer */}
        <div className="text-center mt-4 pt-3 border-top border-secondary border-opacity-25">
          <span className="text-secondary small">Already have an account? </span>
          <button
            className="btn btn-link p-0 text-primary small fw-semibold ms-1"
            disabled={loading}
            onClick={() => navigate("/login")}
            style={{ textDecoration: "none", color: "#0095f6" }}
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
