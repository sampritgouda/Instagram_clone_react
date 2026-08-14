import React, { useEffect, useState } from 'react'
import { FaTimes, FaTimesCircle, FaSearch } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

const Search = ({ onclose }) => {
  const navigate = useNavigate()

  const token = localStorage.getItem("token")
  const [searchVal, setsearchVal] = useState("")
  const [users, setusers] = useState([])

  const navigateprofile = (id) => {
    navigate(`/profile/${id}`)
  }

  const fetchSearch = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/search/${searchVal.trim()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resp.ok) {
        const data = await resp.json()
        setusers(data)
      }
    } catch (err) {
      console.error("Search failed", err)
    }
  }

  useEffect(() => {
    if (searchVal.trim() !== "") {
      fetchSearch();
    } else {
      setusers([]); 
    }
  }, [searchVal]);

  return (
    <>
      {/* ── DESKTOP VIEW: Original Sidebar Layout ── */}
      <div 
        className='d-none d-md-flex flex-column border-end border-secondary position-fixed bg-black serach-container' 
        style={{ width: "300px", height: "100vh", top: 0, left: 0, zIndex: 9999 }}
      >
        <button 
          className='btn position-absolute text-white' 
          style={{ top: 0, right: 0 }}
          onClick={() => onclose()}
        >
          <FaTimesCircle />
        </button>
        
        <h5 className='text-white ps-4 pt-3'>Search</h5>
        
        <div className='px-3 py-5 border-bottom border-secondary position-relative'>
          <input 
            type='text' 
            className='searchbar w-100 rounded p-2' 
            style={{ border: "none", outline: "none", height: "40px" }}
            value={searchVal} 
            onChange={(e) => setsearchVal(e.target.value)} 
          />
          <span 
            className='text-white position-absolute' 
            style={{ right: "30px", top: "50px", cursor: "pointer", opacity: 0.7 }} 
            onClick={() => setsearchVal("")}
          >
            <FaTimes size={15} />
          </span>
        </div>

        <div className='flex-column px-3 py-3 overflow-auto' style={{ scrollbarWidth: 'none' }}>
          {users.map((user, key) => (
            <div 
              className='d-flex gap-4 align-items-center mt-2 py-1 px-3 rounded follow-bar' 
              key={key}
              style={{ cursor: "pointer" }} 
              onClick={() => { navigateprofile(user.id); onclose(); }}
            >
              <img src={user.userprofile} className='rounded-circle' style={{ width: "40px", height: '40px' }} />
              <span className='text-white d-flex align-items-center' style={{ fontFamily: "serif", fontSize: "16px", opacity: 0.8 }}>
                {user.username}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MOBILE VIEW: Immersive Full-Screen overlay (except bottom nav bar) ── */}
      <div 
        className="d-flex d-md-none flex-column position-fixed bg-black w-100" 
        style={{ 
          top: 0, 
          left: 0, 
          height: 'calc(100vh - 65px)', 
          zIndex: 9998, // just below the mobile bottom navigation bar at 9999
          overflowY: 'auto',
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div className="px-4 py-4 w-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="fw-bold text-white mb-0" style={{ letterSpacing: '0.5px' }}>Search</h4>
            <button 
              className="btn btn-link text-white-50 p-2 d-flex align-items-center justify-content-center border-0"
              style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.08)', width: '36px', height: '36px' }}
              onClick={() => onclose()}
            >
              <FaTimes size={16} className="text-white" />
            </button>
          </div>
          
          <div className="position-relative mb-3">
            <input 
              type="text" 
              className="form-control custom-input border-dark-glow text-white w-100 py-2.5 ps-4 pe-5" 
              placeholder="Search username or name..." 
              value={searchVal}
              onChange={(e) => setsearchVal(e.target.value)}
              style={{ fontSize: '15px', borderRadius: '10px' }}
              autoFocus
            />
            {searchVal && (
              <span 
                className="position-absolute end-0 top-50 translate-middle-y me-3 text-secondary" 
                style={{ cursor: "pointer", opacity: 0.7 }} 
                onClick={() => setsearchVal("")}
              >
                <FaTimes size={15} />
              </span>
            )}
          </div>

          <div className="d-flex flex-column gap-2 mt-3 pb-5">
            {searchVal.trim() !== "" && users.length === 0 && (
              <div className="text-center text-secondary py-5">
                No accounts found for "{searchVal}"
              </div>
            )}
            
            {users.map((user, key) => (
              <div 
                className="d-flex align-items-center gap-3 py-3 px-4 rounded-4 bg-dark-card border-dark-glow shadow-sm follow-bar" 
                key={key}
                style={{ cursor: "pointer" }} 
                onClick={() => { navigateprofile(user.id); onclose(); }}
              >
                <img 
                  src={user.userprofile || 'https://ui-avatars.com/api/?background=333&color=fff&name=U'} 
                  className="rounded-circle border border-secondary" 
                  style={{ width: "44px", height: '44px', objectFit: 'cover' }} 
                  alt={user.username}
                />
                <div className="d-flex flex-column">
                  <span className="text-white fw-bold" style={{ fontSize: "14px" }}>{user.username}</span>
                  <span className="text-secondary" style={{ fontSize: "11px" }}>View Profile</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Search