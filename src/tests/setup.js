import '@testing-library/jest-dom';

// ── localStorage polyfill for jsdom 28+ ──────────────────────────────────────
// jsdom 28 removed built-in localStorage/sessionStorage. Provide a simple
// in-memory implementation that supports all standard Web Storage methods.
function createStorageMock() {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  });
}

if (typeof sessionStorage === 'undefined' || typeof sessionStorage.getItem !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: createStorageMock(),
    writable: true,
    configurable: true,
  });
}
