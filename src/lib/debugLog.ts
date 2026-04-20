// On-screen debug logger — tablet diagnostics without a connected debugger.
// Import dbgInfo / dbgWarn / dbgError from this module to write to the overlay.

export type LogLevel = 'info' | 'warn' | 'error';
export interface LogEntry {
  t: number;
  level: LogLevel;
  msg: string;
}

const MAX_ENTRIES = 80;
const _entries: LogEntry[] = [];

function _fmt(...args: unknown[]): string {
  return args
    .map((a) => {
      if (a instanceof Error)
        return `${a.name}: ${a.message}${a.stack ? '\n' + a.stack.split('\n').slice(1, 3).join('\n') : ''}`;
      if (typeof a === 'object' && a !== null) {
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      }
      return String(a ?? '');
    })
    .join(' ');
}

function _push(level: LogLevel, msg: string) {
  _entries.push({ t: Date.now(), level, msg });
  if (_entries.length > MAX_ENTRIES) _entries.splice(0, _entries.length - MAX_ENTRIES);
  window.dispatchEvent(new Event('nh:debuglog'));
}

export function dbgInfo(...args: unknown[]): void {
  const m = _fmt(...args);
  console.info('[DBG]', m);
  _push('info', m);
}
export function dbgWarn(...args: unknown[]): void {
  const m = _fmt(...args);
  console.warn('[DBG]', m);
  _push('warn', m);
}
export function dbgError(...args: unknown[]): void {
  const m = _fmt(...args);
  console.error('[DBG]', m);
  _push('error', m);
}

export function getEntries(): readonly LogEntry[] {
  return _entries;
}
export function clearEntries(): void {
  _entries.length = 0;
  window.dispatchEvent(new Event('nh:debuglog'));
}

// Intercept unhandled errors and promise rejections so they appear on screen too.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    _push('error', `Unhandled error: ${e.message} @ ${e.filename}:${e.lineno}`);
  });
  window.addEventListener('unhandledrejection', (e) => {
    _push('error', `Unhandled promise rejection: ${_fmt(e.reason)}`);
  });
}
