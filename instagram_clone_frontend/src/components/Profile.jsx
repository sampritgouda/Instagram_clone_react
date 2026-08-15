import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProfileHeader from './ProfileHeader'
import Follow from './Follow'
import { FaCog, FaSignOutAlt, FaExchangeAlt } from 'react-icons/fa'
import { useUser } from '../context/UserContext'

const Profile = ({ user }) => {
  const [canview, setcanview] = useState(true)
  const [showpopup, setshowpopup] = useState(false)
  const [type, settype] = useState(null)
  const [followercount, setfollowercount] = useState()
  const [followingcount, setfollowingcount] = useState()

  const { logout, setIsSwitcherOpen } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (user.private && !user.followed && !user.own) setcanview(false)
    setfollowercount(user.followerCount)
    setfollowingcount(user.followingCount)
  }, [user])

  const popupdisplay = (poptype) => {
    setshowpopup(true)
    settype(poptype)
  }

  return (
    <div className="container bg-black py-4 px-3 px-md-5">
      {/* ── DESKTOP PROFILE HEADER: Hidden on Mobile ── */}
      <div className="d-none d-md-flex align-items-center gap-5 pb-4 border-bottom border-secondary" style={{ maxWidth: '850px', margin: '0 auto' }}>
        <div className="d-flex justify-content-center align-items-center" style={{ width: '30%', flexShrink: 0 }}>
          <img 
            className="rounded-circle border border-secondary" 
            src={user.profilePicUrl || 'https://ui-avatars.com/api/?background=333&color=fff&name=U'} 
            style={{ width: "150px", height: "150px", objectFit: "cover" }} 
            alt="profile" 
          />
        </div>
        
        <div className="d-flex flex-column gap-3 flex-grow-1">
          <div className="d-flex gap-3 align-items-center">
            <h3 className="text-white mb-0 fw-normal" style={{ fontSize: '28px', letterSpacing: '0.3px', fontFamily: "'Inter', sans-serif" }}>
              {user.username}
            </h3>
            {user.own ? (
              <div className="d-flex align-items-center gap-2">
                <Link 
                  to="/profile/edit"
                  className="btn btn-sm text-white px-3 py-1.5 fw-semibold rounded-3 border-secondary-custom transition-all"
                  style={{ 
                    background: 'rgba(255,255,255,0.1)', 
                    border: '1px solid rgba(255,255,255,0.15)',
                    fontSize: '14px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  Edit profile
                </Link>
                <button 
                  className="btn btn-sm text-white p-2 rounded-3 border-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => setIsSwitcherOpen(true)}
                  title="Switch accounts"
                >
                  <FaExchangeAlt size={16} />
                </button>
                <button 
                  className="btn btn-sm text-white p-2 rounded-3 border-0"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => navigate('/profile/edit')}
                  title="Settings"
                >
                  <FaCog size={16} />
                </button>
                <button 
                  className="btn btn-sm text-danger p-2 rounded-3 border-0"
                  style={{ background: 'rgba(255,0,0,0.15)' }}
                  onClick={() => logout(false)}
                  title="Log out"
                >
                  <FaSignOutAlt size={16} />
                </button>
              </div>
            ) : (
              <ProfileHeader user={user} />
            )}
          </div>
          
          <div className="text-white d-flex gap-4" style={{ fontSize: '16px' }}>
            <div>
              <span className="fw-semibold">{user.postCount}</span> <span className="text-secondary">posts</span>
            </div>
            <div 
              onClick={() => { if (canview) popupdisplay('follower'); }}
              style={{ cursor: canview ? "pointer" : "default" }}
            >
              <span className="fw-semibold">{followercount}</span> <span className="text-secondary">followers</span>
            </div>
            <div 
              onClick={() => { if (canview) popupdisplay('following'); }}
              style={{ cursor: canview ? "pointer" : "default" }}
            >
              <span className="fw-semibold">{followingcount}</span> <span className="text-secondary">following</span>
            </div>
          </div>
          
          <div className="mt-1">
            <p className="text-white mb-1 fw-bold" style={{ fontSize: '15px' }}>{user.fullName || user.username}</p>
            <p className="text-white m-0" style={{ fontSize: '14.5px', whiteSpace: 'pre-wrap', opacity: 0.95 }}>{user.bio}</p>
          </div>
        </div>
      </div>

      {/* ── MOBILE PROFILE HEADER: Hidden on Desktop ── */}
      <div className="d-flex d-md-none flex-column pb-3 border-bottom border-secondary">
        {/* Top section: DP + stats row */}
        <div className="d-flex align-items-center gap-3 w-100">
          <div className="position-relative" style={{ flexShrink: 0 }}>
            <img 
              className="rounded-circle border border-secondary" 
              src={user.profilePicUrl || 'https://ui-avatars.com/api/?background=333&color=fff&name=U'} 
              style={{ width: "77px", height: "77px", objectFit: "cover" }} 
              alt="profile" 
            />
          </div>
          
          {/* Stats columns */}
          <div className="d-flex justify-content-around flex-grow-1 text-center">
            <div className="d-flex flex-column align-items-center">
              <span className="fw-bold text-white" style={{ fontSize: '15px' }}>{user.postCount}</span>
              <span className="text-secondary" style={{ fontSize: '11px', textTransform: 'lowercase' }}>posts</span>
            </div>
            
            <div 
              className="d-flex flex-column align-items-center"
              onClick={() => { if (canview) popupdisplay('follower'); }}
              style={{ cursor: canview ? "pointer" : "default" }}
            >
              <span className="fw-bold text-white" style={{ fontSize: '15px' }}>{followercount}</span>
              <span className="text-secondary" style={{ fontSize: '11px', textTransform: 'lowercase' }}>followers</span>
            </div>
            
            <div 
              className="d-flex flex-column align-items-center"
              onClick={() => { if (canview) popupdisplay('following'); }}
              style={{ cursor: canview ? "pointer" : "default" }}
            >
              <span className="fw-bold text-white" style={{ fontSize: '15px' }}>{followingcount}</span>
              <span className="text-secondary" style={{ fontSize: '11px', textTransform: 'lowercase' }}>following</span>
            </div>
          </div>
        </div>
        
        {/* Bio info */}
        <div className="mt-3 px-1">
          <h6 className="text-white mb-1 fw-bold" style={{ fontSize: '14.5px' }}>{user.fullName || user.username}</h6>
          <p className="text-white m-0" style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap', opacity: 0.95, lineHeight: '1.4' }}>{user.bio}</p>
        </div>

        {/* Action buttons */}
        <div className="px-1 mt-3">
          {user.own ? (
            <div className="d-flex gap-2 w-100">
              <Link 
                to="/profile/edit"
                className="btn text-white flex-grow-1 py-2 fw-semibold text-center border-0 rounded-3"
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  fontSize: '13.5px',
                  letterSpacing: '0.2px'
                }}
              >
                Edit profile
              </Link>

              <button 
                className="btn text-white px-3 py-2 border-0 rounded-3"
                style={{ background: 'rgba(255,255,255,0.1)' }}
                onClick={() => setIsSwitcherOpen(true)}
                title="Switch accounts"
              >
                <FaExchangeAlt size={16} />
              </button>

              <button 
                className="btn text-danger px-3 py-2 border-0 rounded-3 fw-bold"
                style={{ background: 'rgba(255,0,0,0.15)' }}
                onClick={() => logout(false)}
                title="Log out"
              >
                <FaSignOutAlt size={16} />
              </button>
            </div>
          ) : (
            <div className="w-100">
              <ProfileHeader user={user} isMobile={true} />
            </div>
          )}
        </div>
      </div>

      {/* Follow popup */}
      {showpopup && (
        <Follow
          onClose={() => setshowpopup(false)}
          type={type}
          userId={user.id}
        />
      )}
    </div>
  );
}

export default Profile