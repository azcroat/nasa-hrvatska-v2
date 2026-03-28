import React, { useRef, useState } from 'react';

// Video-first scene background. Tries to load a looping video; falls back to
// the static imageSrc on error or when no videoSrc is provided.
//
// Props:
//   videoSrc  — path to .mp4 file (also tries .webm variant automatically)
//   imageSrc  — fallback static WebP/JPG path (always required)
//   overlay   — optional CSS gradient string overlaid above the video
//   style     — extra container styles (position, height, borderRadius, etc.)
//   children  — content rendered above the background
//
// Usage:
//   <VideoBackground
//     videoSrc="/videos/scenes/dubrovnik.mp4"
//     imageSrc="/images/scenes/dubrovnik-hero.webp"
//     overlay="linear-gradient(160deg,rgba(0,0,0,.65) 0%,rgba(0,0,0,.35) 100%)"
//     style={{ borderRadius: 18, minHeight: 140 }}
//   >
//     <div style={{ position: 'relative', zIndex: 2, padding: 18 }}>...</div>
//   </VideoBackground>
export default function VideoBackground({ videoSrc, imageSrc, overlay, style = {}, children }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef(null);

  const useVideo = !videoFailed && !!videoSrc;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
        // Static background used when video fails or videoSrc is absent
        background: !useVideo ? `url('${imageSrc}') center / cover no-repeat` : undefined,
      }}
    >
      {useVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc.replace(/\.mp4$/i, '.webm')} type="video/webm" />
        </video>
      )}

      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: overlay,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Content always above video + overlay */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
