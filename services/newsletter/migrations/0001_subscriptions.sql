CREATE TABLE IF NOT EXISTS subscriptions (
  email TEXT PRIMARY KEY,
  language TEXT NOT NULL CHECK (language IN ('zh', 'en', 'both')),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  requested_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  resend_contact_id TEXT
);
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS subscribers (
  email TEXT PRIMARY KEY,
  language TEXT NOT NULL CHECK (language IN ('zh', 'en', 'both')),
  confirmed_at INTEGER NOT NULL,
  resend_contact_id TEXT NOT NULL
);
