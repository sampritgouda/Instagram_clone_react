import React, { useEffect, useState } from 'react';

const ProfileHeader = ({ user }) => {
  const [following, setFollowing] = useState(user.followed);
  const [requested, setRequested] = useState(user.requested);
  const [followMsg, setFollowMsg] = useState('');

  const token = localStorage.getItem('token');

  const followUser = async (id) => {
    let resp;

    if (!following && !requested) {
      // Public profile → follow directly
      
        resp = await fetch(`http://localhost:8080/api/user/follow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });
        } 
    // Already following → unfollow
    else {
      resp = await fetch(`http://localhost:8080/api/user/follow`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

    }

    if(resp.ok)
    {
        if(!following && !requested)
        {
           !user.isPrivate && setFollowing(true)
           user.isPrivate && setRequested(true)
        }
        requested && setRequested(false)
        following && setFollowing(false)
        
    }
  };

  // Update button label
  useEffect(() => {
    if (following) setFollowMsg('unfollow');
    else if (requested) setFollowMsg('requested');
    else setFollowMsg('follow');
  }, [following, requested]);

  return (
    <div>
      
        {!user.own && (
          <button
            className="btn text-white border-white py-0"
            style={{ cursor: 'pointer', height: '30px' }}
            onClick={() => followUser(user.id)}
          >
            {followMsg}
          </button>
        )}
      
    </div>
  );
};

export default ProfileHeader;
