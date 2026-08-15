import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SideComponent from '../components/SideComponent';
import { API_BASE_URL } from '../config';
import { FaTimes } from 'react-icons/fa';

const MessagesPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // ── state ──────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat]       = useState(null);  // SearchDTO {id, username, userprofile}
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sending, setSending]             = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState(null);
  const [playingReel, setPlayingReel] = useState(null);
  const [playingPost, setPlayingPost] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  const bottomRef      = useRef(null);
  const pollTimerRef   = useRef(null);
  const activeChatRef  = useRef(activeChat);

  // keep ref in sync (needed inside polling closure)
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  // ── auth guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) navigate('/login');
  }, [token, navigate]);

  // ── load conversation list ─────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setConversations(await res.json());
    } catch (_) {}
  }, [token]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── fetch chat history (used both initially and by polling) ────────────
  const fetchHistory = useCallback(async (partnerId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/history/${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch (_) {}
  }, [token]);

  // ── polling: every 3 seconds while a chat is open ─────────────────────
  const startPolling = useCallback((partnerId) => {
    clearTimeout(pollTimerRef.current);
    const tick = () => {
      if (!activeChatRef.current || activeChatRef.current.id !== partnerId) return;
      fetchHistory(partnerId).then(() => {
        pollTimerRef.current = setTimeout(tick, 3000);
      });
    };
    pollTimerRef.current = setTimeout(tick, 3000);
  }, [fetchHistory]);

  useEffect(() => () => clearTimeout(pollTimerRef.current), []);

  // ── open a conversation ────────────────────────────────────────────────
  const openChat = (partner) => {
    clearTimeout(pollTimerRef.current);
    setActiveChat(partner);
    setMessages([]);
    setInput('');
    fetchHistory(partner.id).then(() => startPolling(partner.id));
    // add to conversations list if not already there
    setConversations(prev =>
      prev.some(c => c.id === partner.id) ? prev : [partner, ...prev]
    );
  };

  // ── scroll to bottom whenever messages change ──────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── live user search ───────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const tid = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/${encodeURIComponent(searchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setSearchResults(await res.json());
      } catch (_) {}
    }, 300);
    return () => clearTimeout(tid);
  }, [searchQuery, token]);

  // ── send a message ─────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recipientId: activeChat.id, content: input.trim(), repliedToMessageId: replyingTo ? replyingTo.id : null }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages(prev => [...prev, sent]);
        setInput('');
        setReplyingTo(null);
        fetchConversations();
      }
    } catch (_) {}
    setSending(false);
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/delete/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } else {
        alert("Failed to delete message");
      }
    } catch (_) {}
  };

  const handleSaveEditMessage = async (messageId) => {
    if (!editingMessageText.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/messages/edit/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editingMessageText.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: updated.content } : m));
        setEditingMessageId(null);
        setEditingMessageText('');
      } else {
        alert("Failed to edit message");
      }
    } catch (_) {}
  };

  const myId = Number(localStorage.getItem('userId'));

  // ── helpers ────────────────────────────────────────────────────────────
  const avatar = (url) =>
    url ? url : 'https://ui-avatars.com/api/?background=333&color=fff&name=U';

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ── render ─────────────────────────────────────────────────────────────
  return (
    <div className="d-flex" style={{ height: '100vh', background: '#0a0a0a' }}>
      <SideComponent />

      {/* ── Main messages panel ── */}
      <div
        className="d-flex flex-grow-1"
        style={{
          marginLeft: '0',
          background: 'linear-gradient(135deg, #0d0d0d 0%, #111 100%)',
          overflow: 'hidden',
        }}
      >
        {/* ── Left: Inbox ── */}
        <div
          className={`d-flex flex-column border-end border-secondary messages-inbox-panel ${activeChat ? 'd-none d-md-flex' : 'd-flex'}`}
          style={{ width: '340px', minWidth: '280px', background: '#111' }}
        >
          {/* Header */}
          <div className="p-3 border-bottom border-secondary d-flex align-items-center justify-content-between gap-2">
            <div>
              <h5 className="mb-0 fw-bold text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                Messages
              </h5>
              <small className="text-muted">Direct messages</small>
            </div>
            {/* Close Button */}
            <button 
              className="btn btn-link text-white-50 p-1.5 d-flex align-items-center justify-content-center border-0 outline-none text-decoration-none"
              onClick={() => navigate('/home')}
              style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.06)', width: '32px', height: '32px' }}
              title="Close Messages"
            >
              <FaTimes size={14} className="text-white" />
            </button>
          </div>

          {/* Search new user */}
          <div className="px-3 py-2 position-relative">
            <div className="input-group">
              <span className="input-group-text bg-transparent border-secondary text-secondary">
                <svg width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.868-3.834zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
              </span>
              <input
                className="form-control border-secondary bg-transparent text-white"
                placeholder="Search people…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ fontSize: '14px' }}
              />
            </div>

            {/* Live search results dropdown */}
            {searchResults.length > 0 && (
              <div
                className="position-absolute w-100 rounded-3 border border-secondary mt-1 shadow-lg overflow-hidden"
                style={{
                  background: 'rgba(20,20,20,0.98)',
                  backdropFilter: 'blur(20px)',
                  zIndex: 9999,
                  left: 0,
                  top: '100%',
                  maxHeight: '240px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.map(u => (
                  <button
                    key={u.id}
                    className="w-100 d-flex align-items-center gap-3 px-3 py-2 border-0 text-start"
                    style={{ background: 'transparent', color: 'white', cursor: 'pointer' }}
                    onClick={() => { openChat(u); setSearchQuery(''); setSearchResults([]); }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <img
                      src={avatar(u.userprofile)}
                      className="rounded-circle"
                      alt=""
                      style={{ width: 36, height: 36, objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{u.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-grow-1 overflow-auto" style={{ scrollbarWidth: 'none' }}>
            {conversations.length === 0 ? (
              <div className="text-center text-muted py-5" style={{ fontSize: 13 }}>
                <div style={{ fontSize: 36 }}>💬</div>
                <p className="mt-2">No conversations yet.<br />Search for someone above!</p>
              </div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => openChat(c)}
                  className="w-100 d-flex align-items-center gap-3 px-3 py-3 border-0 text-start"
                  style={{
                    background: activeChat?.id === c.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    borderLeft: activeChat?.id === c.id ? '3px solid #e05d5d' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { if (activeChat?.id !== c.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (activeChat?.id !== c.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <img
                    src={avatar(c.userprofile)}
                    className="rounded-circle"
                    alt=""
                    style={{ width: 44, height: 44, objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="fw-semibold" style={{ fontSize: 14 }}>{c.username}</div>
                    <div className="text-muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Tap to open conversation
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: Active chat ── */}
        {activeChat ? (
          <div className="d-flex flex-column flex-grow-1 messages-chat-panel" style={{ minWidth: 0 }}>

            {/* Chat header */}
            <div
              className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom border-secondary"
              style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', flexShrink: 0 }}
            >
              <div className="d-flex align-items-center gap-3">
                {/* back button on mobile */}
                <button
                  className="btn btn-sm d-md-none text-white border-0 p-0 me-1"
                  onClick={() => { clearTimeout(pollTimerRef.current); setActiveChat(null); }}
                >
                  ←
                </button>
                <img
                  src={avatar(activeChat.userprofile)}
                  className="rounded-circle"
                  alt=""
                  style={{ width: 42, height: 42, objectFit: 'cover', cursor: 'pointer' }}
                  onClick={(e) => { e.stopPropagation(); navigate(`/profile/${activeChat.id}`); }}
                />
                <div onClick={(e) => { e.stopPropagation(); navigate(`/profile/${activeChat.id}`); }} style={{ cursor: 'pointer' }}>
                  <div className="fw-bold text-white" style={{ fontSize: 15 }}>{activeChat.username}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>Active now</div>
                </div>
              </div>
              
              {/* Close Button */}
              <button 
                className="btn btn-link text-white-50 p-1.5 d-flex align-items-center justify-content-center border-0 outline-none text-decoration-none"
                onClick={() => navigate('/home')}
                style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.06)', width: '32px', height: '32px' }}
                title="Close Chat & Go Home"
              >
                <FaTimes size={14} className="text-white" />
              </button>
            </div>

            {/* Message history */}
            <div
              className="flex-grow-1 px-4 py-3 overflow-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {messages.length === 0 ? (
                <div className="text-center text-muted mt-auto mb-auto" style={{ fontSize: 14 }}>
                  <div style={{ fontSize: 48 }}>👋</div>
                  <p>Say hello to <strong className="text-white">{activeChat.username}</strong>!</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === myId;
                  return (
                    <div
                      key={m.id}
                      className="d-flex align-items-center gap-2 message-row"
                      style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}
                    >
                      {isMe && (
                        <div className="position-relative message-actions animate__animated animate__fadeIn" style={{ opacity: 0, transition: 'opacity 0.2s' }}>
                          {editingMessageId !== m.id && (
                            <>
                              <button 
                                type="button" 
                                className="btn btn-link text-white p-0 text-decoration-none border-0 px-1" 
                                onClick={() => setActiveMenuMessageId(activeMenuMessageId === m.id ? null : m.id)}
                                style={{ fontSize: '18px', lineHeight: '1' }}
                              >
                                ⋮
                              </button>
                              {activeMenuMessageId === m.id && (
                                <div 
                                  className="position-absolute bg-dark border border-secondary rounded p-1 shadow-lg" 
                                  style={{ 
                                    right: isMe ? "10px" : "auto", 
                                    left: isMe ? "auto" : "10px", 
                                    bottom: "20px", 
                                    zIndex: 10, 
                                    minWidth: "75px" 
                                  }}
                                >
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-link text-warning d-block w-100 text-start text-decoration-none py-1 px-2" 
                                    onClick={() => { setReplyingTo(m); setActiveMenuMessageId(null); }}
                                    style={{ fontSize: '12px' }}
                                  >
                                    Reply
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-link text-info d-block w-100 text-start text-decoration-none py-1 px-2" 
                                    onClick={() => { setEditingMessageId(m.id); setEditingMessageText(m.content); setActiveMenuMessageId(null); }}
                                    style={{ fontSize: '12px' }}
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    type="button" 
                                    className="btn btn-sm btn-link text-danger d-block w-100 text-start text-decoration-none py-1 px-2" 
                                    onClick={() => { handleDeleteMessage(m.id); setActiveMenuMessageId(null); }}
                                    style={{ fontSize: '12px' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      <div
                        style={{
                          maxWidth: '65%',
                          padding: '10px 14px',
                          borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                          background: isMe
                            ? 'linear-gradient(135deg, #e05d5d, #c0392b)'
                            : 'rgba(255,255,255,0.1)',
                          backdropFilter: isMe ? 'none' : 'blur(10px)',
                          color: 'white',
                          fontSize: 14,
                          lineHeight: 1.5,
                          boxShadow: isMe
                            ? '0 4px 15px rgba(224,93,93,0.3)'
                            : '0 2px 8px rgba(0,0,0,0.3)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.repliedTo && (
                          <div style={{ padding: '6px 8px', marginBottom: 8, borderRadius: 8, background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>
                            <div style={{ fontWeight: 600, fontSize: 12, opacity: 0.9 }}>{m.repliedTo.senderId === myId ? 'You' : (m.repliedTo.senderUsername || 'User')}</div>
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.repliedTo.content}</div>
                          </div>
                        )}
                        {m.reel ? (
                          <div
                            style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)', maxWidth: '240px', margin: '4px 0' }}
                            onClick={() => setPlayingReel(m.reel)}
                          >
                            <div style={{ position: 'relative', width: '100%', paddingTop: '133.33%' }}>
                              <video
                                src={m.reel.videoUrl}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                muted loop playsInline
                                onMouseEnter={(e) => e.target.play().catch(() => {})}
                                onMouseLeave={(e) => e.target.pause()}
                              />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)', padding: '8px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.9)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', fontWeight: '500' }}>
                                ▶ Reel
                              </div>
                            </div>
                            {m.content && m.content !== 'Shared a reel' && (
                              <div style={{ padding: '8px 12px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>{m.content}</div>
                            )}
                          </div>
                        ) : m.post ? (
                          <div
                            style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)', maxWidth: '180px', margin: '4px 0' }}
                            onClick={() => setPlayingPost(m.post)}
                          >
                            <div style={{ position: 'relative', width: '100%', paddingTop: '66.66%', overflow: 'hidden' }}>
                              {m.post.mediaType === 'video' ? (
                                <video
                                  src={m.post.imageUrl}
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                  muted loop playsInline
                                />
                              ) : (
                                <img
                                  src={m.post.imageUrl}
                                  alt="post"
                                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              )}
                              <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>Post</div>
                            </div>
                            {m.content && m.content !== 'Shared a post' && (
                              <div style={{ padding: '6px 8px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>{m.content}</div>
                            )}
                          </div>
                        ) : (
                          editingMessageId === m.id ? (
                            <div className="d-flex gap-2 align-items-center">
                              <input
                                type="text"
                                className="form-control form-control-sm bg-dark text-white border-secondary"
                                value={editingMessageText}
                                onChange={e => setEditingMessageText(e.target.value)}
                                style={{ fontSize: '13px', minWidth: '150px' }}
                                autoFocus
                              />
                              <button type="button" className="btn btn-sm btn-success px-2 py-0" onClick={() => handleSaveEditMessage(m.id)} style={{ fontSize: '11px' }}>Save</button>
                              <button type="button" className="btn btn-sm btn-secondary px-2 py-0" onClick={() => { setEditingMessageId(null); setEditingMessageText(''); }} style={{ fontSize: '11px' }}>Cancel</button>
                            </div>
                          ) : (
                            <div>{m.content}</div>
                          )
                        )}
                        <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>
                          {formatTime(m.createdAt)}
                          <button type="button" className="btn btn-link btn-sm text-secondary ms-2 p-0" onClick={() => setReplyingTo(m)} style={{ fontSize: '11px' }}>↩ reply</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <form
              onSubmit={handleSend}
              className="px-4 py-3 d-flex align-items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(10px)',
                flexShrink: 0,
                position: 'relative'
              }}
            >
              {replyingTo && (
                <div className="w-100 mb-2 px-2 py-2 rounded-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                      Replying to <strong>{replyingTo.senderId === myId ? 'You' : (replyingTo.senderUsername || 'User')}</strong>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '420px' }}>{replyingTo.content}</div>
                    </div>
                    <button type="button" className="btn btn-sm btn-link text-white" onClick={() => setReplyingTo(null)}>✕</button>
                  </div>
                </div>
              )}
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="position-absolute bg-dark border border-secondary rounded p-2 shadow-lg" style={{ bottom: "70px", left: "20px", zIndex: 1000, maxWidth: "220px" }}>
                  <div className="d-flex flex-wrap gap-1">
                    {["😀", "😂", "😍", "👍", "🔥", "❤️", "👏", "🎉", "😢", "😮", "🙌", "✨", "🌟", "😎", "🤔", "💯"].map(emoji => (
                      <button 
                        type="button" 
                        key={emoji} 
                        className="btn btn-sm btn-outline-light p-1 border-0" 
                        onClick={() => { setInput(prev => prev + emoji); setShowEmojiPicker(false); }}
                        style={{ fontSize: "16px" }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button 
                type="button" 
                className="btn btn-outline-light p-2 rounded-circle border-0 d-flex align-items-center justify-content-center" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                title="Add Emoji"
              >
                😊
              </button>
              <input
                type="text"
                className="form-control border-0 text-white"
                placeholder="Message…"
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 24,
                  padding: '10px 18px',
                  fontSize: 14,
                  outline: 'none',
                  boxShadow: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                style={{
                  background: 'linear-gradient(135deg, #e05d5d, #c0392b)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                  opacity: input.trim() && !sending ? 1 : 0.45,
                  transition: 'opacity 0.2s, transform 0.15s',
                  transform: input.trim() && !sending ? 'scale(1)' : 'scale(0.95)',
                  boxShadow: '0 4px 15px rgba(224,93,93,0.4)',
                }}
              >
                {sending ? (
                  <span className="spinner-border spinner-border-sm text-white" role="status" />
                ) : (
                  <svg width="18" height="18" fill="white" viewBox="0 0 16 16">
                    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11zM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493z"/>
                  </svg>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Empty state - no active chat */
          <div
            className="flex-grow-1 d-none d-md-flex flex-column align-items-center justify-content-center"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          >
            <svg width="80" height="80" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.3 }}>
              <path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741L5.53 9.441C5.786 9.181 5.957 9 6.5 9h3c.543 0 .714.181.97.441l4.496 3.818A1 1 0 0 1 14 14h-1.5a.5.5 0 0 0 0 1H14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v8a1 1 0 0 1-.032.01L11.315 8.4C12.505 7.655 13 6.95 13 6c0-1.105-.895-2-2-2H5c-1.105 0-2 .895-2 2 0 .95.495 1.655 1.685 2.4L1.032 12.01A1 1 0 0 1 1 12V4a1 1 0 0 1 1-1h12z"/>
            </svg>
            <p className="mt-3 mb-1 fw-semibold" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>Your Messages</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Search for a friend to start chatting</p>
          </div>
        )}
      </div>

      {/* ── Immersive Reel Player Modal ── */}
      {playingReel && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.92)', 
            backdropFilter: 'blur(15px)',
            zIndex: 100000 
          }}
          onClick={() => setPlayingReel(null)}
        >
          {/* Close button */}
          <button 
            type="button"
            className="btn btn-link text-white position-absolute" 
            style={{ top: '20px', right: '20px', fontSize: '30px', zIndex: 100001, textDecoration: 'none', border: 'none', outline: 'none' }}
            onClick={() => setPlayingReel(null)}
          >
            ✕
          </button>

          {/* Reel Container */}
          <div 
            className="d-flex flex-column align-items-center justify-content-center position-relative"
            style={{ 
              width: '100%', 
              maxWidth: '380px', 
              height: '80vh',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <video 
              src={playingReel.videoUrl} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover', 
                borderRadius: '16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
              }}
              autoPlay 
              controls 
              loop
              playsInline
            />

            {/* Overlay User Info */}
            <div 
              style={{ 
                position: 'absolute', 
                bottom: '0', 
                left: '0', 
                right: '0',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
                padding: '24px 20px 20px 20px',
                borderRadius: '0 0 16px 16px',
                pointerEvents: 'none'
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <img 
                  src={playingReel.profilePicUrl || 'https://ui-avatars.com/api/?background=333&color=fff&name=' + (playingReel.username || 'U')} 
                  className="rounded-circle"
                  style={{ width: '32px', height: '32px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                  alt=""
                />
                <span className="fw-bold text-white" style={{ fontSize: '14px', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  @{playingReel.username || 'instagram_user'}
                </span>
              </div>
              <p className="text-white-50 m-0 text-truncate" style={{ fontSize: '13px', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                {playingReel.caption || ""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Immersive Post Viewer Modal ── */}
      {playingPost && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.92)', 
            backdropFilter: 'blur(15px)',
            zIndex: 100000 
          }}
          onClick={() => setPlayingPost(null)}
        >
          <button 
            type="button"
            className="btn btn-link text-white position-absolute" 
            style={{ top: '20px', right: '20px', fontSize: '30px', zIndex: 100001, textDecoration: 'none', border: 'none', outline: 'none' }}
            onClick={() => setPlayingPost(null)}
          >
            ✕
          </button>

          <div 
            className="d-flex flex-column align-items-center justify-content-center position-relative"
            style={{ 
              width: '100%', 
              maxWidth: '680px', 
              height: '80vh',
              animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {playingPost.mediaType === 'video' ? (
              <video 
                src={playingPost.imageUrl} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover', 
                  borderRadius: '16px',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}
                autoPlay 
                controls 
                loop
                playsInline
              />
            ) : (
              <img src={playingPost.imageUrl} alt="post" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} />
            )}

            <div 
              style={{ 
                position: 'absolute', 
                bottom: '0', 
                left: '0', 
                right: '0',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
                padding: '24px 20px 20px 20px',
                borderRadius: '0 0 16px 16px',
                pointerEvents: 'none'
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <img 
                  src={playingPost.profilePicUrl || ('https://ui-avatars.com/api/?background=333&color=fff&name=' + (playingPost.username || 'U'))} 
                  className="rounded-circle"
                  style={{ width: '32px', height: '32px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }}
                  alt=""
                />
                <span className="fw-bold text-white" style={{ fontSize: '14px', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                  @{playingPost.username || 'instagram_user'}
                </span>
              </div>
              <p className="text-white-50 m-0 text-truncate" style={{ fontSize: '13px', textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }}>
                {playingPost.caption || ""}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { background: #0a0a0a !important; }
        input.form-control:focus {
          background: rgba(255,255,255,0.12) !important;
          box-shadow: 0 0 0 2px rgba(224,93,93,0.35) !important;
        }
        ::-webkit-scrollbar { display: none; }
        .message-row:hover .message-actions {
          opacity: 0.85 !important;
        }
        @keyframes scaleUp {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MessagesPage;
