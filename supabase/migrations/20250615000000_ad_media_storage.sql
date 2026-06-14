-- 광고 미디어 Supabase Storage 버킷 (관리자 업로드 → 앱 공개 URL)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ad-media',
  'ad-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$ BEGIN
  CREATE POLICY "ad_media_public_read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'ad-media');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
