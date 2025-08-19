import React, { useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";

const Like = ({ id, type, initialLiked, initialCount }) => {
  const [liked, setLiked] = useState(initialLiked || false);
  const [count, setCount] = useState(initialCount || 0);

  const handleLike = async () => {
    try {
      const url = `http://localhost:8080/api/like`; 
      const token = localStorage.getItem("token");

      const res = await fetch(url, {
        method: liked ? "DELETE" : "POST", // toggle
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
          body: JSON.stringify({ id,type })
      });

      if (res.ok) {
        setLiked(!liked);
        setCount(prev => liked ? prev - 1 : prev + 1);
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
