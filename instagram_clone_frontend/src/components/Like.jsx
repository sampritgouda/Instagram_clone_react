import React, { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { API_BASE_URL } from "../config";

const Like = ({ id, type, initialLiked, initialCount, onLikeToggle }) => {
  const [liked, setLiked] = useState(initialLiked || false);
  const [count, setCount] = useState(initialCount || 0);

  const handleLike = async () => {
    try {
      const url = `${API_BASE_URL}/api/like`; 
      const token = localStorage.getItem("token");

      const res = await fetch(url, {
        method: liked ? "DELETE" : "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id, type })
      });

      if (res.ok) {
        const newLiked = !liked;
        setLiked(newLiked);
        setCount(prev => newLiked ? prev + 1 : prev - 1);

        // Inform parent Feeds
        if (onLikeToggle) {
          onLikeToggle(newLiked);
        }
      }
    } catch (err) {
      console.error("Error while liking:", err);
    }
  };

  return (
    <span onClick={handleLike} style={{ cursor: "pointer" }}>
      {liked ? <FaHeart color="red" size={25}/> : <FaRegHeart size={25}/>} 
    </span>
  );
};

export default Like;
