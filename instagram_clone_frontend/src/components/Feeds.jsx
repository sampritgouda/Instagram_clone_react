import React, { useEffect, useState, useRef } from 'react';
import { FaBookmark,  FaHeart, FaRegBookmark, FaRegComment, FaRegHeart, FaShare, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'; // icons
import { FaShareNodes } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from './ProfileHeader';
import Like from './Like';
import Save from './Save';
import Comment from './Comment';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import MorePopup from './MorePopup';
import { API_BASE_URL } from '../config';

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
  const [viewcomment, setviewcomment] = useState(false)
  const [selectedPost, setselectedPost] = useState(null)
  const [viewMore, setviewMore] = useState(false)

  const navigateUserProfile = (id) =>{
    navigate(`/profile/${id}`)
  }
  
  const fetchPosts = async (pageNum) => {
    if (loading || !hasMore) return;

    setloading(true);
  
    fetch(`${API_BASE_URL}/api/posts?page=${pageNum}&limit=${limit}`, {
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
        setviewcomment(false)
        setselectedPost(null)
        setviewMore(false)
  
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
          <button className='btn text-white ms-auto'
          onClick={()=>{
            setselectedPost(feed)
            setviewMore(!viewMore)
          }}><BiDotsVerticalRounded size={24} /></button>
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
                
                <Like 
                    id={feed.id} 
                    type={'post'} 
                    initialLiked={likes[feed.id]} 
                    initialCount={likecount[feed.id]} 
                    onLikeToggle={(newLiked) => {
                      setlikes(prev => ({ ...prev, [feed.id]: newLiked }));
                      setlikecount(prev => ({
                        ...prev,
                        [feed.id]: prev[feed.id] + (newLiked ? 1 : -1)
                      }));
                    }}
                  />

                <span style={{ cursor: 'pointer' }} onClick={()=>{
                  setviewcomment(!viewcomment)
                  setselectedPost(feed.id)
                }}>
                  <FaRegComment size={22} />
                </span>

                <span style={{ cursor: 'pointer' }}>
                  <FaShare size={22} />
                </span>
              </div>

              {/* Right icon */}
              <Save id={feed.id} type={'post'} initialSaved={saved[feed.id]}/>

            </div>

          <p className='ms-1 mt-2 mb-0'>{likecount[feed.id]} likes</p>
          <div className="card-body">
            <p className="card-text">{feed.caption}</p>
          </div>
        </div>
      ))}
      {loading && <p className='text-white text-center'>Loading more reels...</p>}
       {!hasMore && <p className='text-white text-center'>No more reels</p>}
       {viewcomment && <div className='position-absolute h-50 p-2 bg-dark d-flex justify-content-center align-items-center'
       style={{top:"18%",right:"10%",width:"25%"}}>
        <Comment id={selectedPost} type={'post'} /></div>}

        {viewMore && <div className='position-absolute p-2 bg-dark d-flex justify-content-center align-items-center'
           style={{top:"18%",right:"20%",width:"15%"}}>
          <MorePopup id={selectedPost.id} token={token} type={'posts'} user={selectedPost.user} close={()=>{
            setviewMore(false)
            setselectedPost(null)
          }}/>
          </div>}
    </div>
  );
}

export default Feeds;
