-- 디에이성형외과 (DA Plastic Surgery) 시드

INSERT INTO hospitals (id, name, is_subscribed)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '디에이성형외과',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_subscribed = EXCLUDED.is_subscribed;
