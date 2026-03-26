import React, { useState } from 'react';

/**
 * A beautiful photo hero section with overlay text.
 * Used for culture tab sections, region headers, etc.
 *
 * Props:
 *   src        - image URL (use PHOTOS.* from src/lib/photos.js)
 *   alt        - img alt text (default: 'Croatia')
 *   title      - bold headline rendered over the photo
 *   subtitle   - smaller line beneath the title
 *   height     - container height in px (default: 160)
 *   overlay    - CSS color for gradient overlay (default: rgba(0,0,0,0.35))
 *   titleColor - color for the title text (default: 'white')
 *   style      - additional styles merged into the container
 *   children   - rendered inside the bottom text area, below subtitle
 */
export default function PhotoHero({
  src,
  alt = 'Croatia',
  title,
  subtitle,
  height = 160,
  overlay = 'rgba(0,0,0,0.35)',
  titleColor = 'white',
  style = {},
  children,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div style={{
      position: 'relative',
      height,
      borderRadius: 16,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0a2348, #0c3868)',
      ...style,
    }}>
      {/* Photo */}
      {!error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
            position: 'absolute',
            inset: 0,
          }}
        />
      )}

      {/* Loading shimmer */}
      {!loaded && !error && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(to bottom, transparent 20%, ${overlay} 100%)`,
      }} />

      {/* Croatian flag stripe at top */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'linear-gradient(90deg, #b61800 33.3%, white 33.3%, white 66.6%, #0284c7 66.6%)',
      }} />

      {/* Text overlay */}
      {(title || subtitle || children) && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 20px',
        }}>
          {title && (
            <div style={{
              fontSize: 20,
              fontWeight: 900,
              color: titleColor,
              fontFamily: "'Playfair Display', serif",
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
              marginBottom: subtitle ? 4 : 0,
            }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 600,
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            }}>
              {subtitle}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
