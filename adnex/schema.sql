-- ADNEX PostgreSQL schema (Supabase / Neon)
-- Выполни один раз в SQL Editor

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  balance NUMERIC(12,6) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,6) NOT NULL DEFAULT 0,
  referred_by BIGINT REFERENCES users(id),
  referral_code TEXT UNIQUE NOT NULL,
  checkin_day INT NOT NULL DEFAULT 0,
  last_checkin_at TIMESTAMPTZ,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_actions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) NOT NULL,
  action_key TEXT NOT NULL,
  action_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC(12,6) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_actions_user_key_date
  ON daily_actions(user_id, action_key, action_date);

CREATE TABLE IF NOT EXISTS referral_earnings (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT REFERENCES users(id) NOT NULL,
  referred_id BIGINT REFERENCES users(id) NOT NULL,
  amount NUMERIC(12,6) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Дефолтные настройки (не перезаписывают, если уже есть)
INSERT INTO app_settings (key, value) VALUES
  ('withdraw_lock', '{"enabled": true, "requiredAdViews": 100}'::jsonb),
  ('withdraw_visible', 'false'::jsonb),
  ('referral', '{"percent": 20, "firstBonus": 5}'::jsonb),
  ('adsgram', '{"blockId": "", "enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
