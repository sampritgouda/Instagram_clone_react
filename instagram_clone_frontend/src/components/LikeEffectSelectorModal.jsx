import React, { useState } from 'react';
import { FaTimes, FaHeart, FaFire, FaBolt, FaCheck } from 'react-icons/fa';

const LIKE_EFFECTS = [
  { id: 'heart', name: 'Classic Red Heart', icon: <FaHeart color="#ff3040" size={24} />, desc: 'Classic Instagram heart pop with floating micro-particles' },
  { id: 'fire', name: 'Fire Flare', icon: <FaFire color="#ff4500" size={24} />, desc: 'Flaming fire flare with intense orange glow & spark burst' },
  { id: 'sparkle', name: 'Sparkle Heart', icon: <span style={{ fontSize: 24 }}>💖</span>, desc: 'Sparkling pink heart with shimmering golden stars' },
  { id: 'cyber', name: 'Neon Cyber', icon: <FaBolt color="#00f3ff" size={24} />, desc: 'Futuristic electric neon pulse with cyan shockwave' },
  { id: 'rainbow', name: 'Rainbow Burst', icon: <span style={{ fontSize: 24 }}>🌈</span>, desc: 'Vibrant multicolor rainbow burst animation' }
];

const LikeEffectSelectorModal = ({ isOpen, onClose }) => {
  const [selectedEffect, setSelectedEffect] = useState(() => {
    return localStorage.getItem('likeEffectStyle') || 'heart';
  });

  if (!isOpen) return null;

  const handleSelect = (effectId) => {
    setSelectedEffect(effectId);
    localStorage.setItem('likeEffectStyle', effectId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#161616',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: '20px' }}>Customize Double-Tap Like ❤️</h5>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>Choose your favorite double-tap heart animation</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {LIKE_EFFECTS.map(effect => {
            const isSelected = selectedEffect === effect.id;
            return (
              <div
                key={effect.id}
                onClick={() => handleSelect(effect.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ flexShrink: 0 }}>{effect.icon}</div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{effect.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>{effect.desc}</div>
                </div>
                {isSelected && (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e05d5d, #c0392b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <FaCheck size={12} color="#fff" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #e05d5d, #c0392b)',
            border: 'none',
            color: '#fff',
            fontWeight: 600,
            fontSize: '15px',
            cursor: 'pointer'
          }}
        >
          Save & Apply
        </button>
      </div>
    </div>
  );
};

export default LikeEffectSelectorModal;
