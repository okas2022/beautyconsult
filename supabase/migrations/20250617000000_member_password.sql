-- 회원 비밀번호 (이름 + 비밀번호 로그인)

ALTER TABLE member_profiles
  ADD COLUMN IF NOT EXISTS password_hash TEXT;
