import React, { useEffect, useState, useRef } from 'react';
import { FaBookmark,  FaHeart, FaRegBookmark, FaRegComment, FaRegHeart, FaShare, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'; // icons
import { FaShareNodes } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from './ProfileHeader';

function Feeds({scrollcontainerref}) {
  const [feedData, setFeedData] = useState([]);
  const [mutedState, setMutedState] = useState({}); // Track mute state per video
  const [playingState, setPlayingState] = useState({}); // Track play/pause state
  const token = localStorage.getItem("token");
  const videoRefs = useRef([]);
  const [hasMore, sethasMore] = useState(true)
  const [loading, setloading] = useState(false)
  const [page, setpage] = useState(0)
  const limit =2
  const navigate = useNavigate()
  const [likes, setlikes] = useState({})
  const [likecount, setlikecount] = useState({})
  const [saved, setsaved] = useState({})

  const navigateUserProfile = (id) =>{
    navigate(`/profile/${id}`)
  }
  
  const fetchPosts = async (pageNum) => {
    if (loading || !hasMore) return;

    setloading(true);
  
    fetch(`http://localhost:8080/api/posts?page=${pageNum}&limit=${limit}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) {
        sethasMore(false); // no more reels
      } else {
        console.log(data)
        setFeedData(prev => [...prev, ...data]);
        const initialLikes = {};
        const initialLikeCount = {};
        const initialSaved = {};
        data.forEach(post=>{
          initialLikes[post.id] = post.liked || false;
          initialLikeCount[post.id] = post.likeCount;
          initialSaved[post.id] = post.saved || false;
        })
        setlikes(prev => ({ ...prev, ...initialLikes }));
        setlikecount(prev => ({ ...prev, ...initialLikeCount }));
        setsaved(prev => ({ ...prev, ...initialSaved }));
      }
        console.log(data);
      })
      .catch(err => console.error("Error fetching feeds:", err))
      .finally
      {
        setloading(false)
      }
 
}

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const index = video.dataset.index;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            setPlayingState((prev) => ({ ...prev, [index]: true }));
          } else {
            video.pause();
            setPlayingState((prev) => ({ ...prev, [index]: false }));
          }
        });
      },
      { threshold: 0.6 }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      observer.disconnect();
    };
  }, [feedData]);



  useEffect(() => {
      const scrollContainer = scrollcontainerref.current;
  
      const handleScroll = () => {
        const bottomReached =
          scrollContainer.scrollTop + scrollContainer.clientHeight >=
          scrollContainer.scrollHeight - 100; // 100px before bottom
        console.log(bottomReached)
        console.log(!loading)
        console.log(hasMore)
  
        if (bottomReached && !loading && hasMore) {
           const nextPage = page + 1;
          setpage(nextPage);
          fetchPosts(nextPage);
  
        }
      };
  
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => {
        scrollContainer.removeEventListener("scroll", handleScroll);
      };
    }, [page,loading,hasMore]);


    useEffect(()=>{
      fetchPosts(page)
    },[])

  const toggleMute = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      video.muted = !video.muted;
      setMutedState((prev) => ({ ...prev,[index]: video.muted }));
    }
  };

  const togglePlayPause = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
        setPlayingState((prev) => ({ ...prev, [index]: true }));
      } else {
        video.pause();
        setPlayingState((prev) => ({ ...prev, [index]: false }));
      }
    }
  };



  
  const toggleLike = async (id) => {
    const isLiked = likes[id];
    const type ='post'
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
          body: JSON.stringify({ id ,type })
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
        setlikes(prev => ({ ...prev, [id]: !prev[id] }));
        setlikecount(pre => ({ ...pre, [id]: likes[id] ? pre[id] - 1 : pre[id] + 1 }));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const toggleSave = async (id) => {
    const type='post'
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
          body: JSON.stringify({ id ,type})
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
        setsaved(prev => ({ ...prev, [id]: !prev[id] }));
        
      }
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  return (
    <div>
      {feedData.map((feed, index) => (
        <div key={index} className="card mb-4 shadow-sm container bg-black text-white  position-relative"
         style={{ borderBottom: "1px solid lightgrey" }}>
          <div className="d-flex gap-3 p-0 mb-2 align-items-center">
        <img
          src={feed.user.profilePicUrl}
          className="rounded-circle"
          style={{ width: 40, height: 40, objectFit: 'cover' }}
          alt="Profile"
        />
        <strong
          onClick={() => navigateUserProfile(feed.user.id)}
          style={{ cursor: 'pointer' }}
        >
          {feed.user?.username}
        </strong>
          <ProfileHeader user = {feed.user}/>
          </div>

          {feed.mediaType === "image" ? (
            <img
              src={feed.imageUrl}
              className="card-img-top"
              alt="Post"
              style={{ maxHeight: "500px", objectFit: "cover" }}
            />
          ) : feed.mediaType === "video" ? (
            <div className="position-relative">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                data-index={index}
                className="card-img-top"
                muted
                loop
                playsInline
                onClick={() => togglePlayPause(index)}
                style={{ maxHeight: "500px", objectFit: "cover", cursor: "pointer" }}
              >
                <source src={feed.imageUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>

              {/* Mute/Unmute button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering play/pause
                  toggleMute(index);
                }}
                className="btn btn-dark position-absolute"
                style={{ bottom: "20px", right: "10px", opacity: 0.8 }}
              >
                {mutedState[index] !== false ? <FaVolumeMute /> : <FaVolumeUp />}
              </button>
            </div>
          ) : null}
         <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '20px' }}>
              
              {/* Left icons */}
              <div className="d-flex gap-3">
                <span onClick={() => toggleLike(feed.id)} style={{ cursor: 'pointer' }}>
                  {likes[feed.id] ? (
                    <FaHeart color="red" size={24} />
                  ) : (
                    <FaRegHeart size={22} />
                  )}
                </span>

                <span style={{ cursor: 'pointer' }}>
                  <FaRegComment size={22} />
                </span>

                <span style={{ cursor: 'pointer' }}>
                  <FaShare size={22} />
                </span>
              </div>

              {/* Right icon */}
              <span onClick={() => toggleSave(feed.id)} style={{ cursor: 'pointer' }}>
                {saved[feed.id] ? (
                  <FaBookmark size={22} />
                ) : (
                  <FaRegBookmark size={22} />
                )}
              </span>

            </div>

          <p className='ms-1 mt-2 mb-0'>{likecount[feed.id]} likes</p>
          <div className="card-body">
            <p className="card-text">{feed.caption}</p>
          </div>
        </div>
      ))}
      {loading && <p className='text-white'>Loading more reels...</p>}
       {!hasMore && <p className='text-white'>No more reels</p>}
    </div>
  );
}

export default Feeds;
