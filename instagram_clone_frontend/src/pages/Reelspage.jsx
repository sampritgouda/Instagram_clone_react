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
  FaVolumeUp,
  FaDownload
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import ProfileHeader from '../components/ProfileHeader';
import { useNavigate } from 'react-router-dom';
import Like from '../components/Like';
import Save from '../components/Save';
import SideComponent from '../components/SideComponent';
import Comment from '../components/Comment';
import { Share2 } from 'lucide-react';
import DownloadButton from '../components/DownloadButton';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import MorePopup from '../components/MorePopup';
import { API_BASE_URL } from '../config';
function ReelsPage() {
const navigate = useNavigate()

  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [likes, setLikes] = useState({});
  const [likecount, setlikecount] = useState({});
  const [saved, setSaved] = useState({});
  const [saveCount, setsaveCount] = useState({});
  const [muted, setMuted] = useState({});
  const [viewComment, setviewComment] = useState(false)
  const [selectedReel, setselectedReel] = useState(null)
  const [viewmore, setviewmore] = useState(false)
  const videoRefs = useRef({});
  const containerRef = useRef(null); // reference to the scrollable div

  const token = localStorage.getItem("token");
  const limit = 2; // reels per page
  const navigateUserProfile = (id) =>{
    navigate(`/profile/${id}`)
  }

  // Fetch reels for a specific page
  const fetchReels = async (pageNum) => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reels?page=${pageNum}&limit=${limit}`, {
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
      setviewComment(false)
      setselectedReel(null)
      setviewmore(false)

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
      <SideComponent />
      <div className="container-fluid bg-black text-white ">
        <h3 className="">Reels</h3>

        <div
        ref={containerRef}
         className="d-flex flex-column align-items-center gap-5 p-0 p-md-5 col-p-0"
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
              className="border-0 d-flex align-items-center col-12"
              style={{
                position: "relative",
                maxWidth: '400px',
                width: '100%',
                minHeight: '90vh',
                scrollSnapAlign: 'start'
              }}
            >
              {/* Video */}
              <div className='p-3' style={{ width: "100%", height: "100%" }}>
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
              <div className="d-flex flex-column justify-content-end pb-5 reel-actions" style={{ fontFamily: "-moz-initial",marginTop:'150px' }}>
                <span className='d-flex flex-column align-items-center'>
                <Like 
                  id={reel.id} 
                  type="reel" 
                  initialLiked={likes[reel.id]} 
                  onLikeToggle={(newLiked) => {
                    setLikes(prev => ({ ...prev, [reel.id]: newLiked }));
                    setlikecount(prev => ({
                      ...prev,
                      [reel.id]: newLiked ? prev[reel.id] + 1 : prev[reel.id] - 1
                    }));
                  }}
                />
                <p className='text-white mb-0'>{likecount[reel.id]}</p>
              </span>

                <span style={{ cursor: 'pointer' }} onClick={()=>{
                  setviewComment(!viewComment)
                  setselectedReel(reel)
                }} className="absolute bottom-1 right-5 bg-black/60 p-3 rounded-full text-white">
                  <FaRegComment size={22} />
                </span>
                <div className="absolute bottom-1 right-5 bg-black/60 p-3 rounded-full text-white">
                  <Share2 size={22} />
               </div>
                <div className="absolute bottom-1 right-5 bg-black/60 p-3 rounded-full text-white">
                <Save id={reel.id} type={'reel'} initialSaved={saved[reel.id]}/>
                </div>
                <DownloadButton videourl={reel.videoUrl} id={reel.id}/>
                <button className='btn text-white'
                          onClick={()=>{
                            setselectedReel(reel)
                            setviewmore(!viewmore)
                          }}><BiDotsVerticalRounded size={24} /></button>
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
                <span onClick={()=>navigateUserProfile(reel.user.id)}
                  style={{cursor:"pointer"}}>{reel.user.username}</span>
                <ProfileHeader user={reel.user} />
              </div>
            </div>
          ))}

          {loading && <p>Loading more reels...</p>}
          {!hasMore && <p>No more reels</p>}
        </div>
      </div>
      {viewComment && <div className='position-absolute h-50 p-2 bg-dark d-flex justify-content-center align-items-center'
       style={{top:"20%",right:"2%",width:"25%"}}>
        <Comment id={selectedReel.id} type={'reel'} /></div>}
        {viewmore && <div className='position-absolute rounded p-2 bg-dark d-flex justify-content-center align-items-center'
           style={{bottom:"30%",right:"15%",width:"15%"}}>
          <MorePopup id={selectedReel.id} token={token} type={'reels'} user={selectedReel.user} 
          close={()=>{
            setviewmore(false)
            setselectedReel(null)
          }}/>
          </div>}
    </div>
  );
}

export default ReelsPage;
