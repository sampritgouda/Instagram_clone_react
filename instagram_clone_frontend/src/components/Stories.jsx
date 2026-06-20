import React, { useEffect, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import DeleteButton from './DeleteButton';
import { API_BASE_URL } from '../config';

function Stories() {
  const navigate = useNavigate()
  const [usersStories, setUsersStories] = useState([]);
  const [storyviewcount, setstoryviewcount] = useState({})
  const [currentUserIndex, setCurrentUserIndex] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(null);
  const [storySeen, setStorySeen] = useState({});

  const token = localStorage.getItem("token");

  
const navigateUserProfile = (id) =>{
    navigate(`/profile/${id}`)
  }

const opencreateStory = () =>navigate('/create/story') 

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/stories`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
  setUsersStories(data);

  const initialViewCount = {};
  const initialSeen = {};
  data.forEach(user => {
    if (user) {
      user.stories.forEach(story => {
        if (story) {
          initialViewCount[story.id] = story.seenCount;
          initialSeen[story.id] = story.seen;  // from backend
        }
      });
    }
  });

  setstoryviewcount(initialViewCount);
  setStorySeen(initialSeen);
})

      .catch(err => console.error("Error fetching stories:", err));
  }, [token]);

  const markStoryAsSeen = (userIndex, storyIndex) => {
  const storyId = usersStories[userIndex].stories[storyIndex].id;

  // Only mark if not already seen
  if (storySeen[storyId]) return;

  fetch(`${API_BASE_URL}/api/stories/${storyId}/seen`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to mark story as seen");
      console.log(`Story ${storyId} marked as seen`);

      setstoryviewcount(prev => ({
        ...prev,
        [storyId]: (prev[storyId] || 0) + 1
      }));

      setStorySeen(prev => ({
        ...prev,
        [storyId]: true
      }));
    })
    .catch(err => console.error(err));
};


  const openStory = (userIdx) => {
    setCurrentUserIndex(userIdx);
    setCurrentStoryIndex(0);
  };

  const closeStory = () => {
    setCurrentUserIndex(null);
    setCurrentStoryIndex(null);
  };

  const nextStory = () => {
    if (currentUserIndex === null || currentStoryIndex === null) return;

    const userStories = usersStories[currentUserIndex].stories;
    if (currentStoryIndex + 1 < userStories.length) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex + 1 < usersStories.length) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (currentUserIndex === null || currentStoryIndex === null) return;

    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      const prevUserStories = usersStories[currentUserIndex - 1].stories;
      setCurrentUserIndex(currentUserIndex - 1);
      setCurrentStoryIndex(prevUserStories.length - 1);
    }
  };

  
    const viewedColor = '#0d6efd'; // Bootstrap primary blue
    const notViewedColor = '#ccc'; // light grey
    

  return (
    <div>
      {/* Stories Row */}
      <div className="d-flex overflow-auto py-2 mb-3 mt-4">
  {usersStories.map((user, idx) => {
    if (user === null) {
      // Show Add Story bubble
      return (
        <div
          key={"add-story"}
          className="position-relative d-flex flex-column align-items-center me-3 story-bubble"
          style={{ cursor: "pointer", width: 80, height: 120 }}
          onClick={() => opencreateStory()} // Replace with actual add story action
          title="Add Story"
        >
          {/* Circle with plus sign */}
          <div
            className="rounded-circle bg-dark d-flex justify-content-center align-items-center"
            style={{
              width: 76,
              height: 76,
              border: "2px solid #0d6efd",
              position: "relative",
              zIndex: 1
            }}
          >
            <span style={{ fontSize: 32, color: "#fff" }}>+</span>
          </div>
          {/* Label */}
          <span
            className="text-white mt-2 text-truncate d-block text-center"
            style={{ width: 72, fontSize: "12px", fontWeight: "600" }}
          >
            Your Story
          </span>
        </div>
      );
    }

    // Normal story
    return (
      <div
        key={user.userId}
        className="position-relative d-flex flex-column align-items-center me-3 story-bubble"
        style={{ cursor: "pointer", width: 80, height: 120 }}
        onClick={() => openStory(idx)}
        title={`${user.username} ${user.hasUnseen ? "(New)" : ""}`}
      >
       

        {/* Profile image */}
        <div className='d-flex justify-content-center align-items-center p-2 rounded-circle' style={{border: user.hasUnseen ? "3px solid blue" : "none",height:82,width:82}}>
        <img
          src={user.profileImage}
          alt={user.username}
          className="rounded-circle"
          style={{
            width: 72,
            height: 72,
            objectFit: "cover",
            position: "relative",
            zIndex: 1,
            
          }}
        />
        </div>
        {/* Username */}
        <span
          className="text-white mt-2 text-truncate d-block text-center"
          style={{ width: 72, fontSize: "12px", fontWeight: "600" }}
        >
          {user.username}
        </span>
      </div>
    );
  })}
</div>


      {/* Story Viewer Modal */}
      {currentUserIndex !== null && currentStoryIndex !== null && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex gap-4 justify-content-center align-items-center"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 1050,
            position:"relative"
          }}
          
        >
          <button className="btn btn-outline-light" onClick={prevStory} disabled={currentUserIndex === 0 && currentStoryIndex === 0}>Prev</button>
          <div
            className="p-3 bg-dark rounded gap-2"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="btn btn-danger position-absolute top-0 end-0 m-2"
              onClick={closeStory}
              aria-label="Close"
            >
              ✕
            </button>

            <div className='d-flex align-items-center gap-3 w-100'>
              <img className='rounded-circle' style={{width:'40px',height:'40px'}} src={usersStories[currentUserIndex].profileImage}/>
              <h5 style={{cursor:"pointer",fontFamily:"serif"}} className="text-white m-0" onClick={()=>navigateUserProfile(usersStories[currentUserIndex].userId)}>
                {usersStories[currentUserIndex].username}</h5>
              <div className='d-flex ms-4 align-items-center gap-1'>
                <FaEye color="white" />
              <span className="text-white" style={{fontSize:"12px"}}>
                {storyviewcount[usersStories[currentUserIndex].stories[currentStoryIndex].id] || 0}
              </span>
              </div>
              {console.log(usersStories[currentUserIndex].own)}
              {usersStories[currentUserIndex].own && (
              <DeleteButton
                id={usersStories[currentUserIndex].stories[currentStoryIndex].id}
                type="stories"   // backend endpoint: /api/stories/{id}
                token={token}
                onDelete={() => {
                  // update UI after successful delete
                  setUsersStories(prev => {
                    const updated = [...prev];
                    updated[currentUserIndex].stories = updated[currentUserIndex].stories.filter(
                      s => s.id !== usersStories[currentUserIndex].stories[currentStoryIndex].id
                    );
                    return updated;
                  });
                  closeStory(); // close modal
                }}
              />
            )}

            </div>

            {usersStories[currentUserIndex].stories[currentStoryIndex].mediaType === "image" ? (
              <img
                src={usersStories[currentUserIndex].stories[currentStoryIndex].mediaUrl}
                alt="Story"
                style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "10px" }}
                onLoad={() => {
                  const storyId = usersStories[currentUserIndex].stories[currentStoryIndex].id;
                  if (!storySeen[storyId]) {
                    markStoryAsSeen(currentUserIndex, currentStoryIndex);
                  }
                }}

              />
            ) : (
              <video
                src={usersStories[currentUserIndex].stories[currentStoryIndex].mediaUrl}
                autoPlay
                loop
                style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "10px" }}
               onLoadedData={() => {
                const storyId = usersStories[currentUserIndex].stories[currentStoryIndex].id;
                if (!storySeen[storyId]) {
                  markStoryAsSeen(currentUserIndex, currentStoryIndex);
                }
              }}

              />
            )}

            
            
          </div>
              <button className="btn btn-outline-light" onClick={nextStory}>Next</button>
        </div>
      )}
    </div>
  );
}

export default Stories;
