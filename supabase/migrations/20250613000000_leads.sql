-- BM1: CPA/CPL 환자 매칭 — Lead 수집 스키마

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

-- 기본 제휴 병원 (단일 테넌트 PoC)
INSERT INTO hospitals (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'PreFit 제휴 성형외과')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 서비스 롤(서버)만 접근 — 클라이언트 직접 접근 차단
CREATE POLICY "Service role only" ON leads
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role only hospitals" ON hospitals
  FOR ALL
  USING (false)
  WITH CHECK (false);
