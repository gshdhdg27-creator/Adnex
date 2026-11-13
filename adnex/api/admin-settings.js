import { getPool } from "./_db.js";
import { verifyTelegramInitData } from "./_telegram.js";

const ALLOWED_KEYS = new Set([
  "withdraw_lock",
  "withdraw_visible",
  "referral",
  "adsgram",
  "tasks",
  "ad_networks",
  "wheel",
  "cases",
]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { initData, key, value } = req.body || {};
  if (!initData || !key || value === undefined) {
    return res.status(400).json({ error: "initData, key и value обязательны" });
  }

  if (!ALLOWED_KEYS.has(key)) {
    return res.status(400).json({ error: `Ключ «${key}» не разрешён` });
  }

  const botToken = process.env.BOT_TOKEN;
  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (!botToken || !adminId) {
    return res.status(500).json({ error: "BOT_TOKEN или ADMIN_TELEGRAM_ID не настроены на сервере" });
  }

  const verified = verifyTelegramInitData(initData, botToken);
  if (!verified || !verified.user) {
    return res.status(401).json({ error: "Неверная подпись Telegram initData" });
  }

  if (String(verified.user.id) !== String(adminId)) {
    return res.status(403).json({ error: "Доступ запрещён" });
  }

  const pool = getPool();

  try {
    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = $2::jsonb, updated_at = now()`,
      [key, JSON.stringify(value)]
    );
    return res.status(200).json({ ok: true, key });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
}
