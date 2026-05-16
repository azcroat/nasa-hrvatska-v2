export interface StoryCatalogEntry {
  id: string;
  level: string;
  title: string;
  etag: string;
}

export interface GrammarCatalogEntry {
  id: string;
  level: string;
  title: string;
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
