import React, { useEffect, useState } from "react";

const Privacy = () => {
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch privacy status from backend on load
  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch("http://localhost:8080/api/profile/privacy", {
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
      await fetch("http://localhost:8080/api/profile/privacy", {
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
    <div className="container p-4 text-white">
      <h4 className="mb-3">Privacy Settings</h4>

      <div className="d-flex justify-content-between align-items-center bg-dark p-3 rounded">
        <span>Private Account</span>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="privateAccountSwitch"
            checked={isPrivate}
            onChange={handleToggle}
          />
        </div>
      </div>

      <p className="mt-3 text-secondary" style={{ fontSize: "14px" }}>
        {isPrivate
          ? "Only your followers will be able to see your posts and reels."
          : "Everyone can see your posts and reels."}
      </p>
    </div>
  );
};

export default Privacy;
