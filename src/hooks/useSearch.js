/**
 * useSearch — global vocabulary/screen search state
 *
 * Extracted from App.jsx. Owns the search query, results,
 * and open/close toggle. App.jsx receives these via destructuring.
 */
import { useState } from 'react';
import { buildSearchIndex } from '../data.jsx';

export function useSearch() {
  const [srchQ, setSrchQ] = useState('');
  const [srchR, setSrchR] = useState([]);
  const [srchOpen, setSrchOpen] = useState(false);

  function doSearch(q) {
    if (!q.trim()) { setSrchR([]); return; }
    const idx = buildSearchIndex();
    const lq = q.toLowerCase();
    setSrchR(
      idx
        .filter(i =>
          (i.hr && i.hr.toLowerCase().includes(lq)) ||
          (i.en && i.en.toLowerCase().includes(lq))
        )
        .slice(0, 15)
    );
  }

  return { srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch };
}
