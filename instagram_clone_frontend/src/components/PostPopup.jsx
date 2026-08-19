import React, { useRef, useState, useEffect } from 'react'
import ProfileHeader from './ProfileHeader'
import Like from './Like'
import Save from './Save'
import { FaRegComment, FaShare, FaVolumeMute, FaVolumeUp, FaTimes } from 'react-icons/fa'
import Comment from './Comment'
import ShareModal from './ShareModal'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

import DoubleTapLike from './DoubleTapLike'

const PostPopup = ({ feed, onclose, user }) => {
  // Global mute state — shared with Feeds & Reels via localStorage
  const [globalMuted, setGlobalMuted] = useState(() => localStorage.getItem('globalMuted') !== 'false')
  const videoref = useRef()

  // Safely normalize feed object props
  const normalizedType = (feed?.type || (feed?.videoUrl || (feed?.mediaUrl && String(feed.mediaUrl).includes('.mp4')) ? 'reel' : 'post')).toLowerCase();
  const normalizedMediaUrl = feed?.mediaUrl || feed?.imageUrl || feed?.videoUrl || '';
  const normalizedMediaType = feed?.mediaType || (normalizedType === 'reel' ? 'video' : 'image');
  const initialLikeCount = typeof feed?.likeCount === 'number' ? feed.likeCount : 0;
  const feedUser = feed?.user || {
    id: feed?.userId || 0,
    username: feed?.username || 'User',
    profilePicUrl: feed?.profilePicUrl || 'https://ui-avatars.com/api/?background=333&color=fff&name=U',
    fullName: feed?.fullName || ''
  };

  const [likeCount, setlikeCount] = useState(initialLikeCount)
  const [isLiked, setIsLiked] = useState(feed?.liked || false)
  const [isSaved, setIsSaved] = useState(feed?.saved || false)
  const [showFullCaption, setShowFullCaption] = useState(false)
  const navigate = useNavigate()
  const token = localStorage.getItem('token');

  const handleDoubleTap = async () => {
    if (!isLiked) {
      setIsLiked(true);
      setlikeCount(prev => prev + 1);
      try {
        const authHeaderValue = token && token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        await fetch(`${API_BASE_URL}/api/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: authHeaderValue },
          body: JSON.stringify({ id: feed.id, type: normalizedType })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Fetch live like status, like count, and save status upon popup mount
  useEffect(() => {
    if (!feed?.id || !token) return;
    const authHeaderValue = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    fetch(`${API_BASE_URL}/api/like/status?id=${feed.id}&type=${normalizedType}`, {
      headers: { Authorization: authHeaderValue }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (typeof data.likeCount === 'number') setlikeCount(data.likeCount);
          if (typeof data.liked === 'boolean') setIsLiked(data.liked);
        }
      })
      .catch(() => {});

    fetch(`${API_BASE_URL}/api/save/status?id=${feed.id}&type=${normalizedType}`, {
      headers: { Authorization: authHeaderValue }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.saved === 'boolean') setIsSaved(data.saved);
      })
      .catch(() => {});
  }, [feed?.id, normalizedType, token]);

  const navigateprofile = (id) => {
    onclose()
    if (id) {
      navigate(`/profile/${id}`)
    }
  }

  const toglemute = () => {
    const next = !globalMuted;
    setGlobalMuted(next);
    localStorage.setItem('globalMuted', String(next));
    if (videoref.current) videoref.current.muted = next;
  }

  const togglePlayPause = () => {
    if (videoref.current && videoref.current.paused) videoref.current.play();
    else if (videoref.current) videoref.current.pause();
  };

  const [openShareModal, setOpenShareModal] = useState(false);

  const handleSharePost = async (recipientId, msg) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipientId,
          content: msg && msg.trim() ? msg.trim() : `Shared a ${normalizedType}`,
          postId: normalizedType === 'post' ? feed.id : null,
          reelId: normalizedType === 'reel' ? feed.id : null
        })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const captionText = feed?.caption || ''
  const isCaptionLong = captionText.length > 100
  const displayCaption = showFullCaption ? captionText : captionText.slice(0, 100)

  return (
    <>
      {/* ── Backdrop ── */}
      <div className="pp-overlay" onClick={onclose} />

      {/* ── Sheet ── */}
      <div className="pp-sheet">

        {/* Mobile drag handle */}
        <div className="pp-drag-handle-wrapper">
          <div className="pp-drag-handle" />
        </div>

        {/* ─── MEDIA ─── */}
        <div className="pp-media-wrapper">
          <DoubleTapLike
            onDoubleTap={handleDoubleTap}
            onSingleTap={togglePlayPause}
            isLiked={isLiked}
            style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {normalizedMediaType === 'image' ? (
              <img src={normalizedMediaUrl} className="pp-media" alt="Post" />
            ) : normalizedMediaType === 'video' ? (
              <>
                <video
                  ref={videoref}
                  className="pp-media"
                  loop
                  autoPlay
                  muted={globalMuted}
                >
                  <source src={normalizedMediaUrl} type="video/mp4" />
                </video>
                <button
                  className="pp-mute-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    toglemute();
                  }}
                >
                  {globalMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                </button>
              </>
            ) : null}
          </DoubleTapLike>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="pp-right-panel">

        {/* ─── HEADER ─── */}
        <div className="pp-header">
          <div className="pp-header-user" onClick={() => navigateprofile(feedUser.id)}>
            <div className="pp-avatar-ring">
              <img
                src={feedUser.profilePicUrl || 'https://ui-avatars.com/api/?background=333&color=fff&name=U'}
                className="pp-avatar"
                alt={feedUser.username || ''}
              />
            </div>
            <div className="pp-user-info">
              <span className="pp-username">{feedUser.username || 'User'}</span>
              {feedUser.fullName && (
                <span className="pp-fullname">{feedUser.fullName}</span>
              )}
            </div>
          </div>
          <div className="pp-header-actions">
            <ProfileHeader user={user || feedUser} />
            <button className="pp-icon-btn pp-close-btn" onClick={onclose}>
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* ─── ACTION BAR ─── */}
        <div className="pp-action-bar">
          <div className="pp-actions-left">
            <Like
              key={`like-${feed.id}-${isLiked}`}
              id={feed.id}
              type={normalizedType}
              initialLiked={isLiked}
              initialCount={likeCount}
              onLikeToggle={(newLike) => {
                setIsLiked(newLike);
                setlikeCount(newLike ? likeCount + 1 : likeCount - 1);
              }}
            />
            <button className="pp-icon-btn pp-action-icon">
              <FaRegComment size={22} />
            </button>
            <button className="pp-icon-btn pp-action-icon" onClick={() => setOpenShareModal(true)}>
              <FaShare size={20} />
            </button>
          </div>
          <div className="pp-actions-right">
            <Save
              key={`save-${feed.id}-${isSaved}`}
              id={feed.id}
              type={normalizedType}
              initialSaved={isSaved}
            />
          </div>
        </div>

        {/* ─── LIKE COUNT ─── */}
        <div className="pp-like-count">
          <span>{likeCount?.toLocaleString()}</span> likes
        </div>

        {/* ─── CAPTION ─── */}
        {captionText && (
          <div className="pp-caption">
            <span className="pp-caption-username" onClick={() => navigateprofile(feedUser.id)}>
              {feedUser.username}
            </span>{' '}
            <span className="pp-caption-text">
              {displayCaption}
              {isCaptionLong && !showFullCaption && (
                <>
                  {'... '}
                  <button className="pp-more-btn" onClick={() => setShowFullCaption(true)}>
                    more
                  </button>
                </>
              )}
            </span>
          </div>
        )}

        {/* ─── DIVIDER ─── */}
        <div className="pp-divider" />

        {/* ─── COMMENTS ─── */}
        <div className="pp-comments-wrapper">
          <Comment id={feed.id} type={normalizedType} onclose={() => onclose()} />
        </div>{/* end pp-comments-wrapper */}
        </div>{/* end pp-right-panel */}
      </div>{/* end pp-sheet */}

      <ShareModal
        isOpen={openShareModal}
        onClose={() => setOpenShareModal(false)}
        contentType={normalizedType}
        contentData={{ ...feed, mediaUrl: normalizedMediaUrl, imageUrl: normalizedMediaUrl }}
        onSend={handleSharePost}
      />
    </>
  )
}

export default PostPopup