import React, { useState } from 'react';

export default function PhotoHero({
  src,
  alt = 'Croatian landscape',
  title,
  subtitle,
  height = 160,
  overlay = 'rgba(0,0,0,0.45)',
  titleColor = '#fff',
  style = {},
  children,
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className="photo-hero"
      style={{
        height,
        background: 'linear-gradient(160deg, #0c2d6b 0%, #0e4d8a 50%, #0284c7 100%)',
        ...style,
      }}
    >
      {/* Croatian flag stripe at top */}
      <div className="photo-hero-flag-stripe" />

      {/* Shimmer skeleton loader */}
      {!loaded && !errored && (
        <div
          className="skeleton"
          style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: 1 }}
        />
      )}

      {/* Photo */}
      {!errored && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            position: 'absolute',
            inset: 0,
            zIndex: 2,
          }}
        />
      )}

      {/* Gradient overlay */}
      <div
        className="photo-hero-overlay"
        style={{
          background: `linear-gradient(to bottom, transparent 25%, ${overlay} 100%)`,
          zIndex: 3,
        }}
      />

      {/* Text content */}
      {(title || subtitle || children) && (
        <div className="photo-hero-text" style={{ zIndex: 4 }}>
          {title && (
            <div
              className="photo-hero-title"
              style={{
                color: titleColor,
                textShadow: '0 2px 8px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              {title}
            </div>
          )}
          {subtitle && (
            <div
              className="photo-hero-subtitle"
              style={{
                color: titleColor,
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}
            >
              {subtitle}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
