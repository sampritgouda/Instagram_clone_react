import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaPaperPlane, FaPlusSquare, FaCog, FaVideo, FaHeart, FaSearch, FaBars, FaRegBookmark } from 'react-icons/fa';
import { FiHardDrive } from 'react-icons/fi';
import logo from '../assets/insta-logo.jpg'
import { useUser } from '../context/UserContext';

function Sidebar({ onNotificationClick, onSearchClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileImage } = useUser();
  const userId = localStorage.getItem("userId");
  const [more, setmore] = useState(false);

  const navigateprofile = () => {
    navigate(`/profile/${userId}`);
  };

  const navigatesaved = () => {
    navigate(`/profile/${userId}/saved`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("profileImage");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isProfileActive = location.pathname.startsWith(`/profile/${userId}`);

  // Mobile bottom nav items
  const mobileNavItems = [
    {
      id: 'home',
      icon: <FaHome size={24} />,
      label: 'Home',
      path: '/home',
      onClick: () => navigate('/home'),
      active: isActive('/home'),
    },
    {
      id: 'search',
      icon: <FaSearch size={24} />,
      label: 'Search',
      path: null,
      onClick: onSearchClick,
      active: false,
    },
    {
      id: 'create',
      icon: <FaPlusSquare size={26} />,
      label: 'Create',
      path: '/create/post',
      onClick: () => navigate('/create/post'),
      active: isActive('/create'),
    },
    {
      id: 'reels',
      icon: <FaVideo size={24} />,
      label: 'Reels',
      path: '/reels',
      onClick: () => navigate('/reels'),
      active: isActive('/reels'),
    },
    {
      id: 'profile',
      icon: profileImage
        ? <img src={profileImage} alt="profile" style={{ width: '26px', height: '26px', objectFit: 'cover', borderRadius: '50%', border: isProfileActive ? '2px solid white' : '2px solid transparent' }} />
        : <FaUser size={24} />,
      label: 'Profile',
      path: `/profile/${userId}`,
      onClick: navigateprofile,
      active: isProfileActive,
    },
  ];

  return (
    <div
      className="side-component d-md-block col-md-3 col-lg-2 bg-black p-3 border-end border-secondary w-100"
      style={{ height: window.innerWidth < 768 ? "65px" : "100vh" }}
    >
      {/* Desktop: Logo */}
      <div className='d-none d-md-flex gap-2'>
        <img className='ms-3' src={logo} style={{ width: "30px", height: "30px" }} />
        <h5 className='m-0 d-flex align-items-center' style={{ fontFamily: "monospace", color: "orange" }}>Trend</h5>
      </div>

      {/* ── DESKTOP NAV ── */}
      <ul className="nav d-none d-md-flex flex-column mt-5 gap-0" style={{ height: "85%" }}>
        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/home">
            <FaHome size={20} /> <span>Home</span>
          </Link>
        </li>

        <li className="nav-item mb-3">
          <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100" onClick={onSearchClick}>
            <FaSearch size={20} /> <span>Search</span>
          </button>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/messages">
            <FaPaperPlane size={20} /><span>Messages</span>
          </Link>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/create/post">
            <FaPlusSquare size={20} /> <span>Create</span>
          </Link>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/reels">
            <FaVideo size={20} /> <span>Reels</span>
          </Link>
        </li>

        <li className="nav-item mb-3">
          <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/notifications">
            <FaHeart size={20} /> <span>Notifications</span>
          </Link>
        </li>

        <li className="nav-item mb-3">
          <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100" onClick={navigateprofile}>
            <img className="rounded-circle" src={profileImage} style={{ width: "30px", height: "30px" }} alt="profile" />
            <span>Profile</span>
          </button>
        </li>

        <li className="d-md-block nav-item mb-3 mt-auto">
          <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100" onClick={() => setmore(!more)}>
            <FaBars size={20} /> More
          </button>
        </li>
      </ul>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="d-flex d-md-none w-100 h-100 align-items-center" style={{ padding: '0 4px' }}>
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`mobile-nav-btn${item.active ? ' mobile-nav-btn--active' : ''}`}
            aria-label={item.label}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop More menu */}
      {more &&
        <div className='container position-absolute bg-dark px-1 py-3 rounded' style={{ width: "15%", bottom: "15%", left: "1%" }}>
          <ul className='flex-column nav gap-2'>
            <li>
              <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/profile/edit">
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
                <FiHardDrive /> Your Activity
              </Link>
            </li>
            <li onClick={handleLogout}>
              <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100 text-start border-0 bg-transparent">
                Logout
              </button>
            </li>
          </ul>
        </div>}
    </div>
  );
}

export default Sidebar;
