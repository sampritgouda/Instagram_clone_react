import React from 'react';
import DeleteButton from './DeleteButton';
import ProfileHeader from './ProfileHeader';
import { useNavigate } from 'react-router-dom';

const MorePopup = ({ id, user, type, token, close }) => {
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={close}
    >
      <div
        className="d-flex flex-column align-items-center text-center rounded-4 overflow-hidden shadow-lg"
        style={{
          width: '100%',
          maxWidth: '340px',
          background: 'rgba(26, 26, 26, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          animation: 'morePopupPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Header / Delete button */}
        {user.own ? (
          <div className="w-100 border-bottom border-secondary border-opacity-25 py-3">
            <DeleteButton id={id} type={type} token={token} />
          </div>
        ) : (
          <div className="w-100 border-bottom border-secondary border-opacity-25 py-3 d-flex align-items-center justify-content-center">
            <ProfileHeader user={user} />
          </div>
        )}

        {/* Visit Account */}
        <button
          type="button"
          className="btn btn-link text-white fw-semibold w-100 py-3 text-decoration-none border-bottom border-secondary border-opacity-25 more-popup-btn"
          style={{ fontSize: '14px' }}
          onClick={() => {
            navigate(`/profile/${user.id}`);
            close();
          }}
        >
          Visit Account
        </button>

        {/* Cancel */}
        <button
          type="button"
          className="btn btn-link text-white-50 w-100 py-3 text-decoration-none more-popup-btn"
          style={{ fontSize: '14px' }}
          onClick={close}
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes morePopupPop {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .more-popup-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>
    </div>
  );
};

export default MorePopup;