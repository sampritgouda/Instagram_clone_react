import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaPaperPlane, FaPlusSquare, FaCog, FaVideo, FaHeart, FaSearch, FaBars, FaRegBookmark } from 'react-icons/fa';
import { FiHardDrive } from 'react-icons/fi';
import logo from '../assets/insta-logo.jpg'
import { useUser } from '../context/UserContext';   // ✅ import hook instead

function Sidebar({ onNotificationClick, onSearchClick }) {
  const navigate = useNavigate();
  const { profileImage } = useUser();   // ✅ use hook
  const userId = localStorage.getItem("userId");
  const [more, setmore] = useState(false);

  const navigateprofile = () => {
    navigate(`/profile/${userId}`);
  };

  const navigatesaved = () => {
    navigate(`/profile/${userId}/saved`);
  };

  return (
    <div className="side-component d-md-block col-md-3 col-lg-2 bg-black  p-3 border-end border-secondary w-100"
    style={{ height: window.innerWidth < 768 ? "60px" : "100vh" }} >
      <div className=' d-none d-md-flex gap-2'>
        <img className='ms-3' src={logo} style={{width:"30px",height:"30px"}}/>
        <h5 className='m-0 d-flex align-items-center' style={{fontFamily:"monospace",color:"orange"}}>Trend</h5>
      </div>

      <ul className="nav d-flex flex-md-column mt-md-5 m-0 gap-3 gap-md-0"
        style={{ height: window.innerWidth < 768 ? "60px" : "85%" }}>
        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/home">
            <FaHome size={20} /> <span className='d-none d-md-block'>Home</span>
          </Link>
        </li>
        
        <li className="nav-item mb-3">
          <button 
            className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100"
            onClick={onSearchClick}>
            <FaSearch size={20} /> <span className='d-none d-md-block'>Search</span>
          </button>
        </li>

        <li className="nav-item mb-3 d-none d-md-block">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/messages">
            <FaPaperPlane size={20} /><span className='d-none d-md-block'>Messages</span>
          </Link>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/create/post">
            <FaPlusSquare size={20} /> <span className='d-none d-md-block'>Create</span>
          </Link>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/reels">
            <FaVideo size={20} /> <span className='d-none d-md-block'>Reels</span>
          </Link>
        </li>

        <li className="nav-item mb-3 d-none d-md-block">
          <button
            className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100"
            onClick={onNotificationClick}>
            <FaHeart size={24} /> Notifications
          </button>
        </li>

        <li className="nav-item mb-3">
          <button
            className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100"
            onClick={navigateprofile}>
            <img className="rounded-circle" src={profileImage} style={{ width: "30px", height: "30px" }} alt="profile"/> 
            
            <span className='d-none d-md-block'>Profile</span>
          </button>
        </li>

        <li className="d-none d-md-block nav-item mb-3 mt-auto">
          <button 
            className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100"
            onClick={() => setmore(!more)}>
            <FaBars size={20} /> More
          </button>
        </li>
      </ul>

      {more && 
      <div className='container position-absolute bg-dark px-1 py-3 rounded' style={{width:"15%",bottom:"15%",left:"1%"}}>
        <ul className='flex-column nav gap-2'>
          <li>
            <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3"
            to="/profile/edit">
              <FaCog size={18} /> Settings
            </Link>
          </li>
          <li onClick={navigatesaved}>
            <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3">
              <FaRegBookmark size={18} /> Saved
            </Link>
          </li>
          <li>
            <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3">
              <FiHardDrive/> Your Activity
            </Link>
          </li>
          <li>
            <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3">
              Logout
            </Link>
          </li>
        </ul>
      </div>}
    </div>
  );
}

export default Sidebar;
