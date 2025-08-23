      import React, { useState } from "react";
      import "bootstrap/dist/css/bootstrap.min.css";
      import { useNavigate } from "react-router-dom";

      function SignupPage() {
        const [name, setName] = useState("");
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");
        const [message, setMessage] = useState("");
        const navigate=useNavigate()

        const handleSignup = async (e) => {
          e.preventDefault();

          console.log(name)
          try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ "username" :name, email, password }),
            });

            const data = await response.text();

            if (response.ok) {
              setMessage("✅ Signup successful! Token: " + data);
              localStorage.setItem("token",data)
              navigate("/home")
            } else {
              setMessage("❌ Error: " + data);
            }
          } catch (error) {
            setMessage("⚠️ Something went wrong!");
          }
        };

        return (
          <div className="container mt-5 w-100">
            <div className="card shadow p-4" style={{ maxWidth: "450px", margin: "auto" }}>
              <h2 className="text-center mb-4">Sign Up</h2>
              <form onSubmit={handleSignup}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter your name"
                    value={name}
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Sign Up
                </button>
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
