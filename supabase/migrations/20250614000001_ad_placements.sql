-- 앱 내 광고 슬롯 (관리자 on/off · 미디어 URL)

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
