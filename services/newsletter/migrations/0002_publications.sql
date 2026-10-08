CREATE TABLE IF NOT EXISTS newsletter_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL CHECK (language IN ('zh', 'en')),
  status TEXT NOT NULL,
  broadcast_id TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
