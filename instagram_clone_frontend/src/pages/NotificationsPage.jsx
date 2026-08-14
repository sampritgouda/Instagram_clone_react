import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SideComponent from '../components/SideComponent';
import { API_BASE_URL } from '../config';
import { FaTimes, FaHeart, FaUserPlus, FaCheck, FaTrashAlt, FaBell } from 'react-icons/fa';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [notifications, setNotifications] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [isRequested, setIsRequested] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'handled'

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
        const initReq = {};
        data.forEach((req) => {
          initReq[req.id] = true;
        });
        setIsRequested(initReq);
      }
    } catch (_) {}
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── confirm / delete request ──
  const confirmRequest = async (isConfirm, id) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/user/confirm`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isConfirm }),
      });
      if (resp.ok) {
        setIsRequested((prev) => ({ ...prev, [id]: false }));
      }
    } catch (_) {}
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

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'pending') return isRequested[n.id];
    if (filter === 'handled') return !isRequested[n.id];
    return true;
  });

  // ── render ──
  return (
    <div className="d-flex" style={{ height: '100vh', background: '#0a0a0a' }}>
      <SideComponent />

      {/* ── Main Notifications Panel ── */}
      <div
        className="d-flex flex-grow-1"
        style={{
          marginLeft: '0',
          background: 'linear-gradient(135deg, #0d0d0d 0%, #111 100%)',
          overflow: 'hidden',
        }}
      >
        {/* ── Left: Notification List ── */}
        <div
          className={`d-flex flex-column border-end border-secondary ${selectedNotif ? 'd-none d-md-flex' : 'd-flex'}`}
          style={{ width: '380px', minWidth: '300px', maxWidth: '100%', background: '#111' }}
        >
          {/* Header */}
          <div className="p-3 border-bottom border-secondary">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5
                  className="mb-0 fw-bold text-white"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Notifications
                </h5>
                <small className="text-muted">Follow requests & activity</small>
              </div>
              <button
                className="btn btn-link text-white-50 p-0 d-flex align-items-center justify-content-center border-0 text-decoration-none"
                onClick={() => navigate('/home')}
                style={{
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  width: '32px',
                  height: '32px',
                }}
                title="Close Notifications"
              >
                <FaTimes size={14} className="text-white" />
              </button>
            </div>

            {/* Filter pills */}
            <div className="d-flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'pending', label: 'Pending' },
                { key: 'handled', label: 'Handled' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="border-0 px-3 py-1 rounded-pill"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.3px',
                    background:
                      filter === f.key
                        ? 'linear-gradient(135deg, #e05d5d, #c0392b)'
                        : 'rgba(255,255,255,0.08)',
                    color: filter === f.key ? '#fff' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow:
                      filter === f.key ? '0 2px 12px rgba(224,93,93,0.3)' : 'none',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification list */}
          <div
            className="flex-grow-1 overflow-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-secondary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div
                className="text-center text-muted py-5"
                style={{ fontSize: 13 }}
              >
                <div style={{ fontSize: 48, opacity: 0.4 }}>
                  <FaBell />
                </div>
                <p className="mt-3 mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {filter === 'all'
                    ? 'No notifications yet'
                    : filter === 'pending'
                    ? 'No pending requests'
                    : 'No handled requests'}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                  When people interact with you, you'll see it here
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => setSelectedNotif(notif)}
                  className="w-100 d-flex align-items-center gap-3 px-3 py-3 border-0 text-start"
                  style={{
                    background:
                      selectedNotif?.id === notif.id
                        ? 'rgba(255,255,255,0.08)'
                        : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderLeft:
                      selectedNotif?.id === notif.id
                        ? '3px solid #e05d5d'
                        : '3px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedNotif?.id !== notif.id)
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedNotif?.id !== notif.id)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Avatar with badge */}
                  <div className="position-relative" style={{ flexShrink: 0 }}>
                    <img
                      src={avatar(notif.requester?.profilePicUrl)}
                      className="rounded-circle"
                      alt=""
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        border: isRequested[notif.id]
                          ? '2px solid #e05d5d'
                          : '2px solid rgba(255,255,255,0.1)',
                      }}
                    />
                    {isRequested[notif.id] && (
                      <span
                        className="position-absolute d-flex align-items-center justify-content-center"
                        style={{
                          bottom: -2,
                          right: -2,
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e05d5d, #c0392b)',
                          border: '2px solid #111',
                        }}
                      >
                        <FaUserPlus size={9} color="#fff" />
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-semibold" style={{ fontSize: 14 }}>
                        {notif.requester?.username || 'Unknown'}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <div
                      className="text-muted"
                      style={{
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {isRequested[notif.id]
                        ? 'wants to follow you'
                        : 'Follow request handled ✓'}
                    </div>
                  </div>

                  {/* Quick action dots */}
                  {isRequested[notif.id] && (
                    <div
                      className="d-flex align-items-center gap-1"
                      style={{ flexShrink: 0 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#e05d5d',
                          animation: 'pulse 2s infinite',
                        }}
                      />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Detail Panel ── */}
        {selectedNotif ? (
          <div
            className="d-flex flex-column flex-grow-1 align-items-center justify-content-center"
            style={{ minWidth: 0, padding: '24px' }}
          >
            {/* back on mobile */}
            <div className="w-100 d-md-none mb-3">
              <button
                className="btn btn-sm text-white border-0 p-0 d-flex align-items-center gap-2"
                onClick={() => setSelectedNotif(null)}
                style={{ fontSize: 14 }}
              >
                ← Back to notifications
              </button>
            </div>

            {/* Profile card */}
            <div
              className="d-flex flex-column align-items-center text-center"
              style={{
                maxWidth: 400,
                width: '100%',
                padding: '40px 32px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(20px)',
                animation: 'notifCardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              }}
            >
              <img
                src={avatar(selectedNotif.requester?.profilePicUrl)}
                className="rounded-circle mb-3"
                alt=""
                style={{
                  width: 88,
                  height: 88,
                  objectFit: 'cover',
                  border: '3px solid rgba(224,93,93,0.4)',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  navigate(`/profile/${selectedNotif.requester?.id}`)
                }
              />

              <h5
                className="fw-bold text-white mb-1"
                style={{ fontSize: 18, cursor: 'pointer' }}
                onClick={() =>
                  navigate(`/profile/${selectedNotif.requester?.id}`)
                }
              >
                {selectedNotif.requester?.username}
              </h5>

              <p
                className="text-muted mb-4"
                style={{ fontSize: 13 }}
              >
                {isRequested[selectedNotif.id]
                  ? 'Wants to follow you'
                  : 'This request has been handled'}
              </p>

              {/* Action buttons */}
              {isRequested[selectedNotif.id] ? (
                <div className="d-flex gap-3 w-100 justify-content-center">
                  <button
                    onClick={() => confirmRequest(true, selectedNotif.id)}
                    className="btn d-flex align-items-center gap-2 px-4 py-2"
                    style={{
                      background: 'linear-gradient(135deg, #e05d5d, #c0392b)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 14,
                      boxShadow: '0 4px 18px rgba(224,93,93,0.35)',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow =
                        '0 6px 24px rgba(224,93,93,0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow =
                        '0 4px 18px rgba(224,93,93,0.35)';
                    }}
                  >
                    <FaCheck size={14} /> Confirm
                  </button>
                  <button
                    onClick={() => confirmRequest(false, selectedNotif.id)}
                    className="btn d-flex align-items-center gap-2 px-4 py-2"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      fontWeight: 600,
                      fontSize: 14,
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <FaTrashAlt size={13} /> Delete
                  </button>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center gap-2">
                  <div
                    className="d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
                    style={{
                      background: 'rgba(25,135,84,0.15)',
                      color: '#198754',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    <FaCheck size={12} /> Request handled
                  </div>
                  <button
                    className="btn btn-link text-muted text-decoration-none mt-2"
                    style={{ fontSize: 13 }}
                    onClick={() =>
                      navigate(`/profile/${selectedNotif.requester?.id}`)
                    }
                  >
                    View Profile →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state */
          <div
            className="flex-grow-1 d-none d-md-flex flex-column align-items-center justify-content-center"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                border: '2px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}
            >
              <FaHeart size={36} style={{ opacity: 0.3 }} />
            </div>
            <p
              className="mt-1 mb-1 fw-semibold"
              style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}
            >
              Your Notifications
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
              Select a notification to see details
            </p>
          </div>
        )}
      </div>

      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { background: #0a0a0a !important; }
        ::-webkit-scrollbar { display: none; }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        @keyframes notifCardIn {
          from { transform: scale(0.9) translateY(12px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* Mobile: notification list full width */
        @media (max-width: 767.98px) {
          .border-end { border-right: none !important; }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
