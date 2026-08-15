import React from 'react';
import { useUser } from '../context/UserContext';
import { FaCheckCircle, FaPlus, FaSignOutAlt, FaTrash, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AccountSwitcherModal = ({ isOpen, onClose }) => {
  const { savedAccounts, userId, switchAccount, removeSavedAccount, logout } = useUser();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleAddAccount = () => {
    onClose();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("profileImage");
    navigate('/login?addAccount=true');
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center p-3"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.78)', zIndex: 10500, backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div 
        className="card bg-dark text-white border border-secondary shadow-lg rounded-4 overflow-auto my-auto"
        style={{ width: '100%', maxWidth: '400px', maxHeight: '85vh', background: '#141414' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom border-secondary border-opacity-25">
          <h5 className="mb-0 fw-bold fs-6">Switch Accounts</h5>
          <button 
            className="btn btn-sm text-secondary p-0 border-0"
            onClick={onClose}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Account List */}
        <div className="p-3 overflow-auto" style={{ maxHeight: '260px' }}>
          {savedAccounts && savedAccounts.length > 0 ? (
            savedAccounts.map((acc) => {
              const isActive = String(acc.id) === String(userId);
              return (
                <div 
                  key={acc.id}
                  className={`d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-2 transition-all ${
                    isActive ? 'bg-secondary bg-opacity-25' : 'bg-transparent hover-bg-dark'
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!isActive) switchAccount(acc);
                  }}
                >
                  <div className="d-flex align-items-center gap-3">
                    <img 
                      src={acc.profilePicUrl || 'https://res.cloudinary.com/dr0yboilf/image/upload/v1754637397/i721vyva5s2broewwwss.jpg'} 
                      alt={acc.username}
                      className="rounded-circle border border-secondary"
                      style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                    />
                    <div>
                      <p className="mb-0 fw-bold text-white fs-6">{acc.username || `User #${acc.id}`}</p>
                      <small className="text-secondary" style={{ fontSize: '12px' }}>{acc.email || 'Saved Login'}</small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    {isActive ? (
                      <FaCheckCircle size={20} className="text-primary" />
                    ) : (
                      <button 
                        className="btn btn-sm btn-outline-danger border-0 p-1"
                        title="Remove saved account"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSavedAccount(acc.id);
                        }}
                      >
                        <FaTrash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-secondary py-3 mb-0">No saved accounts found.</p>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-3 border-top border-secondary border-opacity-25 d-flex flex-column gap-2 bg-black bg-opacity-50">
          <button 
            className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold rounded-3"
            onClick={handleAddAccount}
            style={{ fontSize: '14px' }}
          >
            <FaPlus size={14} /> Log into an existing account
          </button>

          <button 
            className="btn btn-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold rounded-3"
            onClick={() => logout(false)}
            style={{ fontSize: '14px' }}
          >
            <FaSignOutAlt size={14} /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSwitcherModal;
