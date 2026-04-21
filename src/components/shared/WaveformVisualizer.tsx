import React, { useRef, useEffect } from 'react';

interface WaveformVisualizerProps {
  active: boolean;
  color?: string;
  height?: number;
}

// Real-time audio waveform visualizer using Web Audio API AnalyserNode.
// Activates mic when `active` is true; cleans up on deactivation.
// Designed for use during voice recording in AIConversation.
//
// Props:
//   active  - boolean: true = recording/listening, false = idle
//   color   - CSS color for the waveform stroke (default: #0e7490)
//   height  - canvas height in px (default: 44)
export default function WaveformVisualizer({
  active,
  color = '#0e7490',
  height = 44,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!active) {
      // Tear down
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      analyserRef.current = null;
      // Draw flat idle line
      const cv = canvasRef.current;
      if (cv) {
        const c = cv.getContext('2d');
        if (c) {
          c.clearRect(0, 0, cv.width, cv.height);
          c.strokeStyle = color + '40';
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(0, cv.height / 2);
          c.lineTo(cv.width, cv.height / 2);
          c.stroke();
        }
      }
      return undefined;
    }

    let mounted = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        ctxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.7;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        draw();
      } catch {
        // Mic access denied — draw static bars as fallback
        drawFallback();
      }
    }

    function draw() {
      if (!mounted) return;
      const cv = canvasRef.current;
      if (!cv || !analyserRef.current) return;

      animRef.current = requestAnimationFrame(draw);

      const analyser = analyserRef.current;
      const bufLen = analyser.frequencyBinCount;
      const data = new Uint8Array(bufLen);
      analyser.getByteTimeDomainData(data);

      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const W = cv.width,
        H = cv.height;
      ctx.clearRect(0, 0, W, H);

      // Gradient stroke
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, color + '60');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, color + '60');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      const step = W / (bufLen - 1);
      for (let i = 0; i < bufLen; i++) {
        const v = (data[i] ?? 128) / 128.0;
        const y = (v * H) / 2;
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * step, y);
      }
      ctx.stroke();
    }

    function drawFallback() {
      // Animate fake bars when mic is unavailable
      let t = 0;
      const cv = canvasRef.current;
      function tick() {
        if (!mounted || !cv) return;
        animRef.current = requestAnimationFrame(tick);
        const ctx = cv.getContext('2d');
        if (!ctx) return;
        const W = cv.width,
          H = cv.height;
        ctx.clearRect(0, 0, W, H);
        const bars = 24;
        const bw = W / bars - 2;
        for (let i = 0; i < bars; i++) {
          const h = (Math.sin((i / bars) * Math.PI * 2 + t) * 0.5 + 0.5) * H * 0.75 + 4;
          const x = i * (bw + 2),
            y = (H - h) / 2,
            r = Math.min(3, bw / 2, h / 2);
          ctx.fillStyle = color + Math.floor(140 + i * 3).toString(16);
          ctx.beginPath();
          // Portable rounded-rect — ctx.roundRect() not supported in Safari <16
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + bw - r, y);
          ctx.arcTo(x + bw, y, x + bw, y + r, r);
          ctx.lineTo(x + bw, y + h - r);
          ctx.arcTo(x + bw, y + h, x + bw - r, y + h, r);
          ctx.lineTo(x + r, y + h);
          ctx.arcTo(x, y + h, x, y + h - r, r);
          ctx.lineTo(x, y + r);
          ctx.arcTo(x, y, x + r, y, r);
          ctx.closePath();
          ctx.fill();
        }
        t += 0.12;
      }
      tick();
    }

    start();

    return () => {
      mounted = false;
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
      analyserRef.current = null;
    };
  }, [active, color]);

  return (
    <canvas
      ref={canvasRef}
      width={560}
      height={height * 2} // 2x for retina
      aria-hidden="true"
      role="presentation"
      style={{
        width: '100%',
        height,
        borderRadius: 10,
        background: active ? `${color}10` : 'transparent',
        display: 'block',
        transition: 'background .3s',
      }}
    />
  );
}
