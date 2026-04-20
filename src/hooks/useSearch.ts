/**
 * useSearch — global vocabulary/screen search state
 *
 * Extracted from App.jsx. Owns the search query, results,
 * and open/close toggle. App.jsx receives these via destructuring.
 */
import { useState, useRef, useCallback } from 'react';

export interface SearchResult {
  hr?: string;
  en?: string;
  [key: string]: unknown;
}

// buildSearchIndex is only needed when the user opens search — lazy import keeps
// chunk-data out of the startup bundle.
let _cachedIndex: SearchResult[] | null = null;
async function getCachedIndex(): Promise<SearchResult[]> {
  if (!_cachedIndex) {
    const { buildSearchIndex } = await import('../data');
    _cachedIndex = (buildSearchIndex as () => SearchResult[])();
  }
  return _cachedIndex;
}

export function useSearch(): {
  srchQ: string;
  setSrchQ: React.Dispatch<React.SetStateAction<string>>;
  srchR: SearchResult[];
  srchOpen: boolean;
  setSrchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  doSearch: (q: string) => void;
} {
  const [srchQ, setSrchQ] = useState('');
  const [srchR, setSrchR] = useState<SearchResult[]>([]);
  const [srchOpen, setSrchOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback((q: string): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSrchR([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const idx = await getCachedIndex();
      const lq = q.toLowerCase();
      setSrchR(
        idx
          .filter(
            (i) =>
              (i.hr && i.hr.toLowerCase().includes(lq)) ||
              (i.en && i.en.toLowerCase().includes(lq)),
          )
          .slice(0, 15),
      );
    }, 200);
  }, []);

  return { srchQ, setSrchQ, srchR, srchOpen, setSrchOpen, doSearch };
}
