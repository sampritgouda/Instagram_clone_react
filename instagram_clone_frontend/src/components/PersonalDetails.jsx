import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config";

const PersonalDetails = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [editUsername, setEditUsername] = useState(false);
  const [changePass, setChangePass] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch(
          `${API_BASE_URL}/api/profile/setting/details`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (resp.ok) {
          const data = await resp.json();
          setUsername(data.username);
          setEmail(data.email);
        }
      } catch (err) {
        addToast("Error fetching user details", "error");
      }
    };
    fetchUser();
  }, []);

  const handleUpdateDetails = async (field, value) => {
    if (field === "username" && (!value || value.trim().length < 3)) {
      addToast("Username must be at least 3 characters long", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${API_BASE_URL}/api/profile/setting/details`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [field]: value }),
        }
      );

      let data = {};
      try {
        data = await resp.json();
      } catch (e) { }

      if (resp.ok) {
        addToast(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`, "success");
        if (field === "username") setEditUsername(false);
      } else {
        addToast(data.error || data.message || "Failed to update details", "error");
      }
    } catch (err) {
      addToast("Error updating details", "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      addToast("Password must be at least 6 characters long", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New passwords do not match", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        `${API_BASE_URL}/api/profile/setting/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );

      let data = {};
      try {
        data = await resp.json();
      } catch (e) { }

      if (resp.ok) {
        addToast("Password updated successfully", "success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangePass(false);
      } else {
        addToast(data.error || data.message || "Failed to update password", "error");
      }
    } catch (err) {
      addToast("Error changing password", "error");
    }
  };

  return (
    <div className="w-100 text-white">
      <div className="mx-auto px-2" style={{ maxWidth: "600px" }}>
        <h4 className="fw-bold mb-4 mt-2" style={{ letterSpacing: '0.3px' }}>Personal Details</h4>

        {/* Username */}
        <div className="bg-dark-card border-dark-glow p-3.5 rounded-4 mb-3 d-flex justify-content-between align-items-center shadow-sm px-4 py-2">
          {!editUsername ? (
            <>
              <div>
                <p className="text-secondary mb-0" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</p>
                <span className="fw-semibold" style={{ fontSize: '15px' }}>{username}</span>
              </div>
              <button
                className="btn btn-sm btn-primary fw-semibold px-3 py-2 rounded-3"
                onClick={() => setEditUsername(true)}
              >
                Edit
              </button>
            </>
          ) : (
            <div className="d-flex w-100 flex-column gap-2">
              <label className="text-secondary" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Edit Username</label>
              <div className="d-flex w-100 gap-2 flex-wrap">
                <input
                  type="text"
                  className="form-control custom-input border-dark-glow text-white w-100"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <button
                  className="btn btn-primary fw-semibold px-3 rounded-3"
                  onClick={() => handleUpdateDetails("username", username)}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary fw-semibold px-3 rounded-3"
                  onClick={() => setEditUsername(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Email (read-only) */}
        <div className="bg-dark-card border-dark-glow p-3.5 rounded-4 mb-4 d-flex flex-column shadow-sm px-4 py-2">
          <p className="text-secondary mb-0" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</p>
          <span className="fw-semibold text-white-50" style={{ fontSize: '15px' }}>{email}</span>
        </div>

        {/* Password Section */}
        <h4 className="fw-bold mb-3 mt-4" style={{ letterSpacing: '0.3px' }}>Password & Security</h4>
        {!changePass ? (
          <button
            className="btn w-100 text-white bg-dark-card border-dark-glow py-3 rounded-4 fw-semibold text-start px-4 d-flex justify-content-between align-items-center shadow-sm"
            style={{ transition: 'all 0.2s ease' }}
            onClick={() => setChangePass(true)}
          >
            <span>Change Password</span>
            <span style={{ fontSize: '18px', opacity: 0.5 }}>→</span>
          </button>
        ) : (
          <div className="bg-dark-card border-dark-glow p-4 rounded-4 shadow-sm">
            <form
              onSubmit={handleChangePassword}
              className="d-flex flex-column gap-3.5 text-white"
            >
              {/* Old password */}
              <div className="d-flex flex-column">
                <label className="text-secondary mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Current Password</label>
                <div className="position-relative">
                  <input
                    type={showOld ? "text" : "password"}
                    className="form-control custom-input border-dark-glow text-white w-100"
                    placeholder="Enter current password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <span
                    className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
                    onClick={() => setShowOld(!showOld)}
                    style={{ cursor: "pointer", zIndex: 10 }}
                  >
                    {showOld ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </span>
                </div>
              </div>

              {/* New password */}
              <div className="d-flex flex-column">
                <label className="text-secondary mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase' }}>New Password</label>
                <div className="position-relative">
                  <input
                    type={showNew ? "text" : "password"}
                    className="form-control custom-input border-dark-glow text-white w-100"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <span
                    className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
                    onClick={() => setShowNew(!showNew)}
                    style={{ cursor: "pointer", zIndex: 10 }}
                  >
                    {showNew ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </span>
                </div>
              </div>

              {/* Confirm password */}
              <div className="d-flex flex-column">
                <label className="text-secondary mb-1.5" style={{ fontSize: '11px', textTransform: 'uppercase' }}>Confirm New Password</label>
                <div className="position-relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className="form-control custom-input border-dark-glow text-white w-100"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <span
                    className="position-absolute top-50 end-0 translate-middle-y me-3 text-secondary"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ cursor: "pointer", zIndex: 10 }}
                  >
                    {showConfirm ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </span>
                </div>
              </div>

              <div className="d-flex gap-2.5 mt-2 gap-2">
                <button type="submit" className="btn btn-primary fw-semibold px-4 py-2 rounded-3 shadow-sm">
                  Save Password
                </button>
                <button
                  type="button"
                  className="btn btn-secondary fw-semibold px-4 py-2 rounded-3"
                  onClick={() => setChangePass(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalDetails;
