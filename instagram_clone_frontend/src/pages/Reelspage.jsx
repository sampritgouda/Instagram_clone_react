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
  // Global mute state — shared with Feeds & PostPopup via localStorage
  const [globalMuted, setGlobalMuted] = useState(() => localStorage.getItem('globalMuted') !== 'false');
  const [viewComment, setviewComment] = useState(false)
  const [selectedReel, setselectedReel] = useState(null)
  const [viewmore, setviewmore] = useState(false)
  const [openShareModal, setOpenShareModal] = useState(false);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [shareSearchResults, setShareSearchResults] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const [sentStatus, setSentStatus] = useState({});
  const videoRefs = useRef({});
  const containerRef = useRef(null); // reference to the scrollable div

  const token = localStorage.getItem("token");
  const limit = 2; // reels per page
  const navigateUserProfile = (id) => {
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

  // Fetch recent conversations for sharing
  const fetchRecentChats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRecentChats(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (openShareModal) {
      fetchRecentChats();
      setShareSearchQuery('');
      setShareSearchResults([]);
      setShareMessage('');
      setSentStatus({});
    }
  }, [openShareModal]);

  // Live user search for sharing
  useEffect(() => {
    if (!shareSearchQuery.trim()) {
      setShareSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/${encodeURIComponent(shareSearchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setShareSearchResults(await res.json());
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [shareSearchQuery, token]);

  const handleShareReel = async (recipientId) => {
    if (!selectedReel) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: recipientId,
          content: shareMessage.trim() ? shareMessage.trim() : "Shared a reel",
          reelId: selectedReel.id
        })
      });
      if (res.ok) {
        setSentStatus(prev => ({ ...prev, [recipientId]: true }));
      } else {
        alert("Failed to share reel");
      }
    } catch (err) {
      console.error(err);
      alert("Error sharing reel");
    }
  };



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
  }, [page, loading, hasMore]);




  // Autoplay when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => { });
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


  const toggleMute = () => {
    const next = !globalMuted;
    setGlobalMuted(next);
    localStorage.setItem('globalMuted', String(next));
    // Apply to all currently mounted reel videos
    Object.values(videoRefs.current).forEach(v => { if (v) v.muted = next; });
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
        <h3 className="reals-page-heading">Reels</h3>

        <div
          ref={containerRef}
          className="d-flex flex-column align-items-center gap-5 p-0 p-md-5 col-p-0 mt-4"
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
                  muted={globalMuted}
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
                  className='reels-volume'
                  onClick={() => toggleMute()}
                >
                  {globalMuted ? (
                    <FaVolumeMute size={20} />
                  ) : (
                    <FaVolumeUp size={20} />
                  )}
                </span>
              </div>

              {/* Actions */}
              <div className="d-flex flex-column justify-content-end pb-5 reel-actions" style={{ fontFamily: "-moz-initial", marginTop: '150px' }}>
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

                <span style={{ cursor: 'pointer' }} onClick={() => {
                  setviewComment(!viewComment)
                  setselectedReel(reel)
                }} className="absolute bottom-1 right-5 bg-black/60 p-3 rounded-full text-white">
                  <FaRegComment size={22} />
                </span>
                <div
                  className="absolute bottom-1 right-5 bg-black/60 p-3 rounded-full text-white"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setselectedReel(reel);
                    setOpenShareModal(true);
                  }}
                >
                  <Share2 size={22} />
                </div>
                <div className="absolute bottom-1 right-5 bg-black/60 p-3 rounded-full text-white">
                  <Save id={reel.id} type={'reel'} initialSaved={saved[reel.id]} />
                </div>
                <DownloadButton videourl={reel.videoUrl} id={reel.id} />
                <button className='btn text-white'
                  onClick={() => {
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
                <span onClick={() => navigateUserProfile(reel.user.id)}
                  style={{ cursor: "pointer" }}>{reel.user.username}</span>
                <ProfileHeader user={reel.user} />
              </div>
            </div>
          ))}

          {loading && <p>Loading more reels...</p>}
          {!hasMore && <p>No more reels</p>}
        </div>
      </div>
      {viewComment && <div className='position-absolute h-50 p-2 bg-dark d-flex justify-content-center align-items-center'
        style={{ top: "20%", right: "2%", width: "25%" }}>
        <Comment id={selectedReel.id} type={'reel'} /></div>}
      {viewmore && <div className='position-absolute rounded p-2 bg-dark d-flex justify-content-center align-items-center'
        style={{ bottom: "30%", right: "15%", width: "15%" }}>
        <MorePopup id={selectedReel.id} token={token} type={'reels'} user={selectedReel.user}
          close={() => {
            setviewmore(false)
            setselectedReel(null)
          }} />
      </div>}

      {/* ── Share Reel Modal ── */}
      {openShareModal && selectedReel && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999
          }}
          onClick={() => setOpenShareModal(false)}
        >
          <div
            className="card bg-dark text-white border-secondary rounded-4 shadow-lg p-4"
            style={{
              width: '100%',
              maxWidth: '440px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              animation: 'fadeIn 0.25s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0 fw-bold">Share Reel</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setOpenShareModal(false)}
              ></button>
            </div>

            {/* Reel Preview */}
            <div className="d-flex align-items-center gap-3 p-2 mb-3 rounded-3 border" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <video
                src={selectedReel.videoUrl}
                className="rounded-2"
                style={{ width: '50px', height: '65px', objectFit: 'cover' }}
                muted
                playsInline
              />
              <div style={{ minWidth: 0 }}>
                <div className="fw-semibold text-white-50" style={{ fontSize: '12px' }}>Sharing Reel by</div>
                <div className="fw-bold" style={{ fontSize: '14px' }}>@{selectedReel.user?.username}</div>
                <div className="text-muted text-truncate" style={{ fontSize: '12px', maxWidth: '280px' }}>
                  {selectedReel.caption || "No caption"}
                </div>
              </div>
            </div>

            {/* Optional message input */}
            <div className="mb-3">
              <input
                type="text"
                className="form-control bg-black text-white border-secondary rounded-3"
                placeholder="Write a message..."
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                style={{ fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            {/* Search Input */}
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text bg-black border-secondary text-secondary" style={{ border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none' }}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.868-3.834zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="form-control bg-black text-white border-secondary"
                  placeholder="Search friends..."
                  value={shareSearchQuery}
                  onChange={(e) => setShareSearchQuery(e.target.value)}
                  style={{ fontSize: '14px', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none' }}
                />
              </div>
            </div>

            {/* Friends/Searched list container */}
            <div
              className="flex-grow-1 overflow-auto pe-1"
              style={{ minHeight: '180px', maxHeight: '300px', scrollbarWidth: 'thin' }}
            >
              {shareSearchQuery.trim() ? (
                // Search Results
                shareSearchResults.length === 0 ? (
                  <div className="text-center text-muted py-4">No users found</div>
                ) : (
                  shareSearchResults.map(user => (
                    <div
                      key={user.id}
                      className="d-flex align-items-center justify-content-between py-2 border-bottom"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={user.userprofile || 'https://ui-avatars.com/api/?background=333&color=fff&name=' + user.username}
                          className="rounded-circle"
                          style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                          alt=""
                        />
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '14px' }}>{user.username}</div>
                        </div>
                      </div>

                      <button
                        className={`btn btn-sm px-3 rounded-pill fw-bold ${sentStatus[user.id] ? 'btn-secondary' : 'btn-danger'}`}
                        disabled={sentStatus[user.id]}
                        onClick={() => handleShareReel(user.id)}
                        style={{
                          fontSize: '12px',
                          background: sentStatus[user.id] ? '#444' : 'linear-gradient(135deg, #e05d5d, #c0392b)',
                          border: 'none'
                        }}
                      >
                        {sentStatus[user.id] ? 'Sent ✓' : 'Send'}
                      </button>
                    </div>
                  ))
                )
              ) : (
                // Recent Conversations
                recentChats.length === 0 ? (
                  <div className="text-center text-muted py-4" style={{ fontSize: '13px' }}>
                    No recent conversations.<br />Search a friend above!
                  </div>
                ) : (
                  recentChats.map(chatUser => (
                    <div
                      key={chatUser.id}
                      className="d-flex align-items-center justify-content-between py-2 border-bottom"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={chatUser.userprofile || 'https://ui-avatars.com/api/?background=333&color=fff&name=' + chatUser.username}
                          className="rounded-circle"
                          style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                          alt=""
                        />
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '14px' }}>{chatUser.username}</div>
                        </div>
                      </div>

                      <button
                        className={`btn btn-sm px-3 rounded-pill fw-bold ${sentStatus[chatUser.id] ? 'btn-secondary' : 'btn-danger'}`}
                        disabled={sentStatus[chatUser.id]}
                        onClick={() => handleShareReel(chatUser.id)}
                        style={{
                          fontSize: '12px',
                          background: sentStatus[chatUser.id] ? '#444' : 'linear-gradient(135deg, #e05d5d, #c0392b)',
                          border: 'none'
                        }}
                      >
                        {sentStatus[chatUser.id] ? 'Sent ✓' : 'Send'}
                      </button>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReelsPage;
