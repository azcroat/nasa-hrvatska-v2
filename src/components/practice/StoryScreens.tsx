// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { H, Bar, speak, STORIES } from '../../data';
import { apiFetch } from '../../lib/apiFetch.js';
import { markQuest } from '../../lib/quests.js';

// Fetch AI illustration for a story scene (watercolor style via FLUX)
const sceneImgCache = {};
async function fetchSceneIllustration(storyTitle, sceneText, signal) {
  const key = `${storyTitle}:${sceneText.slice(0, 40)}`;
  if (sceneImgCache[key]) return sceneImgCache[key];
  try {
    const stored = sessionStorage.getItem(`nh_story_img_${btoa(key).slice(0, 40)}`);
    if (stored) {
      sceneImgCache[key] = stored;
      return stored;
    }
  } catch {}
  try {
    const r = await apiFetch('/api/flux-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'scene', sceneText, storyTitle }),
      signal,
    });
    if (!r.ok) return null;
    const { imageUrl } = await r.json();
    if (imageUrl) {
      sceneImgCache[key] = imageUrl;
      try {
        sessionStorage.setItem(`nh_story_img_${btoa(key).slice(0, 40)}`, imageUrl);
      } catch {}
    }
    return imageUrl || null;
  } catch {
    return null;
  }
}

// Single component managing both story selection and playback
export default function StoryScreens({ goBack, award, sCurEx }) {
  const [stSt, sStSt] = useState(null);
  const [stSc, sStSc] = useState(0);
  const finishFired = useRef(false);
  const mountedRef = useRef(true);
  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  // AI scene illustration state
  const [sceneImg, setSceneImg] = useState(null);
  const [sceneImgLoading, setSceneImgLoading] = useState(false);

  // Fetch illustration when story + scene changes
  useEffect(() => {
    if (!stSt) return undefined;
    const scene = stSt.scenes[stSc];
    if (!scene) return undefined;
    setSceneImg(null);
    setSceneImgLoading(true);
    const controller = new AbortController();
    fetchSceneIllustration(stSt.title, scene.text, controller.signal).then((url) => {
      if (!mountedRef.current) return;
      setSceneImg(url || null);
      setSceneImgLoading(false);
    });
    return () => controller.abort();
  }, [stSt, stSc]);

  if (!stSt) {
    return (
      <div className="scr-wrap">
        {H('📖 Mini Stories', 'Interactive stories where YOU choose what happens', goBack)}
        {STORIES.map((s, i) => (
          <div
            key={i}
            className="tc"
            onClick={() => {
              finishFired.current = false;
              sStSt(s);
              sStSc(0);
              if (sCurEx) sCurEx('story');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}
          >
            <div style={{ fontSize: 36 }}>{i === 0 ? '☕' : i === 1 ? '🍒' : '🏖️'}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#78716c' }}>
                {s.tEn} · {s.scenes.length} scenes
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const scene = stSt.scenes[stSc];

  return (
    <div className="scr-wrap">
      <button
        className="b bg"
        style={{ marginBottom: 16, fontSize: 13 }}
        onClick={() => sStSt(null)}
      >
        ← Back
      </button>
      {H('📖 ' + stSt.title, stSt.tEn, goBack)}
      {!scene ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>🌟</div>
          <h3>Story complete!</h3>
          <button
            className="b bp"
            style={{ marginTop: 16 }}
            onClick={() => {
              if (finishFired.current) return;
              finishFired.current = true;
              if (typeof award === 'function') award(15);
              markQuest('reading');
              sStSt(null);
            }}
          >
            Back to Stories
          </button>
        </div>
      ) : (
        <React.Fragment>
          <Bar v={stSc + 1} mx={stSt.scenes.length} h={6} />

          {/* AI scene illustration */}
          <div
            style={{
              width: '100%',
              height: 160,
              borderRadius: 16,
              overflow: 'hidden',
              marginTop: 12,
              marginBottom: 4,
              position: 'relative',
              background: sceneImgLoading
                ? 'linear-gradient(135deg,rgba(14,116,144,.08),rgba(12,74,110,.06))'
                : sceneImg
                  ? undefined
                  : 'linear-gradient(135deg,rgba(14,116,144,.05),rgba(12,74,110,.08))',
              boxShadow: '0 2px 12px rgba(0,0,0,.10)',
            }}
          >
            {sceneImg && (
              <img
                src={sceneImg}
                alt=""
                aria-hidden="true"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
            )}
            {sceneImgLoading && !sceneImg && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--info)',
                      opacity: 0.4,
                      animation: `dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}
            {!sceneImg && !sceneImgLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  opacity: 0.15,
                }}
              >
                🏖️
              </div>
            )}
            {/* Gradient bottom fade */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
                background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,.55))',
                pointerEvents: 'none',
              }}
            />
            {/* AI badge + scene count */}
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 12,
                right: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {sceneImg && (
                <span
                  style={{
                    background: 'rgba(0,0,0,.4)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 20,
                    padding: '2px 8px',
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '.04em',
                  }}
                >
                  ✦ AI Scene
                </span>
              )}
              <span
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(0,0,0,.4)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {stSc + 1} / {stSt.scenes.length}
              </span>
            </div>
          </div>

          <div className="c" style={{ marginTop: 12 }}>
            <div
              role="button"
              tabIndex={0}
              aria-label={`Play audio for ${scene.text}`}
              style={{
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1.7,
                color: '#1c1917',
                cursor: 'pointer',
              }}
              onClick={() => speak(scene.text)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  speak(scene.text);
                }
              }}
            >
              {scene.text} <span aria-hidden="true">🔊</span>
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#78716c',
                fontStyle: 'italic',
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              {scene.en}
            </div>
          </div>
          {scene.choices.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0e7490', marginBottom: 8 }}>
                Što radiš? — What do you do?
              </div>
              {scene.choices.map((ch, ci) => (
                <button
                  key={ci}
                  className="ob"
                  style={{ borderColor: '#0e7490' }}
                  onClick={() => sStSc(ch.next)}
                >
                  {ch.text}
                </button>
              ))}
            </div>
          ) : (
            <button
              className="b bp"
              style={{ width: '100%', marginTop: 20 }}
              onClick={() => {
                if (finishFired.current) return;
                finishFired.current = true;
                if (typeof award === 'function') award(15);
                markQuest('reading');
                sStSt(null);
              }}
            >
              ✅ Story Complete!
            </button>
          )}
        </React.Fragment>
      )}
    </div>
  );
}
