import React, { useState, useRef } from 'react';
import { FaHeart, FaFire, FaBolt } from 'react-icons/fa';

/**
 * Reusable Double-Tap Like Wrapper Component
 * 
 * Props:
 * - children: Media node (image, video, post canvas)
 * - onDoubleTap: Callback invoked when double tapped/clicked
 * - isLiked: Current liked state
 * - effectStyle: Optional override for effect style ('heart', 'fire', 'sparkle', 'cyber', 'rainbow')
 * - className: Container custom class
 * - style: Container custom inline styles
 */
const DoubleTapLike = ({
  children,
  onDoubleTap,
  onSingleTap,
  isLiked,
  effectStyle,
  className = '',
  style = {}
}) => {
  const [animations, setAnimations] = useState([]);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef(null);
  const containerRef = useRef(null);

  // Get active effect style (passed prop or saved preference)
  const activeEffect = effectStyle || localStorage.getItem('likeEffectStyle') || 'heart';

  const triggerAnimation = (x, y) => {
    const id = Date.now() + Math.random();
    setAnimations(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setAnimations(prev => prev.filter(anim => anim.id !== id));
    }, 1000);
  };

  const handleClick = (e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 280; // ms

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected! Clear single tap timer immediately so video play/pause is NOT triggered
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        triggerAnimation(x, y);
      } else {
        triggerAnimation(e.clientX, e.clientY);
      }

      if (onDoubleTap) {
        onDoubleTap(e);
      }
      lastTapRef.current = 0; // reset
    } else {
      lastTapRef.current = now;
      if (onSingleTap) {
        // Schedule single tap action (e.g. video play/pause) only after verifying no second tap follows
        singleTapTimerRef.current = setTimeout(() => {
          onSingleTap(e);
          singleTapTimerRef.current = null;
        }, DOUBLE_TAP_DELAY);
      }
    }
  };

  const renderIcon = (styleName) => {
    switch (styleName) {
      case 'fire':
        return <FaFire color="#ff4500" className="dtl-icon dtl-fire-anim" />;
      case 'sparkle':
        return <span className="dtl-icon dtl-sparkle-anim">💖</span>;
      case 'cyber':
        return <FaBolt color="#00f3ff" className="dtl-icon dtl-cyber-anim" />;
      case 'rainbow':
        return <span className="dtl-icon dtl-rainbow-anim">🌈</span>;
      case 'heart':
      default:
        return <FaHeart color="#ff3040" className="dtl-icon dtl-heart-anim" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`double-tap-like-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
        ...style
      }}
      onClick={handleClick}
    >
      {children}

      {/* Render Active Double-Tap Floating Animations */}
      {animations.map(anim => (
        <div
          key={anim.id}
          className={`dtl-burst-wrapper dtl-effect-${activeEffect}`}
          style={{
            position: 'absolute',
            left: anim.x,
            top: anim.y,
            pointerEvents: 'none',
            zIndex: 99,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Main Burst Icon */}
          <div className="dtl-main-icon">
            {renderIcon(activeEffect)}
          </div>

          {/* Micro Particles */}
          <div className="dtl-particles">
            <span className="dtl-p dtl-p1" />
            <span className="dtl-p dtl-p2" />
            <span className="dtl-p dtl-p3" />
            <span className="dtl-p dtl-p4" />
            <span className="dtl-p dtl-p5" />
            <span className="dtl-p dtl-p6" />
          </div>
        </div>
      ))}

      {/* ── Keyframe Animations & Styles ── */}
      <style>{`
        .double-tap-like-container {
          touch-action: manipulation;
        }

        .dtl-burst-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: dtlFloatPop 0.95s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .dtl-icon {
          font-size: 84px;
          filter: drop-shadow(0 8px 24px rgba(255, 48, 64, 0.65));
        }

        .dtl-fire-anim {
          font-size: 90px;
          filter: drop-shadow(0 0 25px #ff4500) drop-shadow(0 0 40px #ff8c00);
        }

        .dtl-cyber-anim {
          font-size: 90px;
          filter: drop-shadow(0 0 20px #00f3ff) drop-shadow(0 0 35px #ff007f);
        }

        .dtl-sparkle-anim {
          font-size: 88px;
          filter: drop-shadow(0 0 20px #ffd700);
        }

        .dtl-rainbow-anim {
          font-size: 92px;
          filter: drop-shadow(0 0 25px rgba(255,255,255,0.8));
        }

        @keyframes dtlFloatPop {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.2) rotate(-15deg);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.25) rotate(0deg);
          }
          40% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1) rotate(5deg);
          }
          75% {
            opacity: 0.9;
            transform: translate(-50%, -65%) scale(1.1) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -90%) scale(0.7) rotate(10deg);
          }
        }

        /* Micro Burst Particles */
        .dtl-particles {
          position: absolute;
          width: 100px;
          height: 100px;
          pointer-events: none;
        }

        .dtl-p {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff3040;
          top: 50%;
          left: 50%;
          opacity: 0;
          animation: dtlParticleBurst 0.75s ease-out forwards;
        }

        .dtl-effect-fire .dtl-p { background: #ff4500; box-shadow: 0 0 10px #ff8c00; }
        .dtl-effect-sparkle .dtl-p { background: #ffd700; box-shadow: 0 0 10px #fff; }
        .dtl-effect-cyber .dtl-p { background: #00f3ff; box-shadow: 0 0 10px #ff007f; }
        .dtl-effect-rainbow .dtl-p {
          background: linear-gradient(135deg, #ff007f, #00f3ff, #ffd700);
        }

        .dtl-p1 { animation-delay: 0.05s; --dx: -45px; --dy: -45px; }
        .dtl-p2 { animation-delay: 0.08s; --dx: 45px; --dy: -45px; }
        .dtl-p3 { animation-delay: 0.06s; --dx: -55px; --dy: 20px; }
        .dtl-p4 { animation-delay: 0.09s; --dx: 55px; --dy: 20px; }
        .dtl-p5 { animation-delay: 0.04s; --dx: 0px; --dy: -60px; }
        .dtl-p6 { animation-delay: 0.07s; --dx: 0px; --dy: 60px; }

        @keyframes dtlParticleBurst {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default DoubleTapLike;
