import React from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';
import logo from '../assets/insta-logo.jpg';

const InstallAppModal = ({ isOpen, onClose, deferredPrompt }) => {
  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 25000,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="card text-white border-0 shadow-lg rounded-4 p-3 p-md-4 text-center my-auto"
        style={{
          width: '100%',
          maxWidth: '350px',
          background: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close */}
        <div className="d-flex justify-content-end mb-1">
          <button className="btn btn-sm text-secondary p-0 border-0" onClick={onClose}>
            <FaTimes size={16} />
          </button>
        </div>

        {/* Logo Badge */}
        <div className="d-flex justify-content-center mb-2">
          <img
            src={logo}
            alt="Trend"
            className="rounded-3 shadow-sm border border-secondary border-opacity-25"
            style={{ width: '52px', height: '52px', objectFit: 'cover' }}
          />
        </div>

        {/* Text Details */}
        <h6 className="fw-bold text-white mb-1 fs-6">Install Trend App Widget</h6>
        <p className="text-secondary small mb-3 px-1" style={{ fontSize: '12.5px', lineHeight: '1.35' }}>
          Add Trend to your home screen for quick 1-tap access!
        </p>

        {/* Small Install / Download Button */}
        <button
          className="btn btn-primary w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2 mb-2 shadow-sm"
          onClick={handleInstallClick}
          style={{ background: '#0095f6', border: 'none', fontSize: '13.5px' }}
        >
          <FaDownload size={13} /> Install App Widget
        </button>

        {/* Compact Instruction Box */}
        <div className="bg-black bg-opacity-50 p-2 rounded-3 border border-secondary border-opacity-25 text-start mb-2">
          <p className="fw-semibold text-white mb-1" style={{ fontSize: '11px' }}>Quick Instructions:</p>
          <p className="text-secondary mb-1" style={{ fontSize: '11px', lineHeight: '1.3' }}>
            • <strong className="text-white">Android:</strong> Tap <span className="text-primary fw-bold">⋮</span> &rarr; <span className="text-white">"Add to Home Screen"</span>
          </p>
          <p className="text-secondary mb-0" style={{ fontSize: '11px', lineHeight: '1.3' }}>
            • <strong className="text-white">iPhone:</strong> Tap Share <span className="text-primary fw-bold">⎘</span> &rarr; <span className="text-white">"Add to Home Screen"</span>
          </p>
        </div>

        {/* Not Now Dismiss Button */}
        <button
          className="btn btn-link text-secondary w-100 py-1 text-decoration-none small border-0"
          onClick={onClose}
          style={{ fontSize: '12.5px' }}
        >
          Not Now
        </button>
      </div>
    </div>
  );
};

export default InstallAppModal;
