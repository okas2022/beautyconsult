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

-- ========== 20250613000004_da_hospital_seed.sql ==========
INSERT INTO hospitals (id, name, is_subscribed)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '디에이성형외과',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_subscribed = EXCLUDED.is_subscribed;

-- ========== 20250613000005_hospital_network_partnership.sql ==========
ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS partnership_status TEXT NOT NULL DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS cpa_fee_krw INTEGER,
  ADD COLUMN IF NOT EXISTS revenue_share_pct NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS youtube_channels JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'prefit_chat',
  ADD COLUMN IF NOT EXISTS commission_status TEXT NOT NULL DEFAULT 'pending';

INSERT INTO hospitals (id, name, is_subscribed, slug, category, specialties, partnership_status, description)
VALUES
  ('00000000-0000-0000-0000-000000000001', '위드성형외과', true, 'with', 'mega', ARRAY['눈','코','가슴','리프팅'], 'active', 'PoC 제휴'),
  ('00000000-0000-0000-0000-000000000002', '아이디병원', true, 'id-hospital', 'mega', ARRAY['눈','코','가슴','양악','윤곽'], 'prospect', '국내 최대 규모'),
  ('00000000-0000-0000-0000-000000000003', '디에이성형외과', true, 'da-plastic', 'mega', ARRAY['눈','코','가슴','리프팅','윤곽'], 'prospect', '쇼츠·브이로그'),
  ('00000000-0000-0000-0000-000000000004', '바노바기성형외과', true, 'banobagi', 'mega', ARRAY['눈','코','가슴','안티에이징'], 'prospect', '렛미인·메이크오버'),
  ('00000000-0000-0000-0000-000000000005', '원진성형외과', true, 'wonjin', 'mega', ARRAY['눈','코','가슴','윤곽'], 'prospect', '글로벌 다국어'),
  ('00000000-0000-0000-0000-000000000006', '365mc', true, '365mc', 'specialty', ARRAY['지방흡입','다이어트','체형'], 'prospect', '지방이 IP'),
  ('00000000-0000-0000-0000-000000000007', '리팅성형외과', true, 'lifting', 'specialty', ARRAY['리프팅','안면거상','중년'], 'prospect', '리프팅 특화'),
  ('00000000-0000-0000-0000-000000000008', '엠디성형외과', true, 'md-breast', 'specialty', ARRAY['가슴','보형물','구형구축'], 'prospect', '가슴 특화'),
  ('00000000-0000-0000-0000-000000000009', '라이안성형외과', true, 'ryan', 'specialty', ARRAY['가슴','보형물'], 'prospect', '가슴 Q&A'),
  ('00000000-0000-0000-0000-00000000000a', '에이비성형외과', true, 'ab', 'trend', ARRAY['눈','코','윤곽'], 'prospect', '2030 MZ'),
  ('00000000-0000-0000-0000-00000000000b', '티에스성형외과', true, 'ts', 'trend', ARRAY['눈','코','상담','라이브'], 'prospect', '티에스TV'),
  ('00000000-0000-0000-0000-00000000000c', '브라운성형외과', true, 'brown', 'trend', ARRAY['코','윤곽','회복'], 'prospect', '코·윤곽 리얼리티')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_subscribed = EXCLUDED.is_subscribed,
  slug = EXCLUDED.slug,
  category = EXCLUDED.category,
  specialties = EXCLUDED.specialties,
  partnership_status = EXCLUDED.partnership_status,
  description = EXCLUDED.description;

UPDATE hospitals SET cpa_fee_krw = 50000, revenue_share_pct = 10.00
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ========== 20250614000000_premium_subscription.sql ==========
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

-- ========== 20250614000001_ad_placements.sql ==========
CREATE TABLE IF NOT EXISTS ad_placements (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  media_type TEXT CHECK (media_type IS NULL OR media_type IN ('image', 'video')),
  media_url TEXT,
  click_url TEXT,
  alt_text TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role only ad_placements" ON ad_placements
    FOR ALL USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

INSERT INTO ad_placements (id, label, description, is_enabled)
VALUES
  ('chat_messages_top', '상담하기 · 대화 상단', '환영 메시지 아래, 대화 목록 최상단', false),
  ('chat_input_above', '상담하기 · 입력창 위', '채팅 입력창 바로 위 배너', false),
  ('trend_feed_top', '트렌드 · 피드 상단', '랭킹 캐러셀 아래, Q&A 피드 위', false),
  ('mypage_membership_below', '마이페이지 · 멤버십 아래', 'Premium 카드와 메뉴 사이', false),
  ('simulate_header_below', '시뮬레이터 · 헤더 아래', '멤버십 카드 아래, 업로드 영역 위', false)
ON CONFLICT (id) DO NOTHING;
