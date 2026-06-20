import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';

const ProfileHeader = ({ user }) => {
  const [following, setFollowing] = useState(false);
  const [requested, setRequested] = useState(false);
  const [followMsg, setFollowMsg] = useState('follow');

  const token = localStorage.getItem('token');

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
          } else {
            setFollowing(true);  // public profile → follow directly
          }
        } else {

          setFollowing(false);
          setRequested(false);
        }
      }
    } catch (err) {
      console.error("Follow/unfollow error:", err);
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
    <div>
      {!user.own && (
        <button
          className="btn text-white  py-0"
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
