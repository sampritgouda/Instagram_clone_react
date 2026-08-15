import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Stories from '../components/Stories';
import Feeds from '../components/Feeds';
import SideComponent from '../components/SideComponent';
import { FaPaperPlane, FaHeart } from 'react-icons/fa';
import logo from '../assets/insta-logo.jpg';
import { useNotifications } from '../context/NotificationContext';

function HomePage() {
  const containerRef = useRef({})
  const navigate = useNavigate();
  const { unreadCount, unreadMessageCount } = useNotifications();
  return (
    <div className='d-flex'>
      <SideComponent />

      {/* Mobile Top Header - only on mobile */}
      <div
        className="d-flex d-md-none align-items-center justify-content-between px-4 py-3 bg-black border-bottom border-secondary"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9998,
          height: '56px',
        }}
      >
        {/* Logo + App name */}
        <div className="d-flex align-items-center gap-2">
          <img src={logo} style={{ width: '28px', height: '28px', borderRadius: '6px' }} alt="logo" />
          <span style={{ fontFamily: 'monospace', color: 'orange', fontWeight: '700', fontSize: '18px' }}>Trend</span>
        </div>

        {/* Notifications & Messages icons */}
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn p-0 border-0 bg-transparent text-white d-flex align-items-center justify-content-center position-relative"
            onClick={() => navigate('/notifications')}
            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
            aria-label="Notifications"
          >
            <FaHeart size={20} />
            {unreadCount > 0 && (
              <span
                className="position-absolute d-flex align-items-center justify-content-center text-white"
                style={{
                  top: '2px',
                  right: '2px',
                  minWidth: '16px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #ff4d4d, #c0392b)',
                  fontSize: '9px',
                  fontWeight: 700,
                  borderRadius: '50px',
                  padding: '0 3px',
                  border: '1.5px solid #000',
                  boxShadow: '0 2px 5px rgba(255,77,77,0.6)',
                  lineHeight: 1
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button
            className="btn p-0 border-0 bg-transparent text-white d-flex align-items-center justify-content-center position-relative"
            onClick={() => navigate('/messages')}
            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
            aria-label="Messages"
          >
            <FaPaperPlane size={20} />
            {unreadMessageCount > 0 && (
              <span
                className="position-absolute d-flex align-items-center justify-content-center text-white"
                style={{
                  top: '2px',
                  right: '2px',
                  minWidth: '16px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #0095f6, #007bb5)',
                  fontSize: '9px',
                  fontWeight: 700,
                  borderRadius: '50px',
                  padding: '0 3px',
                  border: '1.5px solid #000',
                  boxShadow: '0 2px 5px rgba(0,149,246,0.6)',
                  lineHeight: 1
                }}
              >
                {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="container-fluid bg-black px-0" style={{ overflowX: 'hidden' }}>
        <div className="row g-0">

          <div className="col-12 col-md-9 col-lg-10 ">
            <div className="d-flex justify-content-center">
              <div ref={containerRef} className="w-100 w-md-50 " style={{
                overflowY: "auto",
                maxHeight: "100vh",
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}>
                {/* Spacer for the fixed mobile top header */}
                <div className="d-md-none" style={{ height: '56px' }} />
                <Stories />
                <div className='w-mad-80 mx-auto mt-4 px-2'>
                  <Feeds scrollcontainerref={containerRef} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
