import React from 'react';
import { FaTimes } from 'react-icons/fa';
import Comment from './Comment';

const CommentsModal = ({ isOpen, onClose, postId, postType = 'post' }) => {
  if (!isOpen || !postId) return null;

  return (
    <div
      className="comments-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="comments-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="comments-modal-header">
          <h6 className="mb-0 fw-bold text-white" style={{ fontSize: 16 }}>Comments</h6>
          <button
            type="button"
            className="comments-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Comment Component */}
        <div className="comments-modal-body">
          <Comment id={postId} type={postType} onclose={onClose} />
        </div>
      </div>

      <style>{`
        .comments-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: commentsFadeIn 0.2s ease-out;
        }

        @keyframes commentsFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .comments-modal-container {
          width: 100%;
          max-width: 480px;
          height: 80vh;
          max-height: 650px;
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          background: rgba(22, 22, 22, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          overflow: hidden;
          animation: commentsPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes commentsPop {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .comments-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.02);
          flex-shrink: 0;
        }

        .comments-modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .comments-modal-close:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        .comments-modal-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Mobile bottom sheet style */
        @media (max-width: 575.98px) {
          .comments-modal-backdrop {
            padding: 0;
            align-items: flex-end;
          }

          .comments-modal-container {
            max-width: 100%;
            height: 75vh;
            max-height: 75vh;
            border-radius: 20px 20px 0 0;
            animation: commentsSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          }

          @keyframes commentsSlideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        }
      `}</style>
    </div>
  );
};

export default CommentsModal;
