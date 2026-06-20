import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Sidebar from '../components/Sidebar';
import { useUpload } from '../context/UploadContext'; 
import SideComponent from '../components/SideComponent';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function CreatePage() {
  const {select} = useParams()
  const [activeTab, setActiveTab] = useState(select ? select : 'post');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

    const { setUploadStatus } = useUpload(); 
  const token=localStorage.getItem("token")
console.log(token)


  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCaption('');
    setFile(null);
    setMessage('');
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    console.log(e.target.files)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select an image or video.');
      return;
    }

    const formData = new FormData();
   formData.append('media', file); 
    if (caption && activeTab !== 'story') {
      formData.append('caption', caption);
    }

    let endpoint = '';
    if (activeTab === 'post') endpoint = '/api/posts/add';
    else if (activeTab === 'story') endpoint = '/api/stories/add';
    else if (activeTab === 'reel') endpoint = '/api/reels/add';

    try {
    console.log(endpoint)

    setUploadStatus(`Uploading ${activeTab}...`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
         headers: {
    'Authorization': `Bearer ${token}` // 🔐 Attach JWT token here
  },
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
       setMessage('Upload successful!');
        setUploadStatus(`${activeTab} uploaded successfully!`);
        
        // Clear fields after 2 seconds
        setTimeout(() => {
          setUploadStatus(null);
          setCaption('');
          setFile(null);
        }, 2000);
      } else {
        setMessage(result.message || 'Upload failed.');
      }
    } catch (error) {
      console.error(error);
      setMessage('Server error.');
    }
    
  };

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
              >
                Post
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'story' ? 'active' : ''}`}
                onClick={() => handleTabChange('story')}
              >
                Story
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'reel' ? 'active' : ''}`}
                onClick={() => handleTabChange('reel')}
              >
                Reel
              </button>
            </li>
          </ul>

          <div className="card bg-secondary p-4" >
            <form onSubmit={handleSubmit}>
              {(activeTab === 'post' || activeTab === 'reel') && (
                <div className="mb-3">
                  <label className="form-label">Caption</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  {activeTab === 'reel'
                    ? 'Upload Reel Video'
                    : 'Upload Image or Video'}
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept={
                    activeTab === 'reel'
                      ? 'video/*'
                      : 'image/*,video/*'
                  }
                  onChange={handleFileChange}
                />
              </div>

              <button type="submit" className="btn btn-light">
                Upload {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </button>
            </form>

            {message && (
              <div className="mt-3 alert alert-info py-2">{message}</div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default CreatePage;
