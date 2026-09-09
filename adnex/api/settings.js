CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Значение по умолчанию для замка раздела "Вывод"
INSERT INTO app_settings (key, value)
VALUES ('withdraw_lock', '{"enabled": true, "requiredAdViews": 100}'::jsonb)
ON CONFLICT (key) DO NOTHING;
