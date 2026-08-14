import React, { useEffect, useState, useRef } from 'react';
import { FaBookmark, FaHeart, FaRegBookmark, FaRegComment, FaRegHeart, FaShare, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'; // icons
import { FaShareNodes } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import ProfileHeader from './ProfileHeader';
import Like from './Like';
import Save from './Save';
import Comment from './Comment';
import { BiDotsVerticalRounded } from 'react-icons/bi';
import MorePopup from './MorePopup';
import ShareModal from './ShareModal';
import CommentsModal from './CommentsModal';
import { API_BASE_URL } from '../config';

function Feeds({ scrollcontainerref }) {
  const [feedData, setFeedData] = useState([]);
  // Global mute state — shared across all videos, persisted in localStorage
  const [globalMuted, setGlobalMuted] = useState(() => localStorage.getItem('globalMuted') !== 'false');
  const [playingState, setPlayingState] = useState({}); // Track play/pause state
  const token = localStorage.getItem("token");
  const videoRefs = useRef([]);
  const [hasMore, sethasMore] = useState(true)
  const [loading, setloading] = useState(false)
  const [page, setpage] = useState(0)
  const limit = 2
  const navigate = useNavigate()
  const [likes, setlikes] = useState({})
  const [likecount, setlikecount] = useState({})
  const [saved, setsaved] = useState({})
  const [viewcomment, setviewcomment] = useState(false)
  const [selectedPost, setselectedPost] = useState(null)
  const [viewMore, setviewMore] = useState(false)
  const [selectedMood, setSelectedMood] = useState("All");
  // ── Share Modal State ──────────────────────────────────────────────────
  const [openShareModal, setOpenShareModal] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [shareSearchQuery, setShareSearchQuery] = useState('');
  const [shareSearchResults, setShareSearchResults] = useState([]);
  const [shareMessage, setShareMessage] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const [sentStatus, setSentStatus] = useState({});

  // Zen Mode digital wellness states
  const [zenEnabled, setZenEnabled] = useState(() => {
    return localStorage.getItem("zenEnabled") === "true";
  });
  const [zenLimitType, setZenLimitType] = useState(() => {
    return localStorage.getItem("zenLimitType") || "posts";
  });
  const [zenLimitValue, setZenLimitValue] = useState(() => {
    return parseInt(localStorage.getItem("zenLimitValue") || "10", 10);
  });
  const [seenPosts, setSeenPosts] = useState(new Set());
  const [secondsSpent, setSecondsSpent] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(0); // Unix timestamp

  const MOODS = [
    { value: 'All', label: 'All 🌐' },
    { value: 'Chill', label: 'Chill ☕' },
    { value: 'Motivated', label: 'Motivated 💪' },
    { value: 'Funny', label: 'Funny 😂' },
    { value: 'Artistic', label: 'Artistic 🎨' },
    { value: 'Focused', label: 'Focused 📚' }
  ];

  const navigateUserProfile = (id) => {
    navigate(`/profile/${id}`)
  }

  // ── Share Post Logic ───────────────────────────────────────────────────
  const fetchRecentChats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRecentChats(await res.json());
    } catch (err) { console.error(err); }
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

  useEffect(() => {
    if (!shareSearchQuery.trim()) { setShareSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/${encodeURIComponent(shareSearchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setShareSearchResults(await res.json());
      } catch (err) { console.error(err); }
    }, 300);
    return () => clearTimeout(t);
  }, [shareSearchQuery, token]);

  const handleSharePost = async (recipientId, msg) => {
    if (!sharePost) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipientId,
          content: msg && msg.trim() ? msg.trim() : 'Shared a post',
          postId: sharePost.id
        })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Persist configurations to localStorage
  useEffect(() => {
    localStorage.setItem("zenEnabled", zenEnabled);
  }, [zenEnabled]);

  useEffect(() => {
    localStorage.setItem("zenLimitType", zenLimitType);
  }, [zenLimitType]);

  useEffect(() => {
    localStorage.setItem("zenLimitValue", zenLimitValue);
  }, [zenLimitValue]);

  // Track active time spent on feed
  useEffect(() => {
    let timer = null;
    if (zenEnabled && zenLimitType === 'time') {
      timer = setInterval(() => {
        const isPaused = Date.now() < pausedUntil;
        if (!isPaused) {
          setSecondsSpent(prev => prev + 1);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [zenEnabled, zenLimitType, pausedUntil]);

  // Initialize the first post as seen when feed loads
  useEffect(() => {
    if (feedData.length > 0 && seenPosts.size === 0) {
      setSeenPosts(new Set([feedData[0].id]));
    }
  }, [feedData]);

  const fetchPosts = async (pageNum, reset = false, currentMood = selectedMood) => {
    if (loading) return;
    if (!reset && !hasMore) return;

    setloading(true);
    const moodQuery = currentMood !== 'All' ? `&mood=${currentMood}` : '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts?page=${pageNum}&limit=${limit}${moodQuery}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.length === 0) {
        sethasMore(false);
        if (reset) {
          setFeedData([]);
        }
      } else {
        setFeedData(prev => reset ? data : [...prev, ...data]);
        const initialLikes = {};
        const initialLikeCount = {};
        const initialSaved = {};
        data.forEach(post => {
          initialLikes[post.id] = post.liked || false;
          initialLikeCount[post.id] = post.likeCount;
          initialSaved[post.id] = post.saved || false;
        });
        setlikes(prev => reset ? initialLikes : ({ ...prev, ...initialLikes }));
        setlikecount(prev => reset ? initialLikeCount : ({ ...prev, ...initialLikeCount }));
        setsaved(prev => reset ? initialSaved : ({ ...prev, ...initialSaved }));
      }
    } catch (err) {
      console.error("Error fetching feeds:", err);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          const index = video.dataset.index;
          if (entry.isIntersecting) {
            video.play().catch(() => { });
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

  // Close comment box when clicking outside
  useEffect(() => {
    if (!viewcomment) return;
    const handleDocumentClick = () => {
      setviewcomment(false);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [viewcomment]);

  useEffect(() => {
    const scrollContainer = scrollcontainerref.current;

    const handleScroll = () => {
      const bottomReached =
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight - 100; // 100px before bottom
      setviewcomment(false)
      setselectedPost(null)
      setviewMore(false)

      // Track post views by scroll offset indexing (each post card is roughly 620px tall)
      const currentIndex = Math.floor(scrollContainer.scrollTop / 620);
      if (currentIndex >= 0 && currentIndex < feedData.length) {
        setSeenPosts(prev => {
          const next = new Set(prev);
          for (let i = 0; i <= currentIndex; i++) {
            if (feedData[i]) {
              next.add(feedData[i].id);
            }
          }
          return next;
        });
      }

      if (bottomReached && !loading && hasMore) {
        const nextPage = page + 1;
        setpage(nextPage);
        fetchPosts(nextPage, false, selectedMood);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [page, loading, hasMore, selectedMood, feedData]);

  useEffect(() => {
    fetchPosts(0, true, "All");
  }, []);

  const handleMoodChange = (newMood) => {
    setSelectedMood(newMood);
    setpage(0);
    sethasMore(true);
    fetchPosts(0, true, newMood);
  };

  const toggleMute = () => {
    const next = !globalMuted;
    setGlobalMuted(next);
    localStorage.setItem('globalMuted', String(next));
    // Apply instantly to every currently mounted video
    Object.values(videoRefs.current).forEach(v => { if (v) v.muted = next; });
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

  // Limit check helper
  const isLimitExceeded = () => {
    if (!zenEnabled) return false;
    if (Date.now() < pausedUntil) return false;

    if (zenLimitType === 'posts') {
      return seenPosts.size > zenLimitValue;
    } else if (zenLimitType === 'time') {
      return secondsSpent >= (zenLimitValue * 60);
    }
    return false;
  };

  // Mindful Blocker view
  if (isLimitExceeded()) {
    return (
      <div className="card p-5 text-center text-white bg-dark bg-opacity-75 border-secondary rounded shadow-lg m-auto"
        style={{ maxWidth: '480px', backdropFilter: 'blur(20px)', marginTop: '20%', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="mb-4 display-3" style={{ animation: 'breathing 3s ease-in-out infinite' }}>🌿</div>
        <h4 className="mb-3 fw-bold font-family-sans-serif">Zen Scroll Break</h4>
        <p className="text-secondary mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
          You've reached your configured Zen Limit of{" "}
          <strong>
            {zenLimitType === 'posts' ? `${zenLimitValue} posts` : `${zenLimitValue} minute(s)`}
          </strong>.
          Take a deep breath, stretch, and enjoy the physical world.
        </p>
        <div className="d-flex gap-3 justify-content-center">
          <button
            className="btn btn-outline-info px-4 py-2"
            onClick={() => setPausedUntil(Date.now() + 5 * 60 * 1000)} // Pause Zen Mode limit for 5 min
            style={{ fontSize: '13px', borderRadius: '20px' }}
          >
            Snooze (5m)
          </button>
          <button
            className="btn btn-danger px-4 py-2"
            onClick={() => setZenEnabled(false)}
            style={{ fontSize: '13px', borderRadius: '20px' }}
          >
            Turn Off Zen Mode
          </button>
        </div>

        <style>{`
          @keyframes breathing {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 0.6; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Mood Selector Row + Zen Mode Setting Trigger */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <div className="d-flex gap-2 overflow-auto scrollbar-none flex-grow-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {MOODS.map((moodObj) => (
            <button
              key={moodObj.value}
              className={`btn btn-sm px-3 py-2 rounded-pill text-white transition-all`}
              onClick={() => handleMoodChange(moodObj.value)}
              style={{
                whiteSpace: 'nowrap',
                background: selectedMood === moodObj.value ? 'linear-gradient(45deg, #007bff, #00d2ff)' : 'rgba(33, 37, 41, 0.6)',
                backdropFilter: 'blur(8px)',
                border: selectedMood === moodObj.value ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: '13px',
                fontWeight: '600',
                opacity: selectedMood === moodObj.value ? 1 : 0.8,
                transition: 'all 0.25s ease'
              }}
            >
              {moodObj.label}
            </button>
          ))}
        </div>

        {/* Zen button toggle */}
        <button
          className={`btn btn-sm px-3 py-2 rounded-pill text-white border-0`}
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: zenEnabled ? 'linear-gradient(45deg, #28a745, #20c997)' : 'rgba(108, 117, 125, 0.4)',
            fontSize: '13px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: zenEnabled ? '0 0 10px rgba(40, 167, 69, 0.3)' : 'none'
          }}
        >
          ⏱️ Zen Mode: {zenEnabled ? "On" : "Off"}
        </button>
      </div>

      {/* Zen Mode Settings Panel Collapse */}
      {showSettings && (
        <div className="card p-3 mb-4 bg-dark bg-opacity-75 border-secondary rounded text-white shadow-sm" style={{ backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <h6 className="fw-bold mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: '14px' }}>
            <span>⏱️ Zen Mode Settings</span>
            <button className="btn-close btn-close-white" onClick={() => setShowSettings(false)} aria-label="Close" style={{ fontSize: '10px' }}></button>
          </h6>

          <div className="d-flex flex-column gap-3">
            <div className="form-check form-switch d-flex align-items-center">
              <input
                className="form-check-input"
                type="checkbox"
                id="zenSwitch"
                checked={zenEnabled}
                onChange={(e) => {
                  setZenEnabled(e.target.checked);
                  setSeenPosts(new Set());
                  setSecondsSpent(0);
                }}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label ms-2" htmlFor="zenSwitch" style={{ fontSize: '13px', cursor: 'pointer' }}>Enable scrolling restrictions</label>
            </div>

            {zenEnabled && (
              <>
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <span className="text-secondary" style={{ fontSize: '13px' }}>Limit type:</span>
                  <div className="form-check form-check-inline m-0 d-flex align-items-center">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="limitType"
                      id="limitPosts"
                      value="posts"
                      checked={zenLimitType === 'posts'}
                      onChange={() => {
                        setZenLimitType('posts');
                        setSeenPosts(new Set());
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label ms-1" htmlFor="limitPosts" style={{ fontSize: '13px', cursor: 'pointer' }}>Posts read</label>
                  </div>
                  <div className="form-check form-check-inline m-0 d-flex align-items-center">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="limitType"
                      id="limitTime"
                      value="time"
                      checked={zenLimitType === 'time'}
                      onChange={() => {
                        setZenLimitType('time');
                        setSecondsSpent(0);
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <label className="form-check-label ms-1" htmlFor="limitTime" style={{ fontSize: '13px', cursor: 'pointer' }}>Time spent</label>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-center">
                  <span className="text-secondary" style={{ fontSize: '13px' }}>Limit boundary:</span>
                  <select
                    className="form-select form-select-sm bg-dark text-white border-secondary"
                    style={{ width: '130px', fontSize: '12px' }}
                    value={zenLimitValue}
                    onChange={(e) => {
                      setZenLimitValue(parseInt(e.target.value, 10));
                      setSeenPosts(new Set());
                      setSecondsSpent(0);
                    }}
                  >
                    {zenLimitType === 'posts' ? (
                      <>
                        <option value="5">5 posts</option>
                        <option value="10">10 posts</option>
                        <option value="20">20 posts</option>
                        <option value="50">50 posts</option>
                      </>
                    ) : (
                      <>
                        <option value="1">1 minute</option>
                        <option value="3">3 minutes</option>
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                      </>
                    )}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {feedData.map((feed, index) => (
        <div key={index} className="card mb-4 shadow-sm bg-black text-white position-relative border-0 w-100 mx-auto"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.1) !important" }}>
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
            <ProfileHeader user={feed.user} />
            <button className='btn text-white ms-auto'
              onClick={() => {
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
          ) : feed.mediaType === "canvas" ? (
            <div
              className="card-img-top d-flex justify-content-center align-items-center p-4 text-center text-white"
              style={{
                height: "380px",
                background: feed.imageUrl,
                borderRadius: '8px',
                fontSize: '22px',
                fontWeight: 'bold',
                textShadow: '0 2px 5px rgba(0,0,0,0.6)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.4'
              }}
            >
              "{feed.caption}"
            </div>
          ) : feed.mediaType === "video" ? (
            <div className="position-relative">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                data-index={index}
                className="card-img-top"
                muted={globalMuted}
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
                  e.stopPropagation();
                  toggleMute();
                }}
                className="btn btn-dark position-absolute"
                style={{ bottom: "20px", right: "10px", opacity: 0.8 }}
              >
                {globalMuted ? <FaVolumeMute /> : <FaVolumeUp />}
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

              <span style={{ cursor: 'pointer' }} onClick={(e) => {
                e.stopPropagation();
                setviewcomment(!viewcomment)
                setselectedPost(feed.id)
              }}>
                <FaRegComment size={22} />
              </span>

              <span
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setSharePost(feed);
                  setOpenShareModal(true);
                }}
              >
                <FaShare size={22} />
              </span>
            </div>

            {/* Right icon */}
            <Save id={feed.id} type={'post'} initialSaved={saved[feed.id]} />

          </div>

          <p className='ms-1 mt-2 mb-0'>{likecount[feed.id]} likes</p>
          {feed.mediaType !== "canvas" && (
            <div className="card-body">
              <p className="card-text">{feed.caption}</p>
            </div>
          )}
        </div>
      ))}
      {loading && <p className='text-white text-center py-3'>Loading more posts...</p>}
      {!hasMore && <p className='text-white text-center py-3' style={{ fontSize: '13px', opacity: 0.5 }}>No more posts</p>}

      {/* ── Comments Modal ── */}
      <CommentsModal
        isOpen={viewcomment}
        onClose={() => setviewcomment(false)}
        postId={selectedPost}
        postType="post"
      />

      {/* ── More Options Modal ── */}
      {viewMore && selectedPost && (
        <MorePopup
          id={selectedPost.id}
          token={token}
          type="posts"
          user={selectedPost.user}
          close={() => {
            setviewMore(false);
            setselectedPost(null);
          }}
        />
      )}

      {/* ── Share Post Modal ── */}
      <ShareModal
        isOpen={openShareModal}
        onClose={() => setOpenShareModal(false)}
        contentType="post"
        contentData={sharePost}
        onSend={handleSharePost}
      />
    </div>
  );
}

export default Feeds;
