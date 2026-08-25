import { getPool } from "./_db.js";
import { verifyTelegramInitData } from "./_telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { initData } = req.body || {};
  if (!initData) {
    return res.status(400).json({ error: "initData is required" });
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

  // Доступ только для админа — проверяем на сервере, а не только на фронтенде
  if (String(verified.user.id) !== String(adminId)) {
    return res.status(403).json({ error: "Доступ запрещён" });
  }

  const pool = getPool();

  try {
    const result = await pool.query(`
      SELECT
        u.id,
        u.telegram_id,
        u.username,
        u.balance,
        u.total_earned,
        u.created_at,
        (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.id) AS referrals_count
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 200
    `);

    const users = result.rows.map((u) => ({
      id: u.id,
      telegramId: u.telegram_id,
      username: u.username,
      balance: Number(u.balance),
      totalEarned: Number(u.total_earned),
      referralsCount: Number(u.referrals_count),
      createdAt: u.created_at,
    }));

    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
}
