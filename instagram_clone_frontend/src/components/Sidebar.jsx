import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaUser, FaPaperPlane, FaPlusSquare, FaCog, FaVideo, FaHeart, FaSearch, FaBars, FaRegBookmark, FaExchangeAlt, FaSignOutAlt } from 'react-icons/fa';
import { FiHardDrive } from 'react-icons/fi';
import logo from '../assets/insta-logo.jpg';
import { useUser } from '../context/UserContext';

function Sidebar({ onNotificationClick, onSearchClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profileImage, setIsSwitcherOpen, logout } = useUser();
  const userId = localStorage.getItem("userId");
  
  const [more, setmore] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigateprofile = () => {
    navigate(`/profile/${userId}`);
  };

  const navigatesaved = () => {
    navigate(`/profile/${userId}/saved`);
    setmore(false);
    setShowMobileMenu(false);
  };

  const handleLogout = () => {
    setmore(false);
    setShowMobileMenu(false);
    logout(false);
  };

  const handleOpenSwitcher = () => {
    setmore(false);
    setShowMobileMenu(false);
    setIsSwitcherOpen(true);
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isProfileActive = location.pathname.startsWith(`/profile/${userId}`);

  // Mobile bottom nav items
  const mobileNavItems = [
    {
      id: 'home',
      icon: <FaHome size={22} />,
      label: 'Home',
      onClick: () => navigate('/home'),
      active: isActive('/home'),
    },
    {
      id: 'search',
      icon: <FaSearch size={22} />,
      label: 'Search',
      onClick: onSearchClick,
      active: false,
    },
    {
      id: 'create',
      icon: <FaPlusSquare size={24} />,
      label: 'Create',
      onClick: () => navigate('/create/post'),
      active: isActive('/create'),
    },
    {
      id: 'reels',
      icon: <FaVideo size={22} />,
      label: 'Reels',
      onClick: () => navigate('/reels'),
      active: isActive('/reels'),
    },
    {
      id: 'profile',
      icon: profileImage
        ? <img src={profileImage} alt="profile" style={{ width: '24px', height: '24px', objectFit: 'cover', borderRadius: '50%', border: isProfileActive ? '2px solid white' : '2px solid transparent' }} />
        : <FaUser size={22} />,
      label: 'Profile',
      onClick: navigateprofile,
      active: isProfileActive,
    },
    {
      id: 'more',
      icon: <FaBars size={22} />,
      label: 'More',
      onClick: () => setShowMobileMenu(true),
      active: showMobileMenu,
    },
  ];

  return (
    <div
      className="side-component d-md-block col-md-3 col-lg-2 bg-black p-3 border-end border-secondary w-100"
      style={{ height: window.innerWidth < 768 ? "60px" : "100vh" }}
    >
      {/* Desktop: Logo */}
      <div className='d-none d-md-flex gap-2'>
        <img className='ms-3' src={logo} style={{ width: "30px", height: "30px" }} alt="logo" />
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
          <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100 border-0 bg-transparent text-start" onClick={onSearchClick}>
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
          <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100 border-0 bg-transparent text-start" onClick={navigateprofile}>
            <img className="rounded-circle" src={profileImage || 'https://res.cloudinary.com/dr0yboilf/image/upload/v1754637397/i721vyva5s2broewwwss.jpg'} style={{ width: "30px", height: "30px", objectFit: "cover" }} alt="profile" />
            <span>Profile</span>
          </button>
        </li>

        <li className="d-md-block nav-item mb-3 mt-auto">
          <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100 border-0 bg-transparent text-start" onClick={() => setmore(!more)}>
            <FaBars size={20} /> <span>More</span>
          </button>
        </li>
      </ul>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="d-flex d-md-none w-100 h-100 align-items-center justify-content-around" style={{ padding: '0 2px' }}>
        {mobileNavItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`mobile-nav-btn${item.active ? ' mobile-nav-btn--active' : ''}`}
            aria-label={item.label}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label" style={{ fontSize: '10px' }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop More Menu */}
      {more &&
        <div className='position-absolute bg-dark border border-secondary px-2 py-3 rounded-4 shadow-lg' style={{ width: "220px", bottom: "75px", left: "15px", zIndex: 10000 }}>
          <ul className='flex-column nav gap-1'>
            <li>
              <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3" to="/profile/edit" onClick={() => setmore(false)}>
                <FaCog size={18} /> Settings
              </Link>
            </li>
            <li onClick={navigatesaved}>
              <Link className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3">
                <FaRegBookmark size={18} /> Saved
              </Link>
            </li>
            <li onClick={handleOpenSwitcher}>
              <button className="nav-link text-white rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100 text-start border-0 bg-transparent">
                <FaExchangeAlt size={18} /> Switch accounts
              </button>
            </li>
            <li onClick={handleLogout}>
              <button className="nav-link text-danger rounded px-3 py-2 sidebar-link d-flex align-items-center gap-3 w-100 text-start border-0 bg-transparent fw-semibold">
                <FaSignOutAlt size={18} /> Log out
              </button>
            </li>
          </ul>
        </div>
      }

      {/* Mobile Drawer / Bottom Sheet for More Options */}
      {showMobileMenu && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-md-none" 
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10500, backdropFilter: 'blur(3px)' }}
          onClick={() => setShowMobileMenu(false)}
        >
          <div 
            className="position-absolute bottom-0 start-0 w-100 bg-dark text-white rounded-top-4 p-4 border-top border-secondary shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-center mb-3">
              <div style={{ width: '40px', height: '4px', backgroundColor: '#6c757d', borderRadius: '2px' }}></div>
            </div>

            <div className="d-flex flex-column gap-2">
              <button 
                className="btn btn-outline-light d-flex align-items-center gap-3 py-2.5 px-3 text-start rounded-3"
                onClick={() => { setShowMobileMenu(false); navigate('/profile/edit'); }}
              >
                <FaCog size={18} /> Settings
              </button>

              <button 
                className="btn btn-outline-light d-flex align-items-center gap-3 py-2.5 px-3 text-start rounded-3"
                onClick={navigatesaved}
              >
                <FaRegBookmark size={18} /> Saved Posts
              </button>

              <button 
                className="btn btn-outline-light d-flex align-items-center gap-3 py-2.5 px-3 text-start rounded-3"
                onClick={handleOpenSwitcher}
              >
                <FaExchangeAlt size={18} /> Switch Accounts
              </button>

              <button 
                className="btn btn-danger d-flex align-items-center gap-3 py-2.5 px-3 text-start rounded-3 mt-2 fw-bold"
                onClick={handleLogout}
              >
                <FaSignOutAlt size={18} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sidebar;
