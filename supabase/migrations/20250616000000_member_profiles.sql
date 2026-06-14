-- 회원 프로필 (로그인/회원가입)

CREATE TABLE IF NOT EXISTS member_profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  birth_yymmdd CHAR(6) NOT NULL,
  birth_gender_digit CHAR(1) NOT NULL,
  road_address TEXT NOT NULL,
  road_address_detail TEXT,
  zip_code TEXT,
  phone_number TEXT NOT NULL UNIQUE,
  usage_purpose TEXT NOT NULL,
  is_guest BOOLEAN NOT NULL DEFAULT false,
  guest_chat_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_member_profiles_phone ON member_profiles(phone_number);

ALTER TABLE member_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Service role only member_profiles" ON member_profiles
    FOR ALL USING (false) WITH CHECK (false);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
