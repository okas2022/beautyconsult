-- BM2: B2B 구독 — 병원별 유튜브 RAG

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

CREATE POLICY "Service role only hospital_videos" ON hospital_videos
  FOR ALL
  USING (false)
  WITH CHECK (false);
