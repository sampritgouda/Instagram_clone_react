import React, { useEffect, useState, useRef } from 'react';
import { FaEye, FaChevronLeft, FaChevronRight, FaTimes, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DeleteButton from './DeleteButton';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';

function Stories() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [usersStories, setUsersStories] = useState([]);
  const [storyviewcount, setstoryviewcount] = useState({});
  const [currentUserIndex, setCurrentUserIndex] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(null);
  const [storySeen, setStorySeen] = useState({});
  const [likedStories, setLikedStories] = useState({});
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef(null);
  const token = localStorage.getItem("token");

  const likeStory = async (e, storyId) => {
    e.stopPropagation();
    try {
      const isAlreadyLiked = likedStories[storyId];
      setLikedStories((prev) => ({ ...prev, [storyId]: !isAlreadyLiked }));

      const authHeader = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';

      await fetch(`${API_BASE_URL}/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const navigateUserProfile = (id) => {
    closeStory();
    navigate(`/profile/${id}`);
  };

  const opencreateStory = () => navigate('/create/story');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stories`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setUsersStories(data);

        const initialViewCount = {};
        const initialSeen = {};
        data.forEach(user => {
          if (user && user.stories) {
            user.stories.forEach(story => {
              if (story) {
                initialViewCount[story.id] = story.seenCount;
                initialSeen[story.id] = story.seen;
              }
            });
          }
        });

        setstoryviewcount(initialViewCount);
        setStorySeen(initialSeen);
      })
      .catch(err => console.error("Error fetching stories:", err));
  }, [token]);

  // ── PAUSE BACKGROUND MEDIA WHEN STORY OPENS ───────────────────────────
  useEffect(() => {
    if (currentUserIndex !== null && currentStoryIndex !== null) {
      setProgress(0);

      // Pause all background HTML5 videos and audio on the page
      const mediaElements = document.querySelectorAll('video, audio');
      mediaElements.forEach(media => {
        if (!media.classList.contains('story-viewer-video')) {
          try {
            media.pause();
          } catch (e) {}
        }
      });
    }
  }, [currentUserIndex, currentStoryIndex]);

  // ── AUTO-ADVANCE TIMER FOR STORIES ─────────────────────────────────────
  useEffect(() => {
    if (currentUserIndex === null || currentStoryIndex === null || isPaused) return;

    const currentUser = usersStories[currentUserIndex];
    if (!currentUser || !currentUser.stories || !currentUser.stories[currentStoryIndex]) return;

    const currentStory = currentUser.stories[currentStoryIndex];
    
    // For videos, timer progress will follow video duration or ended event
    if (currentStory.mediaType === "video") return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + 2.5; // ~4 seconds for image
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentUserIndex, currentStoryIndex, isPaused, usersStories]);

  const markStoryAsSeen = (userIndex, storyIndex) => {
    if (!usersStories[userIndex] || !usersStories[userIndex].stories[storyIndex]) return;
    const storyId = usersStories[userIndex].stories[storyIndex].id;

    if (storySeen[storyId]) return;

    fetch(`${API_BASE_URL}/api/stories/${storyId}/seen`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to mark story as seen");

        setstoryviewcount(prev => ({
          ...prev,
          [storyId]: (prev[storyId] || 0) + 1
        }));

        setStorySeen(prev => ({
          ...prev,
          [storyId]: true
        }));
      })
      .catch(err => console.error(err));
  };

  const openStory = (userIdx) => {
    setCurrentUserIndex(userIdx);
    setCurrentStoryIndex(0);
    setProgress(0);
  };

  const closeStory = () => {
    setCurrentUserIndex(null);
    setCurrentStoryIndex(null);
    setProgress(0);
    setIsPaused(false);
  };

  const nextStory = () => {
    if (currentUserIndex === null || currentStoryIndex === null) return;

    const userStories = usersStories[currentUserIndex].stories;
    if (currentStoryIndex + 1 < userStories.length) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else if (currentUserIndex + 1 < usersStories.length) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (currentUserIndex === null || currentStoryIndex === null) return;

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    } else if (currentUserIndex > 0) {
      const prevUserStories = usersStories[currentUserIndex - 1].stories;
      setCurrentUserIndex(currentUserIndex - 1);
      setCurrentStoryIndex(prevUserStories.length - 1);
      setProgress(0);
    }
  };

  const handleMediaClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    if (clickX < width * 0.35) {
      prevStory();
    } else {
      nextStory();
    }
  };

  const currentUser = currentUserIndex !== null ? usersStories[currentUserIndex] : null;
  const currentStory = currentUser && currentStoryIndex !== null ? currentUser.stories[currentStoryIndex] : null;

  return (
    <div>
      {/* ── STORIES HORIZONTAL ROW ── */}
      <div className="d-flex overflow-auto py-2 mb-3 mt-2 no-scrollbar">
        {usersStories.map((user, idx) => {
          if (user === null) {
            return (
              <div
                key={"add-story"}
                className="position-relative d-flex flex-column align-items-center me-3 story-bubble"
                style={{ cursor: "pointer", width: 76, flexShrink: 0 }}
                onClick={() => opencreateStory()}
                title="Add Story"
              >
                <div
                  className="rounded-circle bg-dark d-flex justify-content-center align-items-center border border-primary border-2 shadow-sm"
                  style={{
                    width: 70,
                    height: 70,
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 28, color: "#0095f6", fontWeight: "300" }}>+</span>
                </div>
                <span
                  className="text-white mt-1 text-truncate d-block text-center"
                  style={{ width: 72, fontSize: "11.5px", fontWeight: "500" }}
                >
                  Your Story
                </span>
              </div>
            );
          }

          return (
            <div
              key={user.userId}
              className="position-relative d-flex flex-column align-items-center me-3 story-bubble"
              style={{ cursor: "pointer", width: 76, flexShrink: 0 }}
              onClick={() => openStory(idx)}
              title={`${user.username} ${user.hasUnseen ? "(New)" : ""}`}
            >
              <div 
                className="d-flex justify-content-center align-items-center p-0.5 rounded-circle"
                style={{
                  background: user.hasUnseen 
                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' 
                    : 'rgba(255,255,255,0.2)',
                  height: 74,
                  width: 74,
                }}
              >
                <img
                  src={user.profileImage || 'https://res.cloudinary.com/dr0yboilf/image/upload/v1754637397/i721vyva5s2broewwwss.jpg'}
                  alt={user.username}
                  className="rounded-circle border border-2 border-black"
                  style={{
                    width: 68,
                    height: 68,
                    objectFit: "cover",
                  }}
                />
              </div>
              <span
                className="text-white mt-1 text-truncate d-block text-center"
                style={{ width: 72, fontSize: "11.5px", fontWeight: "500" }}
              >
                {user.username}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── STORY VIEWER MODAL (INSTAGRAM-STYLE FULL/DESKTOP MODAL) ── */}
      {currentUser && currentStory && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            zIndex: 10500,
            backdropFilter: "blur(8px)"
          }}
          onClick={closeStory}
        >
          {/* Desktop Left Nav Button */}
          <button 
            className="btn btn-dark text-white rounded-circle p-0 me-4 shadow d-none d-md-flex align-items-center justify-content-center border border-secondary"
            onClick={(e) => { e.stopPropagation(); prevStory(); }}
            disabled={currentUserIndex === 0 && currentStoryIndex === 0}
            style={{ width: '48px', height: '48px', opacity: (currentUserIndex === 0 && currentStoryIndex === 0) ? 0.3 : 0.9 }}
          >
            <FaChevronLeft size={20} />
          </button>

          {/* Main Story Container (9:16 aspect ratio on Desktop, Full height on Mobile) */}
          <div
            className="position-relative bg-black rounded-0 rounded-md-4 overflow-hidden shadow-lg d-flex flex-column"
            style={{
              width: "100%",
              maxWidth: "420px",
              height: "100vh",
              maxHeight: "860px",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* ── TOP PROGRESS SEGMENTS & USER HEADER ── */}
            <div 
              className="position-absolute top-0 start-0 w-100 p-3 d-flex flex-column gap-2"
              style={{
                zIndex: 10,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)"
              }}
            >
              {/* Segmented Progress Bar */}
              <div className="d-flex gap-1.5 w-100">
                {currentUser.stories.map((storyItem, idx) => {
                  let barWidth = "0%";
                  if (idx < currentStoryIndex) barWidth = "100%";
                  else if (idx === currentStoryIndex) barWidth = `${progress}%`;

                  return (
                    <div 
                      key={storyItem.id || idx} 
                      className="flex-grow-1 bg-white bg-opacity-25 rounded-pill overflow-hidden" 
                      style={{ height: '3px' }}
                    >
                      <div 
                        className="bg-white h-100" 
                        style={{ 
                          width: barWidth,
                          transition: idx === currentStoryIndex ? "width 0.1s linear" : "none"
                        }} 
                      />
                    </div>
                  );
                })}
              </div>

              {/* User Header Details */}
              <div className="d-flex align-items-center justify-content-between mt-1">
                <div 
                  className="d-flex align-items-center gap-2.5"
                  style={{ cursor: "pointer" }}
                  onClick={() => navigateUserProfile(currentUser.userId)}
                >
                  <img 
                    src={currentUser.profileImage || 'https://res.cloudinary.com/dr0yboilf/image/upload/v1754637397/i721vyva5s2broewwwss.jpg'} 
                    alt={currentUser.username}
                    className="rounded-circle border border-white border-opacity-25"
                    style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                  />
                  <div>
                    <span className="text-white fw-bold fs-6 me-2">{currentUser.username}</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                  {/* Views Count */}
                  <div className="d-flex align-items-center gap-1.5 bg-black bg-opacity-40 px-2 py-1 rounded-pill border border-white border-opacity-10">
                    <FaEye color="white" size={13} />
                    <span className="text-white small" style={{ fontSize: "12px" }}>
                      {storyviewcount[currentStory.id] || 0}
                    </span>
                  </div>

                  {/* Delete Button for own story */}
                  {currentUser.own && (
                    <DeleteButton
                      id={currentStory.id}
                      type="stories"
                      token={token}
                      onDelete={() => {
                        setUsersStories(prev => {
                          const updated = [...prev];
                          if (updated[currentUserIndex]) {
                            updated[currentUserIndex].stories = updated[currentUserIndex].stories.filter(
                              s => s.id !== currentStory.id
                            );
                          }
                          return updated;
                        });
                        closeStory();
                      }}
                    />
                  )}

                  {/* Close Modal Cross */}
                  <button 
                    className="btn btn-sm p-1 text-white border-0 bg-transparent"
                    onClick={closeStory}
                    aria-label="Close"
                  >
                    <FaTimes size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── MEDIA CONTENT AREA (TAP LEFT/RIGHT TO NAVIGATE) ── */}
            <div 
              className="w-100 h-100 d-flex align-items-center justify-content-center bg-black position-relative"
              onClick={handleMediaClick}
              style={{ cursor: "pointer" }}
            >
              {currentStory.mediaType === "image" ? (
                <img
                  src={currentStory.mediaUrl}
                  alt="Story Content"
                  className="w-100 h-100"
                  style={{ objectFit: "contain" }}
                  onLoad={() => {
                    markStoryAsSeen(currentUserIndex, currentStoryIndex);
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={currentStory.mediaUrl}
                  className="w-100 h-100 story-viewer-video"
                  autoPlay
                  playsInline
                  style={{ objectFit: "contain" }}
                  onLoadedData={() => {
                    markStoryAsSeen(currentUserIndex, currentStoryIndex);
                  }}
                  onTimeUpdate={() => {
                    if (videoRef.current && videoRef.current.duration) {
                      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                      setProgress(currentProgress);
                    }
                  }}
                  onEnded={() => {
                    nextStory();
                  }}
                />
              )}
            </div>

            {/* ── BOTTOM OVERLAY: LIKE STORY BUTTON & INPUT ── */}
            <div
              className="position-absolute bottom-0 start-0 w-100 p-3 d-flex align-items-center justify-content-between gap-3"
              style={{
                zIndex: 20,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)'
              }}
            >
              <div className="flex-grow-1 border border-white border-opacity-25 rounded-pill px-3 py-2 text-white-50 small" style={{ fontSize: '13px' }}>
                Send message...
              </div>
              <button
                className="btn text-white p-1 border-0 bg-transparent transition-all d-flex align-items-center justify-content-center"
                onClick={(e) => likeStory(e, currentStory.id)}
                title="Like Story"
                style={{ cursor: 'pointer' }}
              >
                <FaHeart size={26} color={likedStories[currentStory.id] ? '#ff4d4d' : '#ffffff'} />
              </button>
            </div>
          </div>

          {/* Desktop Right Nav Button */}
          <button 
            className="btn btn-dark text-white rounded-circle p-0 ms-4 shadow d-none d-md-flex align-items-center justify-content-center border border-secondary"
            onClick={(e) => { e.stopPropagation(); nextStory(); }}
            style={{ width: '48px', height: '48px', opacity: 0.9 }}
          >
            <FaChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default Stories;
