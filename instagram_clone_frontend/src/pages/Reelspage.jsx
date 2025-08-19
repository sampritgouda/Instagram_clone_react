import React, { useEffect, useRef, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  FaHeart,
  FaRegHeart,
  FaShare,
  FaBookmark,
  FaRegBookmark,
  FaRegComment,
  FaVolumeMute,
  FaVolumeUp
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';

function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [likes, setLikes] = useState({});
  const [likecount, setlikecount] = useState({});
  const [saved, setSaved] = useState({});
  const [saveCount, setsaveCount] = useState({});
  const [muted, setMuted] = useState({});
  const videoRefs = useRef({});
  const containerRef = useRef(null); // reference to the scrollable div

  const token = localStorage.getItem("token");
  const limit = 2; // reels per page

  // Fetch reels for a specific page
  const fetchReels = async (pageNum) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/reels?page=${pageNum}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(data)

      if (data.length === 0) {
        setHasMore(false); // no more reels
      } else {
        setReels(prev => [...prev, ...data]);

        const initialLikes = {};
        const initialLikeCount = {};
        const initialSaved = {};
        const initialSaveCount = {};

        data.forEach(reel => {
          initialLikes[reel.id] = reel.liked || false;
          initialLikeCount[reel.id] = reel.likeCount;
          initialSaved[reel.id] = reel.saved || false;
          initialSaveCount[reel.id] = reel.saveCount;
        });

        setLikes(prev => ({ ...prev, ...initialLikes }));
        setlikecount(prev => ({ ...prev, ...initialLikeCount }));
        setSaved(prev => ({ ...prev, ...initialSaved }));
        setsaveCount(prev => ({ ...prev, ...initialSaveCount }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      
    }
  };

  // Initial load
  useEffect(() => {
    fetchReels(page);
 
  }, []);



  useEffect(() => {
    const scrollContainer = containerRef.current;

    const handleScroll = () => {
      const bottomReached =
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 100; // 100px before bottom
      console.log(bottomReached)
      console.log(!loading)
      console.log(hasMore)

      if (bottomReached && !loading && hasMore) {
         const nextPage = page + 1;
        setPage(nextPage);
        fetchReels(nextPage);

      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [page,loading,hasMore]);




  // Autoplay when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.75 }
    );

    Object.values(videoRefs.current).forEach(video => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [reels]);

  const toggleLike = async (id) => {
    const type='reel'
    const isLiked = likes[id];
    const url = `http://localhost:8080/api/like`;

    try {
      let resp;
      if (!isLiked) {
        resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ id,type })
        });
      } else {
        resp = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ id,type })
        });
      }
      if (resp.ok) {
        setLikes(prev => ({ ...prev, [id]: !prev[id] }));
        setlikecount(pre => ({ ...pre, [id]: likes[id] ? pre[id] - 1 : pre[id] + 1 }));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const toggleSave = async (id) => {
    const type ='reel'
    const isSaved = saved[id];
    const url = `http://localhost:8080/api/save`;

    try {
      let resp;
      if (!isSaved) {
        resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ id,type })
        });
      } else {
        resp = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ id ,type})
        });
      }
      if (resp.ok) {
        setSaved(prev => ({ ...prev, [id]: !prev[id] }));
        setsaveCount(pre => ({ ...pre, [id]: saved[id] ? pre[id] - 1 : pre[id] + 1 }));
      }
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  const toggleMute = (id) => {
    setMuted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePlayPause = id => {
    const video = videoRefs.current[id];
    if (video.paused) video.play();
    else video.pause();
  };

  

  return (
    <div className="d-flex" style={{ height: "100vh" }}>
      <Sidebar />
      <div className="container-fluid bg-black text-white">
        <h3 className="">Reels</h3>

        <div
        ref={containerRef}
          className="d-flex flex-column align-items-center gap-5 p-5"
          style={{
            overflowY: "auto",
            maxHeight: "90vh",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "y mandatory"
          }}
        >
          {reels.map(reel => (
            <div
              key={reel.id}
              className="border-0 d-flex align-items-center gap-3"
              style={{
                position: "relative",
                maxWidth: '400px',
                width: '100%',
                minHeight: '90vh',
                scrollSnapAlign: 'start'
              }}
            >
              {/* Video */}
              <div className='p-3' style={{ width: "80%", height: "100%" }}>
                <video
                  ref={el => (videoRefs.current[reel.id] = el)}
                  className="w-100"
                  style={{ borderRadius: '10px' }}
                  src={reel.videoUrl}
                  muted={muted[reel.id]}
                  loop
                  onClick={() => togglePlayPause(reel.id)}
                />
                {/* Mute/Unmute */}
                <span
                  style={{
                    position: 'absolute',
                    top: '5%',
                    right: '15%',
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleMute(reel.id)}
                >
                  {muted[reel.id] ? (
                    <FaVolumeMute size={20} />
                  ) : (
                    <FaVolumeUp size={20} />
                  )}
                </span>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column justify-content-end pb-5 gap-4 " style={{ fontFamily: "-moz-initial",marginTop:'150px' }}>
                <span
                  className='d-flex flex-column align-items-center'
                  onClick={() => toggleLike(reel.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {likes[reel.id] ? (
                    <FaHeart color="red" size={24} />
                  ) : (
                    <FaRegHeart size={22} />
                  )}
                  <p className='text-white mb-0'>{likecount[reel.id]}</p>
                </span>
                <span style={{ cursor: 'pointer' }}>
                  <FaRegComment size={22} />
                </span>
                <span style={{ cursor: 'pointer' }}>
                  <FaShare size={22} />
                </span>

                <span
                  className='d-flex flex-column align-items-center'
                  onClick={() => toggleSave(reel.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {saved[reel.id] ? (
                    <FaBookmark size={22} />
                  ) : (
                    <FaRegBookmark size={22} />
                  )}
                  <p className='text-white mb-0'>{saveCount[reel.id]}</p>
                </span>
                <span className='text-center' style={{ fontSize: "25px" }}>...</span>
              </div>

              {/* User Info */}
              <div
                className='d-flex gap-3 align-items-center'
                style={{
                  position: 'absolute',
                  bottom: '10%',
                  left: '4%'
                }}
              >
                <img
                  className='rounded-circle'
                  src={reel.user.profilePicUrl}
                  style={{ width: "40px", height: "40px" }}
                />
                <span>{reel.user.username}</span>
                <ProfileHeader user={reel.user} />
              </div>
            </div>
          ))}

          {loading && <p>Loading more reels...</p>}
          {!hasMore && <p>No more reels</p>}
        </div>
      </div>
    </div>
  );
}

export default ReelsPage;
