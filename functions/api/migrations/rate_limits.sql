-- Rate limits table for globally consistent per-PoP rate limiting
-- Run once via: Cloudflare Dashboard → D1 → AI_QUOTA_DB → Console → Execute
CREATE TABLE IF NOT EXISTS rate_limits (
  key           TEXT    PRIMARY KEY,
  count         INTEGER NOT NULL DEFAULT 0,
  window_minute INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
