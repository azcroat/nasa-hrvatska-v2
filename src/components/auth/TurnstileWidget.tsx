import React, { useEffect, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script';

interface TurnstileWidgetProps {
  sitekey: string;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          action?: string;
          theme?: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (document.getElementById(TURNSTILE_SCRIPT_ID)) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.turnstile) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({
  sitekey,
  action,
  theme = 'auto',
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey,
          action,
          theme,
          callback: (token) => {
            if (!cancelled) onVerify(token);
          },
          'expired-callback': () => {
            if (!cancelled && onExpire) onExpire();
          },
          'error-callback': () => {
            if (!cancelled && onError) onError();
          },
        });
      })
      .catch(() => {
        if (!cancelled) setScriptError(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore — widget already cleaned
        }
        widgetIdRef.current = null;
      }
    };
  }, [sitekey, action, theme, onVerify, onExpire, onError]);

  if (scriptError) {
    return (
      <div
        role="alert"
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--error)',
          textAlign: 'center',
          margin: '12px 0',
        }}
      >
        Could not load verification challenge. Disable any ad/script blockers and refresh.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '12px 0',
        minHeight: 65,
      }}
    >
      <div ref={containerRef} />
    </div>
  );
}
