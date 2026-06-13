-- PreFit 전체 스키마 (Supabase SQL Editor에 붙여넣기)
-- 순서: leads → hospital_videos → users_premium

-- ========== 20250613000000_leads.sql ==========
CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id TEXT NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
  phone_number TEXT NOT NULL,
  consultation_summary TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'contacted', 'visited')),
  video_id TEXT,
  video_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_hospital_id ON leads(hospital_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

INSERT INTO hospitals (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'PreFit 제휴 성형외과')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role only" ON leads FOR ALL USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role only hospitals" ON hospitals FOR ALL USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========== 20250613000001_hospital_videos.sql ==========
ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN NOT NULL DEFAULT false;

UPDATE hospitals
SET is_subscribed = true
WHERE id = '00000000-0000-0000-0000-000000000001';

CREATE TABLE IF NOT EXISTS hospital_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT NOT NULL,
  transcripts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hospital_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_hospital_videos_hospital_id ON hospital_videos(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hospital_videos_video_id ON hospital_videos(video_id);

ALTER TABLE hospital_videos ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role only hospital_videos" ON hospital_videos FOR ALL USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========== 20250613000002_users_premium.sql ==========
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_is_premium ON users(is_premium);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role only users" ON users FOR ALL USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========== 20250613000003_id_hospital_seed.sql ==========
INSERT INTO hospitals (id, name, is_subscribed)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '아이디병원',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_subscribed = EXCLUDED.is_subscribed;
