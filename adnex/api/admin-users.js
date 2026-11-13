import { getPool } from "./_db.js";
import { verifyTelegramInitData } from "./_telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { initData, action, targetTelegramId, isBlocked } = req.body || {};
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

  if (String(verified.user.id) !== String(adminId)) {
    return res.status(403).json({ error: "Доступ запрещён" });
  }

  const pool = getPool();

  try {
    if (action === "set_blocked" && targetTelegramId != null) {
      await pool.query(
        "UPDATE users SET is_blocked = $1 WHERE telegram_id = $2",
        [Boolean(isBlocked), targetTelegramId]
      );
      return res.status(200).json({ ok: true });
    }

    if (action === "adjust_balance" && targetTelegramId != null) {
      const delta = Number(req.body.delta || 0);
      if (!Number.isFinite(delta)) {
        return res.status(400).json({ error: "Некорректный delta" });
      }
      const r = await pool.query(
        `UPDATE users SET balance = GREATEST(0, balance + $1),
         total_earned = CASE WHEN $1 > 0 THEN total_earned + $1 ELSE total_earned END
         WHERE telegram_id = $2 RETURNING balance, total_earned`,
        [delta, targetTelegramId]
      );
      if (r.rows.length === 0) {
        return res.status(404).json({ error: "Пользователь не найден" });
      }
      return res.status(200).json({
        ok: true,
        balance: Number(r.rows[0].balance),
        totalEarned: Number(r.rows[0].total_earned),
      });
    }

    const result = await pool.query(`
      SELECT
        u.id,
        u.telegram_id,
        u.username,
        u.balance,
        u.total_earned,
        u.is_blocked,
        u.created_at,
        (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.id) AS referrals_count
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT 300
    `);

    const users = result.rows.map((u) => ({
      id: u.id,
      telegramId: u.telegram_id,
      username: u.username,
      balance: Number(u.balance),
      totalEarned: Number(u.total_earned),
      isBlocked: Boolean(u.is_blocked),
      referralsCount: Number(u.referrals_count),
      createdAt: u.created_at,
    }));

    return res.status(200).json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
}
