/**
 * useSearch — global vocabulary/screen search state
 *
 * Extracted from App.jsx. Owns the search query, results,
 * and open/close toggle. App.jsx receives these via destructuring.
 */
import { useState, useRef, useCallback } from 'react';
import { buildSearchIndex } from '../data.jsx';

let _cachedIndex = null;
function getCachedIndex() {
  if (!_cachedIndex) _cachedIndex = buildSearchIndex();
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
    debounceRef.current = setTimeout(() => {
      const idx = getCachedIndex();
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
