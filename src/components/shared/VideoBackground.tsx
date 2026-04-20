// @ts-nocheck
import React, { useRef, useState } from 'react';

// Video-first cinematic scene background.
//
// Priority order:
//   1. Looping MP4/WebM video (when videoSrc provided and loads successfully)
//   2. Static image with Ken Burns pan/zoom animation (always active; creates
//      a "living" background feel without any video files)
//
// When a video file exists at videoSrc, it plays as a seamless loop.
// When it 404s or no videoSrc is given, the static imageSrc plays with a
// slow cinematic pan/zoom (Ken Burns) — four direction variants selected
// deterministically from imageSrc so the same image always gets the same motion.
//
// Props:
//   videoSrc  — (optional) path to .mp4; .webm variant auto-tried on failure
//   imageSrc  — fallback/base static WebP/JPG (always required)
//   overlay   — optional CSS gradient overlaid above everything
//   style     — container styles (height, borderRadius, etc.)
//   children  — content rendered above backgrounds at z-index 2

const KB_ANIMS = ['kenBurns1', 'kenBurns2', 'kenBurns3', 'kenBurns4'];

function pickKenBurns(imageSrc) {
  // Deterministic variant from image path — same image = same direction
  let h = 0;
  for (let i = 0; i < imageSrc.length; i++) h = (h * 31 + imageSrc.charCodeAt(i)) >>> 0;
  return KB_ANIMS[h % KB_ANIMS.length];
}

export default function VideoBackground({ videoSrc, imageSrc, overlay, style = {}, children }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef(null);

  const useVideo = !videoFailed && !!videoSrc;
  const kbAnim = pickKenBurns(imageSrc || '');

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* ── Static image with Ken Burns — always present (z-index 0) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          // Slightly oversized so Ken Burns pan has room without white edges
          width: '110%',
          height: '110%',
          top: '-5%',
          left: '-5%',
          backgroundImage: `url('${imageSrc}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          animation: `${kbAnim} 14s ease-in-out infinite`,
          willChange: 'transform',
        }}
      />

      {/* ── Looping video — layered above static when available (z-index 1) ── */}
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
            zIndex: 1,
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc.replace(/\.mp4$/i, '.webm')} type="video/webm" />
        </video>
      )}

      {/* ── Gradient overlay (z-index 2) ── */}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: overlay,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* ── Content (z-index 3) ── */}
      <div style={{ position: 'relative', zIndex: 3 }}>{children}</div>
    </div>
  );
}
