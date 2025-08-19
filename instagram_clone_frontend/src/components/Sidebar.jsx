import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUser, FaPaperPlane, FaPlusSquare, FaCog, FaVideo, FaHeart } from 'react-icons/fa';

function Sidebar({ onNotificationClick }) {
  const navigate = useNavigate();
  const profileImage = localStorage.getItem("profieImage");
  const userId = localStorage.getItem("userId");

  const navigateprofile = () => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="d-none d-md-block col-md-3 col-lg-2 bg-black vh-100 p-3 border-end border-secondary">
      <h5 className="mb-4 text-white fw-bold ps-2">Instagram Clone</h5>

      <ul className="nav flex-column mt-5">
        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/home">
            <FaHome size={20} /> Home
          </Link>
        </li>
        
        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/messages">
            <FaPaperPlane size={20} /> Messages
          </Link>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/create">
            <FaPlusSquare size={20} /> Create
          </Link>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/reels">
            <FaVideo size={20} /> Reels
          </Link>
        </li>

        {/* Replace Link with button to trigger panel swap */}
        <li className="nav-item mb-3">
          <button
            className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100"
            onClick={onNotificationClick}
          >
            <FaHeart size={24} /> Notifications
          </button>
        </li>

        <li className="nav-item mb-3">
          <button
            className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100"
            onClick={navigateprofile}
          >
            <img className="rounded-circle" src={profileImage} style={{ width: "30px", height: "30px" }} /> Profile
          </button>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/settings">
            <FaCog size={20} /> Settings
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
