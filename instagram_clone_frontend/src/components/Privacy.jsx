import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../config";

const Privacy = () => {
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch privacy status from backend on load
  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`${API_BASE_URL}/api/profile/privacy`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resp.ok) {
          const data = await resp.json();
          setIsPrivate(data.private); // backend should return { private: true/false }
        }
      } catch (err) {
        console.error("Error fetching privacy status:", err);
      }
    };

    fetchPrivacy();
  }, []);

  // Toggle and update in backend
  const handleToggle = async () => {
    const newStatus = !isPrivate;
    setIsPrivate(newStatus);

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_BASE_URL}/api/profile/privacy`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ private: newStatus }),
      });
    } catch (err) {
      console.error("Error updating privacy status:", err);
    }
  };

  return (
    <div className="w-100 text-white">
      <div className="mx-auto px-2" style={{ maxWidth: "600px" }}>
        <h4 className="fw-bold mb-4 mt-2" style={{letterSpacing: '0.3px'}}>Privacy Settings</h4>

        <div className="bg-dark-card border-dark-glow p-4 rounded-4 mb-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="fw-semibold mb-1" style={{fontSize: '15px'}}>Private Account</p>
              <p className="text-secondary mb-0" style={{fontSize: '13px', lineHeight: '1.4'}}>
                {isPrivate
                  ? "Only your followers can see your posts and reels."
                  : "Everyone can see your posts and reels."}
              </p>
            </div>
            <div className="form-check form-switch ms-4">
              <input
                className="form-check-input"
                type="checkbox"
                id="privateAccountSwitch"
                checked={isPrivate}
                onChange={handleToggle}
                style={{width: '48px', height: '26px', cursor: 'pointer'}}
              />
            </div>
          </div>
        </div>

        <div className="bg-dark-card border-dark-glow p-4 rounded-4 shadow-sm">
          <p className="fw-semibold mb-2" style={{fontSize: '15px'}}>About Account Privacy</p>
          <p className="text-secondary mb-0" style={{fontSize: '13px', lineHeight: '1.6'}}>
            When your account is private, only people you approve can see your photos and videos.
            Your existing followers won't be affected. Businesses cannot set their accounts to private.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
