import React from 'react';

const FloatingRings = ({ multiDirectional = false }) => {
  const animations = ['float', 'floatRight', 'floatLeft', 'floatDiagonal'];
  
  const rings = Array.from({ length: 5 }).map((_, index) => ({
    id: index,
    left: multiDirectional ? `${Math.random() * 90}%` : `${Math.random() * 90}%`,
    top: multiDirectional ? `${Math.random() * 90}%` : 'auto',
    animationName: multiDirectional ? 
      animations[Math.floor(Math.random() * animations.length)] : 
      'float',
    animationDuration: `${15 + Math.random() * 10}s`,
    animationDelay: `${Math.random() * 5}s`,
    size: `${30 + Math.random() * 20}px`,
    rotation: Math.random() * 360,
    sparkleDelay: `${Math.random() * 2}s`
  }));

  return (
    <div className="floating-rings-container">
      {rings.map(ring => (
        <div
          key={ring.id}
          className="floating-ring"
          style={{
            left: ring.left,
            top: ring.top,
            animation: `${ring.animationName} ${ring.animationDuration} infinite linear ${ring.animationDelay}`,
            width: ring.size,
            height: ring.size,
            transform: `rotate(${ring.rotation}deg)`
          }}
        >
          <div className="ring-band">
            <div className="ring-setting"></div>
            <div 
              className="ring-diamond"
              style={{
                animation: `sparkle 1s infinite alternate ${ring.sparkleDelay}`
              }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingRings; 