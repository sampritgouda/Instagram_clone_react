import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaMicrophone, FaStop, FaTrash, FaVolumeUp } from 'react-icons/fa'
import { API_BASE_URL } from '../config'
import { createPicker } from 'picmo'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { Grid } from '@giphy/react-components'

const Comment = ({ id, type, onclose }) => {
  const [commentvalue, setcommentvalue] = useState("")
  const [comments, setcomments] = useState([])
  const token = localStorage.getItem("token")
  const navigate = useNavigate()

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const myId = localStorage.getItem("userId");
  const [editingCommentId, seteditingCommentId] = useState(null);
  const [editingCommentText, seteditingCommentText] = useState("");
  const [activeMenuCommentId, setactiveMenuCommentId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [repliesMap, setRepliesMap] = useState({}); // parentId -> { open, loading, items }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || '');
  const emojiPickerRoot = useRef(null);
  const emojiPickerInstance = useRef(null);

  const navigateprofile = (uid) => {
    if (onclose) onclose();
    navigate(`/profile/${uid}`);
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/comment/delete/${commentId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) {
        setcomments((prev) => prev.filter(c => c.id !== commentId));
      } else {
        alert("Failed to delete comment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditComment = async (commentId) => {
    if (editingCommentText.trim() === "") return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/comment/edit/${commentId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: editingCommentText })
      });
      if (resp.ok) {
        const updated = await resp.json();
        setcomments((prev) => prev.map(c => c.id === commentId ? updated : c));
        seteditingCommentId(null);
        seteditingCommentText("");
      } else {
        alert("Failed to update comment");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getComments = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/comment/${id}/${type}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await resp.json();
      setcomments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }

  const sendComment = async () => {
    if (commentvalue.trim() === "") return;

    try {
      const resp = await fetch(`${API_BASE_URL}/api/comment/add`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          commentvalue: commentvalue,
          id: id,
          type,
          repliedToCommentId: replyingTo ? replyingTo.id : null
        })
      });

      if (!resp.ok) throw new Error("Failed to add comment");

      const newComment = await resp.json();
      // if this is a reply, append to replies list if loaded, otherwise ignore (will load on demand)
      if (newComment.repliedToId) {
        setRepliesMap(prev => {
          const parent = newComment.repliedToId;
          const entry = prev[parent];
          if (entry && entry.items) {
            return { ...prev, [parent]: { ...entry, items: [...entry.items, newComment] } };
          }
          return prev;
        });
      } else {
        setcomments((prev) => [...prev, newComment]);
      }
      setcommentvalue("");
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmojiSelect = (emoji) => {
    // emoji from picmo comes as { emoji: '😁', label: 'grinning' }
    const ch = emoji?.emoji || emoji?.native || '';
    setcommentvalue(prev => prev + ch);
    setShowEmojiPicker(false);
  }

  const handleGifSelect = (gif) => {
    if (!gif) return;
    // append GIF url to text so backend stores it; frontend will render links as media
    const url = gif.images?.original?.url || gif.url;
    setcommentvalue(prev => prev ? prev + ' ' + url : url);
    setShowGifPicker(false);
  }

  // Recording timer helpers
  const startTimer = () => {
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // MediaRecorder triggers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopTimer();
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setDuration(0);
  };

  const sendVoiceComment = async () => {
    if (!audioBlob) return;
    setSendingVoice(true);

    const formData = new FormData();
    formData.append("audio", audioBlob, "comment_voice.webm");
    formData.append("id", id);
    formData.append("type", type);
    if(replyingTo){
      formData.append("repliedToCommentId", replyingTo.id);
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/api/comment/add-voice`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (!resp.ok) throw new Error("Failed to post voice comment");

      const newComment = await resp.json();
      if (newComment.repliedToId) {
        setRepliesMap(prev => {
          const parent = newComment.repliedToId;
          const entry = prev[parent];
          if (entry && entry.items) {
            return { ...prev, [parent]: { ...entry, items: [...entry.items, newComment] } };
          }
          return prev;
        });
      } else {
        setcomments((prev) => [...prev, newComment]);
      }
      setAudioBlob(null);
      setDuration(0);
      setReplyingTo(null);
    } catch (err) {
      alert("Failed to upload voice comment.");
    } finally {
      setSendingVoice(false);
    }
  };

  const toggleReplies = async (parentId) => {
    const entry = repliesMap[parentId];
    if (entry && entry.open) {
      setRepliesMap(prev => ({ ...prev, [parentId]: { ...entry, open: false } }));
      return;
    }
    if (entry && entry.items) {
      setRepliesMap(prev => ({ ...prev, [parentId]: { ...entry, open: true } }));
      return;
    }
    // load replies
    setRepliesMap(prev => ({ ...prev, [parentId]: { open: true, loading: true, items: [] } }));
    try {
      const resp = await fetch(`${API_BASE_URL}/api/comment/replies/${parentId}`, { headers: { "Authorization": `Bearer ${token}` } });
      const data = await resp.json();
      setRepliesMap(prev => ({ ...prev, [parentId]: { open: true, loading: false, items: data } }));
    } catch (err) {
      console.error('Failed to load replies', err);
      setRepliesMap(prev => ({ ...prev, [parentId]: { open: false, loading: false, items: [] } }));
    }
  }

  useEffect(() => {
    getComments();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Manage picmo picker lifecycle
  useEffect(() => {
    if (showEmojiPicker && emojiPickerRoot.current && !emojiPickerInstance.current) {
      // create picker inside root
      emojiPickerInstance.current = createPicker({ rootElement: emojiPickerRoot.current });
      emojiPickerInstance.current.addEventListener('emoji:select', (ev) => {
        handleEmojiSelect(ev.detail || ev);
      });
    }
    if (!showEmojiPicker && emojiPickerInstance.current) {
      try { emojiPickerInstance.current.destroy(); } catch (e) {}
      emojiPickerInstance.current = null;
      if (emojiPickerRoot.current) emojiPickerRoot.current.innerHTML = '';
    }
    // cleanup on unmount
    return () => {
      if (emojiPickerInstance.current) {
        try { emojiPickerInstance.current.destroy(); } catch (e) {}
        emojiPickerInstance.current = null;
      }
    };
  }, [showEmojiPicker]);

  return (
    <div className='w-100 h-100 flex-column d-flex' style={{ maxHeight: "400px", position: "relative" }}>
      <h5 className='text-center text-white mb-3'>Comments</h5>
      
      <div className='flex-column gap-2 flex-grow-1 overflow-auto mb-2 px-1' style={{ height: "70%", overflowY: "auto" }}>
        {comments.map((comment, key) => (
          <div key={key} className='text-white p-2 mb-1 rounded bg-secondary bg-opacity-10 position-relative'>
            <div className='d-flex gap-2 align-items-center mb-1'> 
              <img className='rounded-circle' src={comment.userprofile} style={{ width: "26px", height: "26px", objectFit: "cover" }} alt="" />
              <span 
                style={{ fontSize: "14px", fontWeight: "600", cursor: "pointer", fontFamily: "sans-serif" }}
                onClick={() => navigateprofile(comment.userId)}
              >
                {comment.username}
              </span>

              {Number(comment.userId) === Number(myId) && (
                <div className="ms-auto position-relative">
                  <button 
                    type="button"
                    className="btn btn-link text-white p-0 text-decoration-none border-0"
                    onClick={() => setactiveMenuCommentId(activeMenuCommentId === comment.id ? null : comment.id)}
                    style={{ fontSize: '18px', lineHeight: '1', opacity: 0.6 }}
                  >
                    ⋮
                  </button>
                  {activeMenuCommentId === comment.id && (
                    <div className="position-absolute bg-dark border border-secondary rounded p-1 shadow-lg" style={{ right: "0px", top: "20px", zIndex: 10, minWidth: "80px" }}>
                      {!comment.isVoice && (
                        <button 
                          type="button"
                          className="btn btn-sm btn-link text-info d-block w-100 text-start text-decoration-none py-1 px-2"
                          onClick={() => { seteditingCommentId(comment.id); seteditingCommentText(comment.text); setactiveMenuCommentId(null); }}
                          style={{ fontSize: '12px' }}
                        >
                          Edit
                        </button>
                      )}
                      <button 
                        type="button"
                        className="btn btn-sm btn-link text-danger d-block w-100 text-start text-decoration-none py-1 px-2"
                        onClick={() => { handleDeleteComment(comment.id); setactiveMenuCommentId(null); }}
                        style={{ fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                className="btn btn-link text-info p-0 ms-2"
                onClick={() => { setReplyingTo(comment); setactiveMenuCommentId(null); }}
                style={{ fontSize: '12px' }}
              >
                Reply
              </button>
            </div>
            {comment.repliedToUsername && (
              <div className="ps-4 mb-1" style={{ fontSize: "13px", color: "#bfc7cf" }}>
                <strong style={{ fontSize: '12px', marginRight: '6px' }}>{comment.repliedToUsername}</strong>
                <span style={{ fontSize: '13px' }}>{comment.repliedToText}</span>
              </div>
            )}
            {comment.isVoice ? (
              <div className="ps-4 mt-1 d-flex align-items-center gap-2">
                <FaVolumeUp size={14} className="text-info" />
                <audio src={comment.audioUrl} controls style={{ height: '30px', maxWidth: '180px' }} />
              </div>
            ) : (
              editingCommentId === comment.id ? (
                <div className="d-flex gap-2 align-items-center ps-4 mt-1">
                  <input
                    type="text"
                    className="form-control form-control-sm bg-dark text-white border-secondary"
                    value={editingCommentText}
                    onChange={(e) => seteditingCommentText(e.target.value)}
                    style={{ fontSize: '13px' }}
                    autoFocus
                  />
                  <button className="btn btn-sm btn-success px-2 py-0" onClick={() => handleSaveEditComment(comment.id)}>Save</button>
                  <button className="btn btn-sm btn-secondary px-2 py-0" onClick={() => { seteditingCommentId(null); seteditingCommentText(""); }}>Cancel</button>
                </div>
              ) : (
                <span style={{ fontSize: "14px", fontFamily: "sans-serif", paddingLeft: "34px", display: "block" }}>
                  {comment.text}
                </span>
              )
            )}

            {/* Actions are now managed inside the 3-dot dropdown menu */}
            {comment.replyCount > 0 && (
              <div className="ps-4 mt-1">
                <button className="btn btn-sm btn-link text-info p-0" onClick={() => toggleReplies(comment.id)}>
                  {repliesMap[comment.id] && repliesMap[comment.id].open ? 'Hide replies' : `View replies (${comment.replyCount})`}
                </button>
              </div>
            )}

            {repliesMap[comment.id] && repliesMap[comment.id].open && (
              <div style={{ marginLeft: '34px' }} className="mt-2">
                {repliesMap[comment.id].loading ? (
                  <div className="text-muted ps-2">Loading replies...</div>
                ) : (
                  repliesMap[comment.id].items.map((r) => (
                    <div key={r.id} className='text-white p-2 mb-1 rounded bg-dark bg-opacity-25'>
                      <div className='d-flex gap-2 align-items-center mb-1'>
                        <img className='rounded-circle' src={r.userprofile} style={{ width: "22px", height: "22px", objectFit: "cover" }} alt="" />
                        <span 
                          style={{ fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "sans-serif" }}
                          onClick={() => navigateprofile(r.userId)}
                        >
                          {r.username}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#d0d6db', paddingLeft: '28px' }}>{r.text}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {replyingTo && (
        <div className="mb-1 px-2 py-1 rounded bg-dark bg-opacity-50 border border-secondary text-white d-flex align-items-center">
          <div style={{ flex: 1 }}>
            Replying to <strong style={{ marginLeft: 6 }}>{replyingTo.username}</strong>
            <div style={{ fontSize: '13px', color: '#bfc7cf' }}>{replyingTo.text}</div>
          </div>
          <button className="btn btn-sm btn-light ms-2" onClick={() => setReplyingTo(null)}>Cancel</button>
        </div>
      )}

      <div className='d-flex p-2 gap-2 align-items-center bg-black bg-opacity-50 rounded border border-secondary mt-auto' style={{ minHeight: "55px", position: "relative" }}>
        {/* Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="position-absolute bg-dark border border-secondary rounded p-2 shadow-lg" style={{ bottom: "60px", left: "10px", zIndex: 1000, maxWidth: "220px" }}>
            <div className="d-flex flex-wrap gap-1">
              {["😀", "😂", "😍", "👍", "🔥", "❤️", "👏", "🎉", "😢", "😮", "🙌", "✨", "🌟", "😎", "🤔", "💯"].map(emoji => (
                <button 
                  key={emoji} 
                  className="btn btn-sm btn-outline-light p-1 border-0" 
                  onClick={() => { setcommentvalue(prev => prev + emoji); setShowEmojiPicker(false); }}
                  style={{ fontSize: "16px" }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {isRecording ? (
          <div className="d-flex align-items-center justify-content-between w-100 px-2 text-danger">
            <span className="d-flex align-items-center gap-2" style={{ fontSize: "13px" }}>
              <span className="spinner-grow spinner-grow-sm text-danger" role="status"></span>
              <strong>Recording: {formatDuration(duration)}</strong>
            </span>
            <button className="btn btn-sm btn-danger rounded-circle p-1" onClick={stopRecording}>
              <FaStop size={10} />
            </button>
          </div>
        ) : audioBlob ? (
          <div className="d-flex align-items-center justify-content-between w-100 gap-2">
            <audio src={URL.createObjectURL(audioBlob)} controls style={{ height: '28px', flexGrow: 1, maxWidth: "160px" }} />
            <button className="btn btn-sm btn-danger p-1 rounded-circle" onClick={discardRecording} disabled={sendingVoice}>
              <FaTrash size={10} />
            </button>
            <button className="btn btn-sm btn-primary px-2" onClick={sendVoiceComment} disabled={sendingVoice} style={{ fontSize: "12px" }}>
              {sendingVoice ? "Posting..." : "Send"}
            </button>
          </div>
        ) : (
          <>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className='btn btn-outline-light p-2 rounded-circle border-0 d-flex align-items-center justify-content-center'
                onClick={() => setShowEmojiPicker(s => !s)}
                title="Add Emoji"
              >
                😊
              </button>
              <button
                type="button"
                className='btn btn-outline-light p-2 rounded-circle border-0 d-flex align-items-center justify-content-center'
                onClick={() => setShowGifPicker(s => !s)}
                title="Add GIF"
              >
                GIF
              </button>
            </div>
            <input 
              type='text' 
              className='form-control bg-dark text-white border-0' 
              value={commentvalue} 
              onChange={(e) => setcommentvalue(e.target.value)}
              placeholder="Write a comment..."
              style={{ fontSize: "13px" }}
            />
            <button className='btn btn-outline-light p-2 rounded-circle border-0 d-flex align-items-center justify-content-center' onClick={startRecording} title="Record voice comment">
              <FaMicrophone size={14} />
            </button>
            <button className='btn btn-primary btn-sm px-3' onClick={() => sendComment()}>Send</button>

            {showEmojiPicker && (
              <div ref={emojiPickerRoot} className="position-absolute" style={{ bottom: '70px', left: '10px', zIndex: 1100 }} />
            )}

            {showGifPicker && (
              <div className="position-absolute bg-dark p-2 rounded" style={{ bottom: '70px', left: '60px', zIndex: 1100, width: 360, maxHeight: 340, overflow: 'auto' }}>
                <Grid gf={gf} onGifClick={(gif, e) => { e.preventDefault(); handleGifSelect(gif); }} width={320} columns={3} gutter={6} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Comment;