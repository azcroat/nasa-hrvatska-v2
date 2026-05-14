/**
 * MicPermissionDeniedExplainer — shown when useRecorder.state === 'denied'.
 *
 * Detects platform via getMicPermissionPlatform() and renders per-OS
 * re-grant instructions. Two action buttons:
 *   - "Try Again" (required) invokes onRetry
 *   - "Use writing instead" (optional) invokes onUseWriting — hidden when
 *     the consumer doesn't pass the callback (e.g., screens with no
 *     writing analog like AIConversation).
 *
 * role="alert" so screen readers announce the blocked state.
 */
import React from 'react';
import { getMicPermissionPlatform, type MicPermissionPlatform } from '../../lib/platform';

const INSTRUCTIONS: Record<MicPermissionPlatform, string> = {
  'ios-safari': 'Open Settings → Safari → Microphone → enable for nasahrvatska.com',
  'ios-app': 'Open Settings → Naša Hrvatska → Microphone → enable',
  'android-browser': 'Tap the lock icon in the URL bar → Permissions → Microphone → Allow',
  'android-app': 'Open Settings → Apps → Naša Hrvatska → Permissions → Microphone → Allow',
  desktop: 'Click the lock icon next to the URL and re-enable Microphone.',
};

interface Props {
  onRetry: () => void;
  onUseWriting?: () => void;
}

export default function MicPermissionDeniedExplainer({ onRetry, onUseWriting }: Props) {
  const platform = getMicPermissionPlatform();
  const text = INSTRUCTIONS[platform];

  return (
    <div
      role="alert"
      style={{
        padding: 16,
        border: '1px solid #f59e0b',
        borderRadius: 12,
        background: '#fffbeb',
        marginTop: 12,
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 15,
          color: '#92400e',
          marginBottom: 8,
        }}
      >
        🎤 Microphone access is blocked
      </div>
      <div
        style={{
          fontSize: 14,
          color: '#78350f',
          marginBottom: 12,
        }}
      >
        {text}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '8px 14px',
            background: '#f59e0b',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Try Again
        </button>
        {onUseWriting && (
          <button
            onClick={onUseWriting}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: '#92400e',
              border: '1px solid #f59e0b',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Use writing instead
          </button>
        )}
      </div>
    </div>
  );
}
