import React, { useRef, useState } from 'react'
import ProfileHeader from './ProfileHeader'
import Like from './Like'
import Save from './Save'
import { FaRegComment, FaShare, FaVolumeMute, FaVolumeUp, FaTimes } from 'react-icons/fa'
import Comment from './Comment'
import ShareModal from './ShareModal'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

const PostPopup = ({ feed, onclose, user }) => {
  // Global mute state — shared with Feeds & Reels via localStorage
  const [globalMuted, setGlobalMuted] = useState(() => localStorage.getItem('globalMuted') !== 'false')
  const videoref = useRef()
  const [likeCount, setlikeCount] = useState(feed.likeCount)
  const [showFullCaption, setShowFullCaption] = useState(false)
  console.log(feed)
  const navigate = useNavigate()

  const navigateprofile = (id) => {
    onclose()
    navigate(`/profile/${id}`)
  }

  const toglemute = () => {
    const next = !globalMuted;
    setGlobalMuted(next);
    localStorage.setItem('globalMuted', String(next));
    if (videoref.current) videoref.current.muted = next;
  }

  const togglePlayPause = () => {
    if (videoref.current.paused) videoref.current.play();
    else videoref.current.pause();
  };

  const [openShareModal, setOpenShareModal] = useState(false);
  const token = localStorage.getItem('token');

  const handleSharePost = async (recipientId, msg) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          recipientId,
          content: msg && msg.trim() ? msg.trim() : 'Shared a post',
          postId: feed.id
        })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const captionText = feed.caption || ''
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
          {feed.mediaType === 'image' ? (
            <img src={feed.mediaUrl} className="pp-media" alt="Post" />
          ) : feed.mediaType === 'video' ? (
            <>
              <video
                ref={videoref}
                className="pp-media"
                onClick={togglePlayPause}
                loop
                autoPlay
                muted={globalMuted}
              >
                <source src={feed.mediaUrl} type="video/mp4" />
              </video>
              <button className="pp-mute-btn" onClick={toglemute}>
                {globalMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
              </button>
            </>
          ) : null}
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="pp-right-panel">

        {/* ─── HEADER ─── */}
        <div className="pp-header">
          <div className="pp-header-user" onClick={() => navigateprofile(feed.user.id)}>
            <div className="pp-avatar-ring">
              <img
                src={feed.user.profilePicUrl}
                className="pp-avatar"
                alt={feed.user.username}
              />
            </div>
            <div className="pp-user-info">
              <span className="pp-username">{feed.user.username}</span>
              {feed.user.fullName && (
                <span className="pp-fullname">{feed.user.fullName}</span>
              )}
            </div>
          </div>
          <div className="pp-header-actions">
            <ProfileHeader user={user} />
            <button className="pp-icon-btn pp-close-btn" onClick={onclose}>
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* ─── ACTION BAR ─── */}
        <div className="pp-action-bar">
          <div className="pp-actions-left">
            <Like
              id={feed.id}
              type={feed.type}
              initialLiked={feed.liked}
              initialCount={feed.likeCount}
              onLikeToggle={(newLike) => setlikeCount(newLike ? likeCount + 1 : likeCount - 1)}
            />
            <button className="pp-icon-btn pp-action-icon">
              <FaRegComment size={22} />
            </button>
            <button className="pp-icon-btn pp-action-icon" onClick={() => setOpenShareModal(true)}>
              <FaShare size={20} />
            </button>
          </div>
          <div className="pp-actions-right">
            <Save id={feed.id} type={feed.type} initialSaved={feed.saved} />
          </div>
        </div>

        {/* ─── LIKE COUNT ─── */}
        <div className="pp-like-count">
          <span>{likeCount?.toLocaleString()}</span> likes
        </div>

        {/* ─── CAPTION ─── */}
        {captionText && (
          <div className="pp-caption">
            <span className="pp-caption-username" onClick={() => navigateprofile(feed.user.id)}>
              {feed.user.username}
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
          <Comment id={feed.id} type={feed.type} onclose={() => onclose()} />
        </div>{/* end pp-comments-wrapper */}
        </div>{/* end pp-right-panel */}
      </div>{/* end pp-sheet */}

      <ShareModal
        isOpen={openShareModal}
        onClose={() => setOpenShareModal(false)}
        contentType="post"
        contentData={{ ...feed, imageUrl: feed.mediaUrl }}
        onSend={handleSharePost}
      />
    </>
  )
}

export default PostPopup