import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import SideComponent from '../components/SideComponent';
import PostPopup from '../components/PostPopup';
import { API_BASE_URL } from '../config';
import {
  FaTimes,
  FaHeart,
  FaComment,
  FaAt,
  FaUserPlus,
  FaUserCheck,
  FaCheck,
  FaTrashAlt,
  FaBell,
  FaCheckDouble,
  FaFilm,
  FaRegImage,
  FaHistory
} from 'react-icons/fa';

// Helper component to render media thumbnail image or default fallback icon
const NotifMediaThumbnail = ({ notif, size = 42 }) => {
  const [imgError, setImgError] = useState(false);

  const mediaUrl = notif?.post?.imageUrl || notif?.post?.posturl || notif?.post?.mediaUrl
    || notif?.reel?.videoUrl || notif?.reel?.reelurl || notif?.reel?.mediaUrl
    || notif?.story?.mediaUrl;

  const isReel = !!notif?.reel || notif?.post?.mediaType === 'video';
  const isStory = !!notif?.story || notif?.type === 'STORY_LIKE';
  const isPost = !!notif?.post;

  if (!isPost && !isReel && !isStory) return null;

  if (mediaUrl && !imgError) {
    return (
      <img
        src={mediaUrl}
        alt="Thumbnail"
        className="rounded-2 flex-shrink-0"
        style={{ width: size, height: size, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Default fallback icon when image is not present or failed to load
  return (
    <div
      className="rounded-2 d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: isReel
          ? 'linear-gradient(135deg, rgba(224,93,93,0.25), rgba(192,57,43,0.35))'
          : isStory
            ? 'linear-gradient(135deg, rgba(255,193,7,0.25), rgba(253,126,20,0.35))'
            : 'linear-gradient(135deg, rgba(13,110,253,0.25), rgba(0,86,179,0.35))',
        border: '1px solid rgba(255,255,255,0.18)',
        color: '#fff'
      }}
      title={isReel ? 'Reel' : isStory ? 'Story' : 'Post'}
    >
      {isReel ? <FaFilm size={Math.round(size * 0.45)} /> : isStory ? <FaHistory size={Math.round(size * 0.45)} /> : <FaRegImage size={Math.round(size * 0.45)} />}
    </div>
  );
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const { markAllReadLocally } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [selectedPostFeed, setSelectedPostFeed] = useState(null);
  const [handledRequests, setHandledRequests] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // ── auth guard ──
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // ── fetch notifications ──
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${API_BASE_URL}/api/user/allnotifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setNotifications(data);
      }
    } catch (_) { }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Auto mark all as read when page opens ──
  useEffect(() => {
    const autoMarkRead = async () => {
      if (!token) return;
      try {
        const resp = await fetch(`${API_BASE_URL}/api/user/notifications/read-all`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          // Reset badge in sidebar
          markAllReadLocally();
          // Mark all locally so unread indicator disappears
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }
      } catch (_) { }
    };
    // Slight delay so notifications load first
    const timer = setTimeout(autoMarkRead, 800);
    return () => clearTimeout(timer);
  }, [token, markAllReadLocally]);

  // ── mark all as read ──
  const markAllAsRead = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (_) { }
  };

  // ── confirm / delete follow request ──
  const confirmRequest = async (isConfirm, notifId, requestId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: requestId || notifId, isConfirm }),
      });
      if (resp.ok) {
        setHandledRequests((prev) => ({ ...prev, [notifId]: true }));
      }
    } catch (_) { }
  };

  // ── helpers ──
  const avatar = (url) =>
    url || 'https://ui-avatars.com/api/?background=333&color=fff&name=U';

  const formatTime = (iso) => {
    if (!iso) return 'Just now';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getNotifText = (n) => {
    switch (n.type) {
      case 'LIKE':
        return n.reel ? 'liked your reel' : 'liked your post';
      case 'STORY_LIKE':
        return 'liked your story';
      case 'COMMENT':
        return `commented: "${n.text || ''}"`;
      case 'MENTION':
        return `mentioned you: "${n.text || ''}"`;
      case 'FOLLOW':
        return 'started following you';
      case 'FOLLOW_REQUEST':
        return 'wants to follow you';
      default:
        return 'interacted with your profile';
    }
  };

  const getBadgeIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return { icon: <FaHeart size={10} color="#fff" />, bg: 'linear-gradient(135deg, #ff4d4d, #dc3545)' };
      case 'STORY_LIKE':
        return { icon: <FaHeart size={10} color="#fff" />, bg: 'linear-gradient(135deg, #d63384, #fd7e14)' };
      case 'COMMENT':
        return { icon: <FaComment size={10} color="#fff" />, bg: 'linear-gradient(135deg, #0d6efd, #0056b3)' };
      case 'MENTION':
        return { icon: <FaAt size={10} color="#fff" />, bg: 'linear-gradient(135deg, #ffc107, #fd7e14)' };
      case 'FOLLOW':
        return { icon: <FaUserCheck size={10} color="#fff" />, bg: 'linear-gradient(135deg, #198754, #146c43)' };
      case 'FOLLOW_REQUEST':
        return { icon: <FaUserPlus size={10} color="#fff" />, bg: 'linear-gradient(135deg, #fd7e14, #d63384)' };
      default:
        return { icon: <FaBell size={10} color="#fff" />, bg: '#6c757d' };
    }
  };

  // Convert post/reel inside notification into PostPopup feed object format
  const getPopupFeed = (notif) => {
    if (!notif) return null;
    if (notif.post) {
      const url = notif.post.imageUrl || notif.post.posturl || notif.post.mediaUrl || null;
      const isVid = notif.post.mediaType === 'video' || (url && (url.includes('/video/upload/') || url.endsWith('.mp4')));
      return {
        id: notif.post.id,
        type: 'post',
        mediaUrl: url,
        mediaType: isVid ? 'video' : 'image',
        caption: notif.post.caption || '',
        likeCount: typeof notif.post.likeCount === 'number' ? notif.post.likeCount : (notif.post.likes ? notif.post.likes.length : 0),
        liked: notif.post.liked || false,
        saved: notif.post.saved || false,
        user: notif.post.user || notif.actor || notif.recipient,
      };
    }
    if (notif.reel) {
      const url = notif.reel.videoUrl || notif.reel.reelurl || notif.reel.mediaUrl || null;
      return {
        id: notif.reel.id,
        type: 'reel',
        mediaUrl: url,
        mediaType: 'video',
        caption: notif.reel.caption || '',
        likeCount: typeof notif.reel.likeCount === 'number' ? notif.reel.likeCount : (notif.reel.likes ? notif.reel.likes.length : 0),
        liked: notif.reel.liked || false,
        saved: notif.reel.saved || false,
        user: notif.reel.user || notif.actor || notif.recipient,
      };
    }
    return null;
  };

  const handleDpClick = (e, userId) => {
    e.stopPropagation();
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const handleNotifDivClick = (notif) => {
    const feedObj = getPopupFeed(notif);
    if (feedObj) {
      setSelectedPostFeed(feedObj);
    } else {
      const userObj = notif.actor || notif.requester;
      if (userObj?.id) {
        navigate(`/profile/${userObj.id}`);
      }
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'likes') return n.type === 'LIKE' || n.type === 'STORY_LIKE';
    if (filter === 'comments') return n.type === 'COMMENT' || n.type === 'MENTION';
    if (filter === 'follows') return n.type === 'FOLLOW' || n.type === 'FOLLOW_REQUEST';
    return true;
  });

  return (
    <div className="d-flex" style={{ height: '100vh', background: '#0a0a0a' }}>
      <SideComponent />

      {/* ── Main Notifications Panel (Centered Full-Width Container) ── */}
      <div
        className="d-flex flex-column flex-grow-1 mx-auto"
        style={{
          maxWidth: '680px',
          width: '100%',
          background: '#0d0d0d',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="p-3 border-bottom border-secondary border-opacity-25 bg-black bg-opacity-40">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div>
              <h5
                className="mb-0 fw-bold text-white fs-5"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Notifications
              </h5>
              <small className="text-secondary">Activity & requests</small>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 py-1.5 px-3 rounded-3 text-white-50 border-secondary"
                onClick={markAllAsRead}
                title="Mark all as read"
                style={{ fontSize: '12px' }}
              >
                <FaCheckDouble size={13} /> Mark Read
              </button>
              <button
                className="btn btn-link text-white-50 p-0 d-flex align-items-center justify-content-center border-0 text-decoration-none"
                onClick={() => navigate('/home')}
                style={{
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  width: '34px',
                  height: '34px',
                }}
                title="Close Notifications"
              >
                <FaTimes size={15} className="text-white" />
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="d-flex gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'likes', label: 'Likes' },
              { key: 'comments', label: 'Comments' },
              { key: 'follows', label: 'Follows' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="border-0 px-3.5 py-1.5 rounded-pill"
                style={{
                  fontSize: '12.5px',
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  background:
                    filter === f.key
                      ? 'linear-gradient(135deg, #e05d5d, #c0392b)'
                      : 'rgba(255,255,255,0.08)',
                  color: filter === f.key ? '#fff' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: filter === f.key ? '0 2px 12px rgba(224,93,93,0.3)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <div
          className="flex-grow-1 overflow-auto p-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="spinner-border text-secondary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center text-muted py-5 px-3" style={{ fontSize: 13 }}>
              <div style={{ fontSize: 48, opacity: 0.35 }}>
                <FaBell />
              </div>
              <p className="mt-3 mb-1 text-white-50 fw-medium fs-6">
                No notifications found
              </p>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.25)' }}>
                When people like, comment, mention or follow you, you'll see it here
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const userObj = notif.actor || notif.requester || {};
              const badge = getBadgeIcon(notif.type);

              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifDivClick(notif)}
                  className="w-100 d-flex align-items-center justify-content-between gap-3 px-3 py-3 rounded-3 mb-1 border-0 text-start position-relative transition-all"
                  style={{
                    background: notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(224,93,93,0.07)',
                    color: 'white',
                    cursor: 'pointer',
                    borderLeft: !notif.isRead ? '3px solid #ff4d4d' : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.isRead ? 'rgba(255,255,255,0.02)' : 'rgba(224,93,93,0.07)';
                  }}
                >
                  <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ minWidth: 0 }}>
                    {/* DP / Avatar with type badge (Clicking DP goes to user profile) */}
                    <div
                      className="position-relative"
                      style={{ flexShrink: 0, cursor: 'pointer' }}
                      onClick={(e) => handleDpClick(e, userObj.id)}
                      title={`View ${userObj.username}'s profile`}
                    >
                      <img
                        src={avatar(userObj.profilePicUrl)}
                        className="rounded-circle"
                        alt={userObj.username}
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          border: '2px solid rgba(255,255,255,0.12)',
                        }}
                      />
                      <span
                        className="position-absolute d-flex align-items-center justify-content-center"
                        style={{
                          bottom: -2,
                          right: -2,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: badge.bg,
                          border: '2px solid #111',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                        }}
                      >
                        {badge.icon}
                      </span>
                    </div>

                    {/* Info text */}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="d-flex justify-content-between align-items-center mb-0.5">
                        <span
                          className="fw-semibold text-truncate text-white"
                          style={{ fontSize: 14, maxWidth: '240px', cursor: 'pointer' }}
                          onClick={(e) => handleDpClick(e, userObj.id)}
                        >
                          {userObj.username || 'User'}
                        </span>
                        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)' }}>
                          {formatTime(notif.createdAt)}
                        </span>
                      </div>
                      <div
                        className="text-white-50"
                        style={{
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {getNotifText(notif)}
                      </div>
                    </div>
                  </div>

                  {/* Inline Follow Request Action Buttons */}
                  {notif.type === 'FOLLOW_REQUEST' ? (
                    <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {handledRequests[notif.id] ? (
                        <span className="badge bg-success bg-opacity-25 text-success small py-1.5 px-2.5 rounded-pill fw-semibold">
                          <FaCheck size={11} className="me-1" /> Handled
                        </span>
                      ) : (
                        <>
                          <button
                            className="btn btn-sm text-white py-1 px-3 rounded-3 fw-semibold"
                            style={{ fontSize: '12.5px', background: '#0095f6', border: 'none' }}
                            onClick={() => confirmRequest(true, notif.id)}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary py-1 px-2.5 rounded-3 text-white-50 border-secondary"
                            style={{ fontSize: '12.5px' }}
                            onClick={() => confirmRequest(false, notif.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Media Thumbnail with Default Fallback Icon */
                    <NotifMediaThumbnail notif={notif} size={42} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Post / Reel Popup Modal ── */}
      {selectedPostFeed && (
        <PostPopup
          feed={selectedPostFeed}
          onclose={() => setSelectedPostFeed(null)}
        />
      )}

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { background: #0a0a0a !important; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
