import React, { useEffect, useState } from 'react';
import PostPopup from './PostPopup';

const UserProfileFeed = ({ id ,type ,user}) => {
  const token = localStorage.getItem("token");
  const [posts, setPosts] = useState([]);
  const [selected, setselected] = useState(null)
  
  const fetchPosts = async () => {
    try {
      const resp = await fetch(`http://localhost:8080/api/profile/${type}?id=${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resp.ok) throw new Error("Failed to fetch posts");

      const data = await resp.json();
      setPosts(data);
      console.log(data)
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [id,type]);

  return (
    <div className="container-fluid py-2 bg-black m-0 feed-popup" >
      <div className="row g-2">
        {posts.map((p) => (
          <div key={p.id} className="col-4 feed-vdo" style={{ cursor:'pointer' }} onClick={()=>setselected(p)}>
            {p.mediaType === "image" ? (
              <img
                src={p.mediaUrl}
                className="w-100 h-100"
                alt="Post"
                style={{ objectFit: "cover" }}
              />
            ) : p.mediaType === "video" ? (
              <video
                className="w-100 h-100"
                muted
                loop
                playsInline
                style={{ objectFit: "cover" }}
                
              >
                <source src={p.mediaUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : null}
          </div>
        ))}
      </div>
      {selected && <PostPopup feed={selected} onclose={()=>setselected(null)} user={user} />}
    </div>
  );
};

export default UserProfileFeed;
