import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUpload } from '../context/UploadContext';
import { useToast } from '../context/ToastContext';
import SideComponent from '../components/SideComponent';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { createPicker } from 'picmo';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { FaCloudUploadAlt, FaTrashAlt, FaSmile, FaFilm, FaImage, FaBolt } from 'react-icons/fa';

function CreatePage() {
  const { select } = useParams();
  const [activeTab, setActiveTab] = useState(select ? select : 'post');
  const [caption, setCaption] = useState('');
  const [mood, setMood] = useState('All');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' | 'video'
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Canvas Cards States
  const [creationType, setCreationType] = useState('file'); // 'file' or 'canvas'
  const GRADIENTS = [
    { name: 'Sunset Gold', style: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
    { name: 'Pink Dream', style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Lavender Calm', style: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)' },
    { name: 'Sea Wave', style: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
    { name: 'Warm Sunset', style: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Neon Blue', style: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Midnight Purple', style: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Dark Cyber', style: 'linear-gradient(135deg, #434343 0%, #000000 100%)' }
  ];
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].style);

  const { setUploadStatus } = useUpload();
  const { addToast } = useToast();
  const token = localStorage.getItem('token');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || '');
  const emojiPickerRoot = useRef(null);
  const emojiPickerInstance = useRef(null);

  // ── Handle file selection & create object URL preview ──
  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    const isVid = selectedFile.type.startsWith('video/');
    setFileType(isVid ? 'video' : 'image');

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setFileType(null);
    const fileInput = document.getElementById('createFileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleTabChange = (tab) => {
    if (loading) return;
    setActiveTab(tab);
    setCaption('');
    setMood('All');
    clearSelectedFile();
    setCreationType('file');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (creationType === 'file' && !file) {
      addToast('Please select an image or video to upload.', 'warning');
      return;
    }
    if (creationType === 'canvas' && (!caption || caption.trim() === '')) {
      addToast('Please write some text for your canvas card.', 'warning');
      return;
    }

    setLoading(true);
    const label = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
    addToast(`Uploading your ${activeTab}...`, 'info');
    setUploadStatus(`Uploading ${activeTab}...`);

    const formData = new FormData();
    if (creationType === 'file') {
      formData.append('media', file);
      if (caption && activeTab !== 'story') {
        formData.append('caption', caption);
      }
    } else {
      formData.append('caption', caption);
      formData.append('canvasGradient', selectedGradient);
    }

    if (mood && activeTab !== 'story') {
      formData.append('mood', mood);
    }

    let endpoint = '';
    if (activeTab === 'post') endpoint = '/api/posts/add';
    else if (activeTab === 'story') endpoint = '/api/stories/add';
    else if (activeTab === 'reel') endpoint = '/api/reels/add';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      let result = {};
      try { result = await response.json(); } catch (_) {}

      if (response.ok) {
        addToast(`${label} uploaded successfully!`, 'success');
        setUploadStatus(`${activeTab} uploaded successfully!`);

        setCaption('');
        setMood('All');
        clearSelectedFile();

        setTimeout(() => {
          setUploadStatus(null);
        }, 2000);
      } else {
        addToast(result.message || 'Upload failed.', 'error');
        setUploadStatus(null);
      }
    } catch (error) {
      addToast('Upload failed due to network error.', 'error');
      setUploadStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Picmo emoji picker lifecycle
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (showEmojiPicker && emojiPickerRoot.current && !emojiPickerInstance.current) {
      emojiPickerInstance.current = createPicker({ rootElement: emojiPickerRoot.current });
      emojiPickerInstance.current.addEventListener('emoji:select', (ev) => {
        const detail = ev.detail || ev;
        const ch = detail?.emoji || detail?.native || '';
        setCaption((prev) => prev + ch);
        setShowEmojiPicker(false);
      });
    }
    if (!showEmojiPicker && emojiPickerInstance.current) {
      try { emojiPickerInstance.current.destroy(); } catch (_) {}
      emojiPickerInstance.current = null;
      if (emojiPickerRoot.current) emojiPickerRoot.current.innerHTML = '';
    }
    return () => {
      if (emojiPickerInstance.current) {
        try { emojiPickerInstance.current.destroy(); } catch (_) {}
        emojiPickerInstance.current = null;
      }
    };
  }, [showEmojiPicker]);

  return (
    <div className="d-flex w-100 create-page-root" style={{ background: '#0a0a0a' }}>
      <SideComponent />

      {/* Main Creation Wrapper */}
      <div className="flex-grow-1 d-flex flex-column create-main-wrapper text-white" style={{ background: 'linear-gradient(135deg, #0d0d0d 0%, #121212 100%)', overflow: 'hidden' }}>

        <form onSubmit={handleSubmit} className="d-flex flex-column h-100 w-100">

          {/* ── FIXED HEADER & TABS (Pinned at Top) ── */}
          <div
            className="p-3 border-bottom border-secondary border-opacity-25"
            style={{
              background: 'rgba(18, 18, 18, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            <div className="mx-auto" style={{ maxWidth: '720px' }}>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h4 className="fw-bold text-white mb-0" style={{ letterSpacing: '0.5px', fontFamily: "'Inter', sans-serif" }}>
                  Create Content
                </h4>
                <span className="badge bg-danger rounded-pill px-3 py-1" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                  {activeTab.toUpperCase()}
                </span>
              </div>

              {/* Navigation Tabs */}
              <div className="d-flex gap-2 p-1 rounded-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { id: 'post', label: 'Post', icon: <FaImage size={14} /> },
                  { id: 'story', label: 'Story', icon: <FaBolt size={14} /> },
                  { id: 'reel', label: 'Reel', icon: <FaFilm size={14} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    disabled={loading}
                    className="flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2 px-3 border-0 rounded-2 text-white fw-semibold"
                    style={{
                      fontSize: '13px',
                      background: activeTab === tab.id
                        ? 'linear-gradient(135deg, #e05d5d, #c0392b)'
                        : 'transparent',
                      color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: activeTab === tab.id ? '0 4px 15px rgba(224,93,93,0.35)' : 'none',
                    }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Type Switcher for Posts */}
              {activeTab === 'post' && (
                <div className="d-flex gap-2 p-1 rounded-2 mt-2" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    type="button"
                    className="flex-grow-1 border-0 py-1.5 rounded-2 text-white fw-semibold"
                    style={{
                      fontSize: '12px',
                      background: creationType === 'file' ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: creationType === 'file' ? '#fff' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.2s',
                    }}
                    disabled={loading}
                    onClick={() => setCreationType('file')}
                  >
                    📷 Photo / Video
                  </button>
                  <button
                    type="button"
                    className="flex-grow-1 border-0 py-1.5 rounded-2 text-white fw-semibold"
                    style={{
                      fontSize: '12px',
                      background: creationType === 'canvas' ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: creationType === 'canvas' ? '#fff' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.2s',
                    }}
                    disabled={loading}
                    onClick={() => setCreationType('canvas')}
                  >
                    🎨 Canvas Card
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── MIDDLE SCROLLABLE BODY CONTENT ── */}
          <div className="flex-grow-1 overflow-auto p-3 p-md-4 create-body-scroll" style={{ scrollbarWidth: 'none' }}>
            <div className="mx-auto" style={{ maxWidth: '720px' }}>

              {creationType === 'canvas' && activeTab === 'post' ? (
                /* ── CANVAS CARD FLOW ── */
                <div className="d-flex flex-column gap-3">

                  {/* 1. Live Canvas Gradient Preview (FIRST) */}
                  <div>
                    <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>Live Canvas Preview</label>
                    <div
                      className="w-100 d-flex align-items-center justify-content-center p-4 rounded-4 text-center text-white position-relative shadow-lg"
                      style={{
                        height: '240px',
                        background: selectedGradient,
                        fontSize: '20px',
                        fontWeight: '700',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        borderRadius: '16px',
                      }}
                    >
                      {caption ? `"${caption}"` : 'Your quote or text here…'}
                    </div>
                  </div>

                  {/* 2. Card Text Input (SECOND) */}
                  <div>
                    <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>Card Text</label>
                    <textarea
                      className="form-control text-white border-0"
                      rows={3}
                      placeholder="Write your quote or announcement here..."
                      value={caption}
                      disabled={loading}
                      onChange={(e) => setCaption(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        padding: '14px',
                        fontSize: '14px',
                      }}
                      required
                    />
                  </div>

                  {/* 3. Select Gradient Backdrop (THIRD) */}
                  <div>
                    <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>Select Gradient Backdrop</label>
                    <div className="d-flex gap-2 flex-wrap">
                      {GRADIENTS.map((grad) => (
                        <button
                          key={grad.name}
                          type="button"
                          className="rounded-circle p-0"
                          onClick={() => setSelectedGradient(grad.style)}
                          disabled={loading}
                          style={{
                            width: '36px',
                            height: '36px',
                            background: grad.style,
                            border: selectedGradient === grad.style ? '3px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                            boxShadow: selectedGradient === grad.style ? '0 0 12px rgba(255,255,255,0.4)' : 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            transform: selectedGradient === grad.style ? 'scale(1.1)' : 'scale(1)',
                          }}
                          title={grad.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 4. Mood Selector (FOURTH) */}
                  <div>
                    <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>Select Mood Vibe</label>
                    <select
                      className="form-select text-white border-0"
                      value={mood}
                      disabled={loading}
                      onChange={(e) => setMood(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px' }}
                    >
                      <option value="All" className="bg-dark">None / Default 🌐</option>
                      <option value="Chill" className="bg-dark">Chill ☕</option>
                      <option value="Motivated" className="bg-dark">Motivated 💪</option>
                      <option value="Funny" className="bg-dark">Funny 😂</option>
                      <option value="Artistic" className="bg-dark">Artistic 🎨</option>
                      <option value="Focused" className="bg-dark">Focused 📚</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* ── STANDARD FILE UPLOAD FLOW ── */
                <div className="d-flex flex-column gap-3">

                  {/* 1. File Upload Dropzone (FIRST) */}
                  <div>
                    <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>
                      {activeTab === 'reel' ? 'Upload Reel Video' : 'Upload Image or Video'}
                    </label>

                    {!previewUrl ? (
                      <div
                        className={`d-flex flex-column align-items-center justify-content-center p-4 rounded-4 text-center ${dragOver ? 'border-primary' : ''}`}
                        style={{
                          border: '2px dashed rgba(255,255,255,0.15)',
                          background: dragOver ? 'rgba(224,93,93,0.1)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          minHeight: '160px',
                          borderRadius: '16px',
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('createFileInput')?.click()}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center mb-2 rounded-circle"
                          style={{
                            width: '48px',
                            height: '48px',
                            background: 'rgba(224,93,93,0.15)',
                            color: '#e05d5d',
                          }}
                        >
                          <FaCloudUploadAlt size={24} />
                        </div>
                        <p className="fw-semibold mb-1" style={{ fontSize: '14px' }}>
                          Click to upload or drag & drop
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: '12px' }}>
                          {activeTab === 'reel' ? 'MP4, MOV (Video only)' : 'PNG, JPG, MP4, MOV'}
                        </p>
                        <input
                          id="createFileInput"
                          type="file"
                          className="d-none"
                          disabled={loading}
                          accept={activeTab === 'reel' ? 'video/*' : 'image/*,video/*'}
                          onChange={handleFileChange}
                        />
                      </div>
                    ) : (
                      /* File Selected Badge Bar with truncate safety */
                      <div className="d-flex align-items-center justify-content-between p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', gap: '12px' }}>
                        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
                          <span className="badge bg-danger flex-shrink-0" style={{ fontSize: '11px' }}>{fileType?.toUpperCase()}</span>
                          <span className="text-white-50 text-truncate" style={{ fontSize: '13px', maxWidth: '160px' }}>
                            {file?.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger border-0 d-flex align-items-center gap-1 flex-shrink-0"
                          onClick={clearSelectedFile}
                          style={{ fontSize: '12px' }}
                        >
                          <FaTrashAlt size={12} /> Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. LIVE MEDIA PREVIEW (SECOND - Right below file upload) */}
                  {previewUrl && (
                    <div>
                      <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>
                        Media Preview ({activeTab.toUpperCase()})
                      </label>
                      <div
                        className="w-100 d-flex align-items-center justify-content-center rounded-4 overflow-hidden position-relative shadow-lg"
                        style={{
                          minHeight: '260px',
                          maxHeight: '360px',
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                        }}
                      >
                        {fileType === 'video' ? (
                          <video
                            src={previewUrl}
                            controls
                            autoPlay
                            muted
                            loop
                            playsInline
                            style={{
                              width: '100%',
                              height: activeTab === 'story' || activeTab === 'reel' ? '340px' : '260px',
                              objectFit: activeTab === 'story' || activeTab === 'reel' ? 'cover' : 'contain',
                            }}
                          />
                        ) : (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            style={{
                              width: '100%',
                              height: activeTab === 'story' ? '340px' : '260px',
                              objectFit: activeTab === 'story' ? 'cover' : 'contain',
                            }}
                          />
                        )}

                        {/* Caption overlay in preview */}
                        {caption && (
                          <div
                            className="position-absolute bottom-0 start-0 w-100 p-3 text-white"
                            style={{
                              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                              fontSize: '13px',
                            }}
                          >
                            <p className="m-0 text-truncate">{caption}</p>
                            {mood && mood !== 'All' && (
                              <span className="badge bg-danger mt-1" style={{ fontSize: '10px' }}>{mood}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Caption Input (THIRD - Below preview) */}
                  {(activeTab === 'post' || activeTab === 'reel') && (
                    <div>
                      <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>Caption</label>
                      <div className="position-relative">
                        <textarea
                          className="form-control text-white border-0"
                          rows={3}
                          placeholder="Write a caption…"
                          value={caption}
                          disabled={loading}
                          onChange={(e) => setCaption(e.target.value)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            padding: '12px 14px',
                            fontSize: '14px',
                          }}
                        />
                        <div className="d-flex gap-2 mt-2">
                          <button
                            type="button"
                            className="btn btn-sm text-white-50 d-flex align-items-center gap-1 p-1 border-0"
                            onClick={() => setShowEmojiPicker((s) => !s)}
                            title="Add Emoji"
                            style={{ fontSize: '13px' }}
                          >
                            <FaSmile color="#ffc107" /> Emoji
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm text-white-50 d-flex align-items-center gap-1 p-1 border-0"
                            onClick={() => setShowGifPicker((s) => !s)}
                            title="Add GIF"
                            style={{ fontSize: '13px' }}
                          >
                            👾 GIF
                          </button>
                        </div>
                      </div>

                      {showEmojiPicker && (
                        <div className="position-relative mt-2" style={{ zIndex: 1200 }}>
                          <div ref={emojiPickerRoot} />
                        </div>
                      )}
                      {showGifPicker && (
                        <div className="position-relative mt-2" style={{ zIndex: 1200 }}>
                          <div style={{ background: '#111', padding: 8, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', maxWidth: 340, maxHeight: 280, overflow: 'auto' }}>
                            <Grid
                              gf={gf}
                              onGifClick={(gif, e) => {
                                e.preventDefault();
                                const url = gif.images?.original?.url || gif.url;
                                setCaption((prev) => (prev ? prev + ' ' + url : url));
                                setShowGifPicker(false);
                              }}
                              width={320}
                              columns={3}
                              gutter={6}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. Mood Selector (FOURTH - Below caption) */}
                  {(activeTab === 'post' || activeTab === 'reel') && (
                    <div>
                      <label className="form-label fw-bold text-white-50" style={{ fontSize: '13px' }}>Select Mood Vibe</label>
                      <select
                        className="form-select text-white border-0"
                        value={mood}
                        disabled={loading}
                        onChange={(e) => setMood(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px' }}
                      >
                        <option value="All" className="bg-dark">None / Default 🌐</option>
                        <option value="Chill" className="bg-dark">Chill ☕</option>
                        <option value="Motivated" className="bg-dark">Motivated 💪</option>
                        <option value="Funny" className="bg-dark">Funny 😂</option>
                        <option value="Artistic" className="bg-dark">Artistic 🎨</option>
                        <option value="Focused" className="bg-dark">Focused 📚</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── FIXED FOOTER BUTTON (Pinned at Bottom) ── */}
          <div
            className="p-3 border-top border-secondary border-opacity-25 d-flex justify-content-center"
            style={{
              background: 'rgba(18, 18, 18, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              flexShrink: 0,
              zIndex: 10,
            }}
          >
            <div className="mx-auto w-100" style={{ maxWidth: '720px' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn text-white fw-bold w-100 py-2.5 rounded-3 d-flex align-items-center justify-content-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #e05d5d, #c0392b)',
                  border: 'none',
                  fontSize: '15px',
                  boxShadow: '0 4px 15px rgba(224,93,93,0.35)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s ease',
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Uploading {activeTab}…
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt size={18} /> Upload {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ── Responsive Styling ── */}
      <style>{`
        .create-page-root {
          height: 100vh;
        }

        @media (max-width: 767.98px) {
          .create-page-root {
            height: calc(100vh - 65px) !important;
            max-height: 90vh !important;
          }
          .create-main-wrapper {
            height: 100% !important;
          }
        }

        .create-body-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default CreatePage;
