import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config";

function DeleteButton({ id, type, onDelete, token }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/${type}/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error(`Failed to delete ${type}`);

      addToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, "success");

      if (onDelete) onDelete(id); // notify parent to remove item from UI
    } catch (err) {
      addToast(err.message || `Failed to delete ${type}`, "error");
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
