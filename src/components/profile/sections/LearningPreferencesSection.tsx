import React, { useState } from 'react';
import type { LogEntry } from '../../../lib/debugLog.js';
import {
  isSoundEnabled,
  setSoundEnabled,
  isHapticEnabled,
  setHapticEnabled,
  getVoicePreference,
  setVoicePreference,
  getSpeechRate,
  setSpeechRate,
  type SpeechRate,
} from '../../../lib/soundSettings.js';
import { speak, getAudioDebugState } from '../../../lib/audio.ts';
import { getEntries } from '../../../lib/debugLog.ts';

/**
 * Learning Preferences cluster — extracted from SettingsTab as part of the 1a
 * decomposition. Unlike the earlier (presentational) section extractions, this
 * one OWNS its state: every toggle here (sound / audio-test / haptic / hearts /
 * microquiz / voice / speech-rate) is read and written only within this block,
 * so the useState + handleAudioTest moved here rather than being drilled as
 * props. Behavior-identical to the prior inline section. Self-contained — no
 * props. Each toggle mirrors a soundSettings/localStorage value into local
 * React state for the visual, exactly as before.
 */
export default function LearningPreferencesSection() {
  const [audioTestStatus, setAudioTestStatus] = useState<null | 'testing' | 'ok' | 'failed'>(null);
  const [showAudioDebug, setShowAudioDebug] = useState(false);
  const [audioDebugLines, setAudioDebugLines] = useState<LogEntry[]>([]);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [hapticOn, setHapticOn] = useState(() => isHapticEnabled());
  const [heartsAlways, setHeartsAlways] = useState(
    () => localStorage.getItem('nh_hearts_always_on') === 'true',
  );
  const [voicePref, setVoicePref] = useState(() => getVoicePreference());
  const [speechRate, setSpeechRateState] = useState<SpeechRate>(() => getSpeechRate());
  const [microQuizEnabled, setMicroQuizEnabled] = useState(
    () => localStorage.getItem('nh_microquiz_enabled') !== 'false',
  );

  async function handleAudioTest() {
    setAudioTestStatus('testing');
    setShowAudioDebug(false);
    try {
      const result = await speak('Dobar dan');
      setAudioTestStatus(result === 'failed' ? 'failed' : 'ok');
    } catch {
      setAudioTestStatus('failed');
    }
    // Capture last 15 TTS-related debug entries
    const ttsLines = getEntries()
      .filter((e) => e.msg.includes('[TTS]') || e.msg.includes('[Audio]'))
      .slice(-15);
    setAudioDebugLines(ttsLines);
    setShowAudioDebug(true);
  }

  return (
    <React.Fragment>
      {/* ── LEARNING PREFERENCES ── */}
      <div className="section-hdr" style={{ marginTop: 8 }}>
        <div className="section-hdr-icon" style={{ background: 'rgba(14,116,144,.12)' }}>
          ⚙️
        </div>
        <div className="section-hdr-text">
          <div className="section-hdr-title">Learning Preferences</div>
          <div className="section-hdr-sub">Customize how you learn</div>
        </div>
      </div>

      {/* Sound toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
            <span aria-hidden="true">🔊</span> Sound Effects
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Play audio feedback for answers
          </div>
        </div>
        <button
          role="switch"
          aria-checked={soundOn ? 'true' : 'false'}
          onClick={() => {
            const v = !soundOn;
            setSoundOn(v);
            setSoundEnabled(v);
          }}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            cursor: 'pointer',
            transition: 'background .2s',
            background: soundOn ? 'var(--success)' : 'var(--bar-bg)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: soundOn ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'white',
              transition: 'left .2s',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          />
        </button>
      </div>

      {/* ── AUDIO TEST ── */}
      <div style={{ padding: '14px 0', borderBottom: '1px solid var(--card-b)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
              🎙️ Croatian Pronunciation
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
              {audioTestStatus === null && 'Test if audio is working on this device'}
              {audioTestStatus === 'testing' && 'Playing "Dobar dan"…'}
              {audioTestStatus === 'ok' && '✓ Audio working'}
              {audioTestStatus === 'failed' && '✗ Audio failed — see log below'}
            </div>
          </div>
          <button
            onClick={handleAudioTest}
            disabled={audioTestStatus === 'testing'}
            style={{
              padding: '8px 14px',
              borderRadius: 20,
              border: 'none',
              cursor: audioTestStatus === 'testing' ? 'default' : 'pointer',
              background:
                audioTestStatus === 'ok'
                  ? 'var(--success)'
                  : audioTestStatus === 'failed'
                    ? '#dc2626'
                    : 'var(--info)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 'var(--text-xs)',
              flexShrink: 0,
              opacity: audioTestStatus === 'testing' ? 0.6 : 1,
            }}
          >
            {audioTestStatus === 'testing' ? '…' : 'Test Audio'}
          </button>
        </div>
        {showAudioDebug && audioDebugLines.length > 0 && (
          <div
            style={{
              marginTop: 10,
              background: '#111',
              borderRadius: 8,
              padding: '10px 12px',
              fontFamily: 'monospace',
              fontSize: 10,
              color: '#ddd',
              maxHeight: 180,
              overflowY: 'auto',
            }}
          >
            <div style={{ color: '#888', marginBottom: 4, fontSize: 9 }}>
              Audio Debug Log — {JSON.stringify(getAudioDebugState())}
            </div>
            {audioDebugLines.map((e, i) => (
              <div
                key={i}
                style={{
                  color:
                    e.level === 'error' ? '#f87171' : e.level === 'warn' ? '#fbbf24' : '#86efac',
                  lineHeight: 1.5,
                  wordBreak: 'break-all',
                }}
              >
                {new Date(e.t).toISOString().slice(11, 23)} {e.msg}
              </div>
            ))}
          </div>
        )}
        {showAudioDebug && audioDebugLines.length === 0 && (
          <div style={{ marginTop: 6, fontSize: 'var(--text-xs)', color: 'var(--subtext)' }}>
            No audio log entries yet. Try tapping Test Audio again.
          </div>
        )}
      </div>

      {/* Haptic toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>📳 Haptic Feedback</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Vibration on correct/wrong answers
          </div>
        </div>
        <button
          role="switch"
          aria-checked={hapticOn ? 'true' : 'false'}
          onClick={() => {
            const v = !hapticOn;
            setHapticOn(v);
            setHapticEnabled(v);
          }}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            cursor: 'pointer',
            transition: 'background .2s',
            background: hapticOn ? 'var(--success)' : 'var(--bar-bg)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: hapticOn ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'white',
              transition: 'left .2s',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          />
        </button>
      </div>

      {/* Hearts mode toggle — DuoLingo best practice: always-on hearts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>❤️ Always-On Hearts</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Lose lives in all practice modes, not just Challenge
          </div>
        </div>
        <button
          role="switch"
          aria-checked={heartsAlways ? 'true' : 'false'}
          onClick={() => {
            const v = !heartsAlways;
            setHeartsAlways(v);
            try {
              localStorage.setItem('nh_hearts_always_on', v ? 'true' : 'false');
            } catch (_) {}
          }}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            cursor: 'pointer',
            transition: 'background .2s',
            background: heartsAlways ? 'var(--error,#ef4444)' : 'var(--bar-bg)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: heartsAlways ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'white',
              transition: 'left .2s',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          />
        </button>
      </div>

      {/* MicroQuiz toggle — brief recall checks every 3 lesson items */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          borderBottom: '1px solid var(--card-b)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
            🧠 Quick checks during lessons
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Brief 2-question recall checks every 3 items. Helps retention. No XP penalty for wrong.
          </div>
        </div>
        <button
          role="switch"
          aria-checked={microQuizEnabled ? 'true' : 'false'}
          onClick={() => {
            const next = !microQuizEnabled;
            setMicroQuizEnabled(next);
            try {
              localStorage.setItem('nh_microquiz_enabled', next ? 'true' : 'false');
            } catch (_) {}
          }}
          style={{
            width: 44,
            height: 26,
            borderRadius: 13,
            border: 'none',
            cursor: 'pointer',
            transition: 'background .2s',
            background: microQuizEnabled ? 'var(--success)' : 'var(--bar-bg)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: microQuizEnabled ? 21 : 3,
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: 'white',
              transition: 'left .2s',
              boxShadow: '0 1px 4px rgba(0,0,0,.2)',
            }}
          />
        </button>
      </div>

      {/* Voice preference */}
      <div style={{ padding: '14px 0', borderBottom: '1px solid var(--card-b)' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>🗣️ Croatian Voice</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Choose how Croatian text is spoken
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            {
              id: 'gabrijela',
              label: 'Gabrijela',
              desc: 'Azure neural — native Croatian pronunciation (default)',
            },
            {
              id: 'charlotte',
              label: 'Charlotte',
              desc: 'ElevenLabs — modern natural voice, slight non-native accent on Croatian',
            },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => {
                setVoicePref(v.id);
                setVoicePreference(v.id);
              }}
              title={v.desc}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                background: voicePref === v.id ? 'var(--info-bg,#e0f2fe)' : 'var(--bar-bg,#f1f5f9)',
                color: voicePref === v.id ? 'var(--info,#0284c7)' : 'var(--subtext,#64748b)',
                outline: voicePref === v.id ? '2px solid var(--info,#0284c7)' : 'none',
                transition: 'all .15s',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 6, lineHeight: 1.4 }}>
          {voicePref === 'charlotte'
            ? '📌 ElevenLabs Charlotte — natural modern voice, slight non-native accent on Croatian'
            : '📌 Azure hr-HR-GabrijelaNeural — native Croatian pronunciation, phonemically accurate'}
        </div>
      </div>

      {/* SP8e: Speech playback rate */}
      <div style={{ padding: '14px 0', borderBottom: '1px solid var(--card-b)' }}>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>⏱️ Playback Speed</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--subtext)', marginTop: 2 }}>
            Slow Croatian audio down for listening practice. Natives speak fast — B2/C1 learners
            often want to slow it down.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }} data-testid="speech-rate-selector">
          {[
            { rate: 0.5 as SpeechRate, label: '0.5×' },
            { rate: 0.75 as SpeechRate, label: '0.75×' },
            { rate: 1 as SpeechRate, label: '1× (Normal)' },
          ].map((opt) => (
            <button
              key={opt.rate}
              data-testid={`speech-rate-${opt.rate}`}
              onClick={() => {
                setSpeechRateState(opt.rate);
                setSpeechRate(opt.rate);
              }}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif",
                fontWeight: 700,
                fontSize: 11,
                background:
                  speechRate === opt.rate ? 'var(--info-bg,#e0f2fe)' : 'var(--bar-bg,#f1f5f9)',
                color: speechRate === opt.rate ? 'var(--info,#0284c7)' : 'var(--subtext,#64748b)',
                outline: speechRate === opt.rate ? '2px solid var(--info,#0284c7)' : 'none',
                transition: 'all .15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--subtext)', marginTop: 6, lineHeight: 1.4 }}>
          📌 Applies to all Croatian audio playback (lessons, examples, story narration)
        </div>
      </div>
    </React.Fragment>
  );
}
