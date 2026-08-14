import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';

const ProfileHeader = ({ user, isMobile }) => {
  const [following, setFollowing] = useState(false);
  const [requested, setRequested] = useState(false);
  const [followMsg, setFollowMsg] = useState('follow');

  const token = localStorage.getItem('token');
  const { addToast } = useToast();

  const followUser = async (id) => {
    try {
      let resp;

      if (!following && !requested) {
        // Not following → send follow request
        resp = await fetch(`${API_BASE_URL}/api/user/follow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });
      } else {
        // Already following or requested → unfollow/cancel request
        resp = await fetch(`${API_BASE_URL}/api/user/follow`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });
      }

      if (resp.ok) {
        if (!following && !requested) {
          if (user.private) {
            setRequested(true);  // private profile → request sent
            addToast(`Follow request sent to @${user.username}`, 'success');
          } else {
            setFollowing(true);  // public profile → follow directly
            addToast(`Now following @${user.username}`, 'success');
          }
        } else {
          setFollowing(false);
          setRequested(false);
          addToast(`Unfollowed @${user.username}`, 'info');
        }
      } else {
        addToast('Failed to process follow request', 'error');
      }
    } catch (err) {
      addToast('Failed to process request due to a network error', 'error');
    }
  };

  useEffect(() => {
    setFollowing(user.followed || false);
    setRequested(user.requested || false);
  }, [user]);

  useEffect(() => {
    if (following) setFollowMsg('following');
    else if (requested) setFollowMsg('requested');
    else setFollowMsg('follow');
  }, [following, requested]);

  return (
    <div className={isMobile ? "w-100" : ""}>
      {!user.own && (
        <button
          className={`btn fw-semibold px-4 py-1.5 rounded-3 transition-all text-center border-0 ${
            isMobile ? "w-100 py-2 text-white" : "text-white"
          }`}
          style={{ 
            cursor: 'pointer', 
            fontSize: '13.5px', 
            minWidth: isMobile ? '100%' : '110px',
            height: isMobile ? '38px' : '32px',
            background: followMsg === 'follow' ? '#0095f6' : 'rgba(255,255,255,0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => followUser(user.id)}
        >
          {followMsg === 'follow' ? 'Follow' : followMsg === 'following' ? 'Following' : 'Requested'}
        </button>
      )}
    </div>
  );
};

export default ProfileHeader;
