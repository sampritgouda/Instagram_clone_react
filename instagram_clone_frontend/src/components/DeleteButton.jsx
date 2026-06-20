import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { API_BASE_URL } from "../config";

function DeleteButton({ id, type, onDelete, token }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    setLoading(true);
    try {
     console.log(id)
      const res = await fetch(`${API_BASE_URL}/api/${type}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error(`Failed to delete ${type}`);

      console.log(`${type} deleted successfully`);

      if (onDelete) onDelete(id); // notify parent to remove item from UI
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span
      className="px-3 text-white"
      onClick={handleDelete}
      disabled={loading}
      style={{cursor:"pointer"}}
    >
      
      {loading ? "Deleting..." : "Delete"}
    </span>
  );
}

export default DeleteButton;
