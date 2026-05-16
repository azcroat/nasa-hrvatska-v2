// Display metadata only — full body lives behind /api/content/stories/{id}.
export interface StoryCatalogEntry {
  id: string;
  level: string;
  title: string;
  titleEn: string;
  focus: string;
  icon: string;
  duration: number;
  intro: string;
  levelColor: string;
  levelBg: string;
  etag: string;
}

export interface GrammarCatalogEntry {
  id: string;
  level: string;
  title: string;
  subtitle: string;
  focus: string;
  etag: string;
}

export interface ContentCatalog {
  stories: StoryCatalogEntry[];
  grammarUnits: GrammarCatalogEntry[];
}

export type Story = Record<string, unknown> & { id: string };
export type GrammarUnit = Record<string, unknown> & { id: string };

export class ContentAuthError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'ContentAuthError';
  }
}

export class ContentNotFoundError extends Error {
  constructor(public id: string) {
    super(`not_found: ${id}`);
    this.name = 'ContentNotFoundError';
  }
}

export class ContentRateLimitError extends Error {
  constructor(public retryAt: string) {
    super('rate_limited');
    this.name = 'ContentRateLimitError';
  }
}

export class ContentOfflineError extends Error {
  constructor() {
    super('offline_no_cache');
    this.name = 'ContentOfflineError';
  }
}

export class ContentFetchError extends Error {
  constructor(public status: number) {
    super(`fetch_failed: ${status}`);
    this.name = 'ContentFetchError';
  }
}

// SP11b: full grammar module shape (all 13 exports).
// Subfields are intentionally loose (Record<string, unknown> | unknown[]) - drill
// components type-narrow as needed. Tightening here would require duplicating
// every nested schema in functions/api/content/_data/grammar.js.
export interface Grammar {
  PADEZI: Record<string, unknown>;
  GRAM: Record<string, unknown>;
  CONJ: Record<string, unknown>;
  MODAL: Record<string, unknown>;
  TENSES: Record<string, unknown>;
  ASPECT: Record<string, unknown>;
  ASPECT_PAIRS: unknown[];
  CONDITIONAL: Record<string, unknown>;
  FORMAL_REGISTER: Record<string, unknown>;
  IMPERSONAL: Record<string, unknown>;
  PHONOLOGY: Record<string, unknown>;
  PITCH_ACCENT: unknown[];
  PADEZI_FULL: Record<string, unknown>;
}
