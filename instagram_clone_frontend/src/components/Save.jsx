import React, { useState } from "react";
import { FaBookmark, FaRegBookmark } from "react-icons/fa";
import { API_BASE_URL } from "../config";

const Save = ({ id, type, initialSaved }) => {
  const [saved, setSaved] = useState(initialSaved || false);

  const handleSave = async () => {
    try {
      const url = `${API_BASE_URL}/api/save`;
      const token = localStorage.getItem("token");

      const res = await fetch(url, {
        method: saved ? "DELETE" : "POST", // toggle
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
         body: JSON.stringify({ id,type })
      });

      if (res.ok) {
        setSaved(!saved);
      }
    } catch (err) {
      console.error("Error while saving:", err);
    }
  };

  return (
    <span onClick={handleSave} style={{ cursor: "pointer" }}>
      {saved ? <FaBookmark size={22}/> : <FaRegBookmark size={22}/>}
    </span>
  );
};

export default Save;
