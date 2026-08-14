import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaSearch, FaPaperPlane, FaCheck } from 'react-icons/fa';
import { API_BASE_URL } from '../config';

/**
 * ShareModal — A premium, responsive share modal used for sharing posts & reels.
 *
 * Props:
 *   - isOpen        : boolean — whether the modal is visible
 *   - onClose       : () => void — close callback
 *   - contentType   : 'post' | 'reel'
 *   - contentData   : the post/reel object being shared
 *   - onSend        : (recipientId) => Promise<boolean> — called when user taps Send, should return true on success
 */
const ShareModal = ({ isOpen, onClose, contentType = 'post', contentData, onSend }) => {
  const token = localStorage.getItem('token');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [message, setMessage] = useState('');
  const [sentStatus, setSentStatus] = useState({});
  const [sendingId, setSendingId] = useState(null);

  // ── Load recent conversations ──
  const fetchRecentChats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRecentChats(await res.json());
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchRecentChats();
      setSearchQuery('');
      setSearchResults([]);
      setMessage('');
      setSentStatus({});
      setSendingId(null);
    }
  }, [isOpen, fetchRecentChats]);

  // ── Live search ──
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/${encodeURIComponent(searchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSearchResults(await res.json());
      } catch (_) {}
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, token]);

  // ── Send handler ──
  const handleSend = async (recipientId) => {
    if (sentStatus[recipientId] || sendingId === recipientId) return;
    setSendingId(recipientId);
    try {
      const success = await onSend(recipientId, message);
      if (success !== false) {
        setSentStatus(prev => ({ ...prev, [recipientId]: true }));
      }
    } catch (_) {}
    setSendingId(null);
  };

  // ── Helpers ──
  const avatar = (url, name) =>
    url || `https://ui-avatars.com/api/?background=333&color=fff&name=${name || 'U'}`;

  const isReel = contentType === 'reel';
  const title = isReel ? 'Share Reel' : 'Share Post';
  const previewLabel = isReel ? 'Reel' : 'Post';

  // Build preview
  const previewThumbnail = isReel ? contentData?.videoUrl : contentData?.imageUrl;
  const previewUsername = contentData?.user?.username || contentData?.username || 'user';
  const previewCaption = contentData?.caption || '';
  const isCanvas = !isReel && contentData?.mediaType === 'canvas';
  const isVideo = isReel || contentData?.mediaType === 'video';

  const userList = searchQuery.trim() ? searchResults : recentChats;

  if (!isOpen || !contentData) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="share-modal-backdrop"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="share-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="share-modal-header">
            <div className="d-flex align-items-center gap-2">
              <div className="share-modal-header-icon">
                <FaPaperPlane size={14} />
              </div>
              <h6 className="mb-0 fw-bold" style={{ fontSize: 16, letterSpacing: '0.3px' }}>{title}</h6>
            </div>
            <button
              type="button"
              className="share-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <FaTimes size={14} />
            </button>
          </div>

          {/* ── Content Preview ── */}
          <div className="share-modal-preview">
            <div className="share-modal-preview-thumb">
              {isCanvas ? (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 10,
                    background: contentData.imageUrl,
                  }}
                />
              ) : isVideo ? (
                <video
                  src={previewThumbnail}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={previewThumbnail}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                />
              )}
              <span className="share-modal-preview-badge">{previewLabel}</span>
            </div>
            <div className="share-modal-preview-info">
              <span className="share-modal-preview-sub">Sharing {previewLabel.toLowerCase()} by</span>
              <span className="share-modal-preview-user">@{previewUsername}</span>
              {previewCaption && (
                <span className="share-modal-preview-caption">{previewCaption}</span>
              )}
            </div>
          </div>

          {/* ── Message Input ── */}
          <div className="share-modal-message-wrap">
            <input
              type="text"
              className="share-modal-message-input"
              placeholder="Write a message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* ── Search Input ── */}
          <div className="share-modal-search-wrap">
            <FaSearch size={13} className="share-modal-search-icon" />
            <input
              type="text"
              className="share-modal-search-input"
              placeholder="Search friends…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="share-modal-search-clear"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <FaTimes size={11} />
              </button>
            )}
          </div>

          {/* ── Section label ── */}
          <div className="share-modal-section-label">
            {searchQuery.trim() ? 'Search Results' : 'Recent Conversations'}
          </div>

          {/* ── User list ── */}
          <div className="share-modal-user-list">
            {userList.length === 0 ? (
              <div className="share-modal-empty">
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>
                  {searchQuery.trim() ? '🔍' : '💬'}
                </div>
                <p>{searchQuery.trim() ? 'No users found' : 'No recent conversations'}</p>
                {!searchQuery.trim() && (
                  <p style={{ fontSize: 11, opacity: 0.5 }}>Search for a friend above!</p>
                )}
              </div>
            ) : (
              userList.map((u) => (
                <div
                  key={u.id}
                  className={`share-modal-user-row ${sentStatus[u.id] ? 'share-modal-user-row--sent' : ''}`}
                >
                  <div className="d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
                    <img
                      src={avatar(u.userprofile, u.username)}
                      className="rounded-circle"
                      style={{
                        width: 42,
                        height: 42,
                        objectFit: 'cover',
                        border: '2px solid rgba(255,255,255,0.08)',
                        flexShrink: 0,
                      }}
                      alt=""
                    />
                    <div style={{ minWidth: 0 }}>
                      <div className="fw-semibold" style={{ fontSize: 14 }}>{u.username}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Tap send to share</div>
                    </div>
                  </div>
                  <button
                    className={`share-modal-send-btn ${sentStatus[u.id] ? 'share-modal-send-btn--sent' : ''}`}
                    disabled={sentStatus[u.id] || sendingId === u.id}
                    onClick={() => handleSend(u.id)}
                  >
                    {sendingId === u.id ? (
                      <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                    ) : sentStatus[u.id] ? (
                      <><FaCheck size={11} /> Sent</>
                    ) : (
                      <><FaPaperPlane size={11} /> Send</>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Styles ── */}
      <style>{`
        .share-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: shareBackdropIn 0.25s ease-out;
        }

        @keyframes shareBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .share-modal-container {
          width: 100%;
          max-width: 460px;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          background: rgba(22, 22, 22, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          overflow: hidden;
          color: #fff;
          animation: shareModalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes shareModalIn {
          from { transform: scale(0.88) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        /* ── Header ── */
        .share-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .share-modal-header-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #e05d5d, #c0392b);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(224, 93, 93, 0.3);
        }

        .share-modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .share-modal-close:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: rotate(90deg);
        }

        /* ── Preview ── */
        .share-modal-preview {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          margin: 0;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .share-modal-preview-thumb {
          width: 60px;
          height: 72px;
          flex-shrink: 0;
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .share-modal-preview-badge {
          position: absolute;
          bottom: 4px;
          left: 4px;
          background: rgba(0, 0, 0, 0.65);
          color: rgba(255, 255, 255, 0.9);
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 6px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .share-modal-preview-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .share-modal-preview-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          font-weight: 500;
        }

        .share-modal-preview-user {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }

        .share-modal-preview-caption {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.35);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 280px;
        }

        /* ── Message Input ── */
        .share-modal-message-wrap {
          padding: 12px 20px 0;
        }

        .share-modal-message-input {
          width: 100%;
          padding: 11px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: all 0.25s ease;
        }

        .share-modal-message-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .share-modal-message-input:focus {
          border-color: rgba(224, 93, 93, 0.4);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(224, 93, 93, 0.1);
        }

        /* ── Search ── */
        .share-modal-search-wrap {
          margin: 12px 20px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .share-modal-search-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.3);
          pointer-events: none;
          z-index: 1;
        }

        .share-modal-search-input {
          width: 100%;
          padding: 10px 36px 10px 38px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: all 0.25s ease;
        }

        .share-modal-search-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .share-modal-search-input:focus {
          border-color: rgba(224, 93, 93, 0.4);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(224, 93, 93, 0.1);
        }

        .share-modal-search-clear {
          position: absolute;
          right: 10px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .share-modal-search-clear:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        /* ── Section label ── */
        .share-modal-section-label {
          padding: 0 20px 8px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        /* ── User list ── */
        .share-modal-user-list {
          flex: 1;
          overflow-y: auto;
          padding: 0 12px 16px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          min-height: 120px;
          max-height: 300px;
        }

        .share-modal-user-list::-webkit-scrollbar { display: none; }

        .share-modal-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          text-align: center;
          color: rgba(255, 255, 255, 0.35);
          font-size: 13px;
        }

        .share-modal-empty p {
          margin: 0;
        }

        /* ── User row ── */
        .share-modal-user-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 14px;
          margin-bottom: 4px;
          transition: all 0.2s ease;
          cursor: default;
        }

        .share-modal-user-row:hover {
          background: rgba(255, 255, 255, 0.04);
        }

        .share-modal-user-row--sent {
          opacity: 0.6;
        }

        /* ── Send button ── */
        .share-modal-send-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 12px;
          border: none;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: #fff;
          background: linear-gradient(135deg, #e05d5d, #c0392b);
          box-shadow: 0 3px 12px rgba(224, 93, 93, 0.3);
          cursor: pointer;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .share-modal-send-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 5px 18px rgba(224, 93, 93, 0.45);
        }

        .share-modal-send-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.97);
        }

        .share-modal-send-btn:disabled {
          cursor: default;
        }

        .share-modal-send-btn--sent {
          background: rgba(25, 135, 84, 0.25) !important;
          color: #198754 !important;
          box-shadow: none !important;
          border: 1px solid rgba(25, 135, 84, 0.3);
        }

        /* ── Mobile responsive ── */
        @media (max-width: 575.98px) {
          .share-modal-backdrop {
            padding: 0;
            align-items: flex-end;
          }

          .share-modal-container {
            max-width: 100%;
            max-height: 88vh;
            border-radius: 20px 20px 0 0;
            animation: shareModalSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          }

          @keyframes shareModalSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }

          .share-modal-header {
            padding: 16px;
          }

          .share-modal-preview {
            padding: 12px 16px;
          }

          .share-modal-message-wrap {
            padding: 10px 16px 0;
          }

          .share-modal-search-wrap {
            margin: 10px 16px;
          }

          .share-modal-section-label {
            padding: 0 16px 6px;
          }

          .share-modal-user-list {
            padding: 0 8px 24px;
            max-height: 50vh;
          }

          .share-modal-user-row {
            padding: 10px 8px;
          }

          .share-modal-send-btn {
            padding: 8px 14px;
          }

          .share-modal-preview-caption {
            max-width: 180px;
          }
        }
      `}</style>
    </>
  );
};

export default ShareModal;
