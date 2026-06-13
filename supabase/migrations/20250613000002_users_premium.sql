-- BM4: 프리미엄 멤버십 (B2C)

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only users" ON users
  FOR ALL
  USING (false)
  WITH CHECK (false);
