-- BM5: 병원 네트워크 · 리퍼럴/CPA 파트너십 확장

ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IS NULL OR category IN ('mega', 'specialty', 'trend')),
  ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS partnership_status TEXT NOT NULL DEFAULT 'prospect'
    CHECK (partnership_status IN ('prospect', 'negotiating', 'active', 'paused')),
  ADD COLUMN IF NOT EXISTS cpa_fee_krw INTEGER,
  ADD COLUMN IF NOT EXISTS revenue_share_pct NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS youtube_channels JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS referral_source TEXT NOT NULL DEFAULT 'prefit_chat',
  ADD COLUMN IF NOT EXISTS commission_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (commission_status IN ('pending', 'approved', 'paid', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_hospitals_category ON hospitals(category);
CREATE INDEX IF NOT EXISTS idx_hospitals_partnership ON hospitals(partnership_status);
CREATE INDEX IF NOT EXISTS idx_leads_commission ON leads(commission_status);

-- 네트워크 병원 시드 (UUID 고정)
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
