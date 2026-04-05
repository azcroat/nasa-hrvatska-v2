-- AI quota tracking — globally consistent via D1 (SQLite at the edge).
-- Replaces the per-datacenter Cache API fallback in _aiQuota.js.

CREATE TABLE IF NOT EXISTS ai_quota (
  subject     TEXT    PRIMARY KEY,
  turns       INTEGER NOT NULL DEFAULT 0,
  window_date TEXT    NOT NULL  -- YYYY-MM-DD; resets when date changes
);

CREATE TABLE IF NOT EXISTS ai_burst (
  subject      TEXT    PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_second INTEGER NOT NULL  -- Unix second; resets per second
);
