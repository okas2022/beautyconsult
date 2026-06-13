-- 아이디병원 (ID Hospital) 시드

INSERT INTO hospitals (id, name, is_subscribed)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '아이디병원',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_subscribed = EXCLUDED.is_subscribed;
