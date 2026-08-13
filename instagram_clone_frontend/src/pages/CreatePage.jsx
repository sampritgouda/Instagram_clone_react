import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useUpload } from '../context/UploadContext'; 
import { useToast } from '../context/ToastContext';
import SideComponent from '../components/SideComponent';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { createPicker } from 'picmo'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { Grid } from '@giphy/react-components'

function CreatePage() {
  const { select } = useParams();
  const [activeTab, setActiveTab] = useState(select ? select : 'post');
  const [caption, setCaption] = useState('');
  const [mood, setMood] = useState('All');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Canvas Cards States
  const [creationType, setCreationType] = useState('file'); // 'file' or 'canvas'
  const GRADIENTS = [
    { name: 'Sunset Gold', style: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
    { name: 'Pink Dream', style: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Lavender Calm', style: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)' },
    { name: 'Sea Wave', style: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' },
    { name: 'Warm Sunset', style: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Neon Blue', style: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
  ];
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].style);

  const { setUploadStatus } = useUpload(); 
  const { addToast } = useToast();
  const token = localStorage.getItem("token");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY || '');
  const emojiPickerRoot = React.useRef(null);
  const emojiPickerInstance = React.useRef(null);

  const handleTabChange = (tab) => {
    if (loading) return;
    setActiveTab(tab);
    setCaption('');
    setMood('All');
    setFile(null);
    setCreationType('file');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (creationType === 'file' && !file) {
      addToast('Please select a file to upload.', 'warning');
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
      // Canvas card: no media file, send background gradient styles and text in caption
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      let result = {};
      try {
        result = await response.json();
      } catch (err) {}

      if (response.ok) {
        addToast(`${label} uploaded successfully!`, 'success');
        setUploadStatus(`${activeTab} uploaded successfully!`);
        
        // Clear fields
        setCaption('');
        setMood('All');
        setFile(null);
        
        // Reset file input element manually
        const fileInput = document.getElementById('createFileInput');
        if (fileInput) fileInput.value = '';

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

  // manage picmo picker lifecycle for captions
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (showEmojiPicker && emojiPickerRoot.current && !emojiPickerInstance.current) {
      emojiPickerInstance.current = createPicker({ rootElement: emojiPickerRoot.current });
      emojiPickerInstance.current.addEventListener('emoji:select', (ev) => {
        const detail = ev.detail || ev;
        const ch = detail?.emoji || detail?.native || '';
        setCaption(prev => prev + ch);
        setShowEmojiPicker(false);
      });
    }
    if (!showEmojiPicker && emojiPickerInstance.current) {
      try { emojiPickerInstance.current.destroy(); } catch (e) {}
      emojiPickerInstance.current = null;
      if (emojiPickerRoot.current) emojiPickerRoot.current.innerHTML = '';
    }
    return () => {
      if (emojiPickerInstance.current) {
        try { emojiPickerInstance.current.destroy(); } catch (e) {}
        emojiPickerInstance.current = null;
      }
    };
  }, [showEmojiPicker]);

  return (
    <div className='d-flex'>
      <SideComponent />
      <div className="container-fluid">
        <div className="row bg-black">
          <div className="col-md-9 col-lg-10 bg-dark text-white min-vh-100 p-4">
            <h3 className="mb-4">Create</h3>

            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'post' ? 'active' : ''}`}
                  onClick={() => handleTabChange('post')}
                  disabled={loading}
                >
                  Post
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'story' ? 'active' : ''}`}
                  onClick={() => handleTabChange('story')}
                  disabled={loading}
                >
                  Story
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'reel' ? 'active' : ''}`}
                  onClick={() => handleTabChange('reel')}
                  disabled={loading}
                >
                  Reel
                </button>
              </li>
            </ul>

            <div className="card bg-secondary p-4">
              {/* Type Switcher for Posts */}
              {activeTab === 'post' && (
                <div className="btn-group mb-4 w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${creationType === 'file' ? 'btn-light' : 'btn-outline-light'}`}
                    disabled={loading}
                    onClick={() => setCreationType('file')}
                  >
                    📷 Photo / Video Post
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${creationType === 'canvas' ? 'btn-light' : 'btn-outline-light'}`}
                    disabled={loading}
                    onClick={() => setCreationType('canvas')}
                  >
                    🎨 Canvas Card (Text Post)
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {creationType === 'canvas' && activeTab === 'post' ? (
                  /* CANVAS CARD CREATION LAYOUT */
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Card Text</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        placeholder="Write your quote or announcement here..."
                        value={caption}
                        disabled={loading}
                        onChange={(e) => setCaption(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Select Gradient Backdrop</label>
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
                              border: selectedGradient === grad.style ? '3px solid white' : '1px solid rgba(255,255,255,0.3)',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                              cursor: 'pointer'
                            }}
                            title={grad.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-bold">Live Preview</label>
                      <div 
                        className="d-flex justify-content-center align-items-center p-4 rounded text-center text-white"
                        style={{ 
                          height: '250px', 
                          background: selectedGradient,
                          fontSize: '18px',
                          fontWeight: 'bold',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          fontFamily: 'system-ui, sans-serif'
                        }}
                      >
                        {caption ? `"${caption}"` : 'Your text here...'}
                      </div>
                    </div>
                  </>
                ) : (
                  /* STANDARD FILE POST LAYOUT */
                  <>
                    {(activeTab === 'post' || activeTab === 'reel') && (
                      <div className="mb-3">
                        <label className="form-label fw-bold">Caption</label>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className='btn btn-outline-light p-2 rounded-circle border-0'
                            onClick={() => setShowEmojiPicker(s => !s)}
                            title="Add Emoji"
                          >
                            😊
                          </button>
                          <button
                            type="button"
                            className='btn btn-outline-light p-2 rounded-circle border-0'
                            onClick={() => setShowGifPicker(s => !s)}
                            title="Add GIF"
                          >
                            GIF
                          </button>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Write a caption..."
                            value={caption}
                            disabled={loading}
                            onChange={(e) => setCaption(e.target.value)}
                          />
                        </div>
                        {showEmojiPicker && (
                          <div style={{ position: 'relative' }}>
                            <div ref={emojiPickerRoot} style={{ position: 'absolute', zIndex: 1200 }} />
                          </div>
                        )}
                        {showGifPicker && (
                          <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', zIndex: 1200, width: 360, maxHeight: 340, overflow: 'auto' }}>
                              <Grid gf={gf} onGifClick={(gif, e) => { e.preventDefault(); const url = gif.images?.original?.url || gif.url; setCaption(prev => prev ? prev + ' ' + url : url); setShowGifPicker(false); }} width={320} columns={3} gutter={6} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        {activeTab === 'reel'
                          ? 'Upload Reel Video'
                          : 'Upload Image or Video'}
                      </label>
                      <input
                        id="createFileInput"
                        type="file"
                        className="form-control"
                        disabled={loading}
                        accept={
                          activeTab === 'reel'
                            ? 'video/*'
                            : 'image/*,video/*'
                        }
                        onChange={handleFileChange}
                        required
                      />
                    </div>
                  </>
                )}

                {/* Shared Mood Selector */}
                {(activeTab === 'post' || activeTab === 'reel') && (
                  <div className="mb-4">
                    <label className="form-label fw-bold">Select Mood Vibe</label>
                    <select
                      className="form-select bg-black text-white"
                      value={mood}
                      disabled={loading}
                      onChange={(e) => setMood(e.target.value)}
                    >
                      <option value="All">None / Default 🌐</option>
                      <option value="Chill">Chill ☕</option>
                      <option value="Motivated">Motivated 💪</option>
                      <option value="Funny">Funny 😂</option>
                      <option value="Artistic">Artistic 🎨</option>
                      <option value="Focused">Focused 📚</option>
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-light" disabled={loading}>
                  {loading ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Uploading...
                    </span>
                  ) : (
                    `Upload ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CreatePage;
