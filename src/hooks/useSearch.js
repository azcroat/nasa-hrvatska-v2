/**
 * useSearch — global vocabulary/screen search state
 *
 * Extracted from App.jsx. Owns the search query, results,
 * and open/close toggle. App.jsx receives these via destructuring.
 */
import { useState, useRef, useCallback } from 'react';

// buildSearchIndex is only needed when the user opens search — lazy import keeps
// chunk-data out of the startup bundle.
let _cachedIndex = null;
async function getCachedIndex() {
  if (!_cachedIndex) {
    const { buildSearchIndex } = await import('../data.jsx');
    _cachedIndex = buildSearchIndex();
  }
  return _cachedIndex;
}

export function useSearch() {
  const [srchQ, setSrchQ] = useState('');
  const [srchR, setSrchR] = useState([]);
  const [srchOpen, setSrchOpen] = useState(false);
  const debounceRef = useRef(null);

  const doSearch = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSrchR([]); return; }
    debounceRef.current = setTimeout(async () => {
      const idx = await getCachedIndex();
      const lq = q.toLowerCase();
      setSrchR(
        idx
          .filter(i =>
            (i.hr && i.hr.toLowerCase().includes(lq)) ||
            (i.en && i.en.toLowerCase().includes(lq))
          )
          .slice(0, 15)
      );
    }, 200);
  }, []);

  return { srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch };
}
