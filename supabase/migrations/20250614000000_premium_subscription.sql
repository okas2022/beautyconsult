-- BM4 확장: B2C 프리미엄 구독 · 사용량 추적

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (plan_tier IN ('free', 'premium')),
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT
    CHECK (billing_cycle IS NULL OR billing_cycle IN ('monthly', 'annual')),
  ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS simulate_usage_month TEXT,
  ADD COLUMN IF NOT EXISTS simulate_usage_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_premium_until ON users(premium_until);

UPDATE users
SET plan_tier = 'premium'
WHERE is_premium = true AND plan_tier = 'free';
