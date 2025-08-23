import React, { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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

  const [popup, setPopup] = useState({ show: false, message: "", type: "" });

  const showPopup = (message, type = "success") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "" }), 2000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch(
          "http://localhost:8080/api/profile/setting/details",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (resp.ok) {
          const data = await resp.json();
          setUsername(data.username);
          setEmail(data.email);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateDetails = async (field, value) => {
    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        "http://localhost:8080/api/profile/setting/details",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ [field]: value }),
        }
      );

      if (resp.ok) {
        showPopup(`${field} updated successfully`, "success");
        if (field === "username") setEditUsername(false);
      } else {
        showPopup("Failed to update", "error");
      }
    } catch (err) {
      console.error("Error updating details:", err);
      showPopup("Error updating details", "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showPopup("New passwords do not match", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const resp = await fetch(
        "http://localhost:8080/api/profile/setting/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        }
      );

      if (resp.ok) {
        showPopup("Password updated successfully", "success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setChangePass(false);
      } else {
        const errData = await resp.json();
        showPopup(errData.error || "Failed to update password", "error");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      showPopup("Error changing password", "error");
    }
  };

  return (
    <div className="container p-4 text-white position-relative">
      <h4 className="mb-4">Personal Details</h4>

      {popup.show && (
        <div
          className={`position-fixed top-0 start-50 translate-middle-x mt-3 px-4 py-2 rounded shadow ${
            popup.type === "success" ? "bg-success" : "bg-danger"
          } text-white`}
          style={{ zIndex: 9999 }}
        >
          {popup.message}
        </div>
      )}

      {/* Username */}
      <div className="bg-dark p-3 rounded mb-3 d-flex justify-content-between align-items-center">
        {!editUsername ? (
          <>
            <span>Username: {username}</span>
            <button
              className="btn btn-primary"
              onClick={() => setEditUsername(true)}
            >
              Edit
            </button>
          </>
        ) : (
          <div className="d-flex w-100 gap-2">
            <input
              type="text"
              className="form-control bg-dark text-white"
              style={{ "::placeholder": { color: "white" } }}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleUpdateDetails("username", username)}
            >
              Save
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setEditUsername(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Email (read-only) */}
      <div className="bg-dark p-3 rounded mb-3 d-flex justify-content-between align-items-center">
        <span>Email: {email}</span>
      </div>

      {/* Password */}
      {!changePass ? (
          <button
            className="btn btn-sm w-100 text-white bg-dark"
            style={{height:"50px",fontSize:"18px"}}
            onClick={() => setChangePass(true)}
          >
            Change Password
          </button>
        ) : (
      <div className="bg-dark p-3 rounded">
        
          <form
            onSubmit={handleChangePassword}
            className="d-flex flex-column gap-2 text-white"
          >
            {/* Old password */}
            <div className="position-relative">
              <input
              type={showOld ? "text" : "password"}
              className="form-control bg-dark text-white"
              placeholder="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

              <span
                className="position-absolute top-50 end-0 translate-middle-y me-2"
                onClick={() => setShowOld(!showOld)}
                style={{ cursor: "pointer" }}
              >
                {showOld ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* New password */}
            <div className="position-relative">
              <input
                type={showNew ? "text" : "password"}
                className="form-control bg-dark text-white"
                placeholder="New Password"
                style={{ "::placeholder": { color: "white" } }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <span
                className="position-absolute top-50 end-0 translate-middle-y me-2"
                onClick={() => setShowNew(!showNew)}
                style={{ cursor: "pointer" }}
              >
                {showNew ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {/* Confirm password */}
            <div className="position-relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="form-control bg-dark text-white"
                placeholder="Confirm New Password"
                style={{ "::placeholder": { color: "white" } }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span
                className="position-absolute top-50 end-0 translate-middle-y me-2"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ cursor: "pointer" }}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                Save
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setChangePass(false)}
              >
                Cancel
              </button>
            </div>
          </form>
       
      </div>
       )}
    </div>
  );
};

export default PersonalDetails;
