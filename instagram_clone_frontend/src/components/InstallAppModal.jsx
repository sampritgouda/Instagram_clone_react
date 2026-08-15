import React, { useEffect, useState } from 'react';
import { FaTimes, FaMobileAlt, FaAndroid, FaApple, FaDesktop, FaDownload, FaCheckCircle } from 'react-icons/fa';

const InstallAppModal = ({ isOpen, onClose, deferredPrompt }) => {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      onClose();
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        zIndex: 25000,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)'
      }}
      onClick={onClose}
    >
      <div
        className="card bg-dark text-white border border-secondary shadow-lg rounded-4 p-4"
        style={{ width: '92%', maxWidth: '440px', background: '#141414' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center pb-3 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2">
            <FaDownload className="text-primary" size={20} />
            <h5 className="mb-0 fw-bold fs-6">Install Trend App Widget</h5>
          </div>
          <button className="btn btn-sm text-secondary p-0 border-0" onClick={onClose}>
            <FaTimes size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="py-3 text-center">
          <div
            className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center mb-3 border border-primary border-opacity-25"
            style={{ width: '64px', height: '64px' }}
          >
            <FaMobileAlt size={30} className="text-primary" />
          </div>

          <h6 className="fw-bold text-white mb-1">Get the App Experience</h6>
          <p className="text-secondary small mb-3">
            Install Trend on your phone or desktop to access it directly from your home screen as an app widget!
          </p>

          {/* Native Install Button if prompt captured */}
          {deferredPrompt && !isInstalled ? (
            <button
              className="btn btn-primary w-100 py-2.5 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 mb-3 shadow"
              onClick={handleInstallClick}
              style={{ background: '#0095f6', border: 'none' }}
            >
              <FaDownload size={16} /> Install App Widget Now
            </button>
          ) : isInstalled ? (
            <div className="alert alert-success d-flex align-items-center justify-content-center gap-2 py-2 mb-3 small rounded-3">
              <FaCheckCircle size={16} /> App is already installed!
            </div>
          ) : null}

          {/* Platform Specific Instructions */}
          <div className="text-start bg-black bg-opacity-40 p-3 rounded-3 border border-secondary border-opacity-25 mt-2">
            <p className="fw-bold text-white small mb-2 text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
              Installation Instructions:
            </p>

            <div className="d-flex flex-column gap-2.5 small">
              <div className="d-flex align-items-start gap-2">
                <FaAndroid className="text-success mt-1 flex-shrink-0" size={16} />
                <div>
                  <strong className="text-white">Android / Chrome:</strong> Tap the menu button <span className="text-primary">⋮</span> at top right and select <span className="text-white fw-bold">"Install App"</span> or <span className="text-white fw-bold">"Add to Home screen"</span>.
                </div>
              </div>

              <div className="d-flex align-items-start gap-2">
                <FaApple className="text-light mt-1 flex-shrink-0" size={16} />
                <div>
                  <strong className="text-white">iPhone / Safari:</strong> Tap the Share button <span className="text-primary">⎘</span> at bottom and select <span className="text-white fw-bold">"Add to Home Screen"</span>.
                </div>
              </div>

              <div className="d-flex align-items-start gap-2">
                <FaDesktop className="text-info mt-1 flex-shrink-0" size={16} />
                <div>
                  <strong className="text-white">Desktop Chrome / Edge:</strong> Click the Install icon <span className="text-primary">⊕</span> in your browser's address bar.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <button className="btn btn-secondary w-100 py-2 rounded-3 text-white fw-medium border-0 mt-1" onClick={onClose} style={{ fontSize: '14px', background: 'rgba(255,255,255,0.1)' }}>
          Close
        </button>
      </div>
    </div>
  );
};

export default InstallAppModal;
