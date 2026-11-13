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
  if (!botToken) {
    return res.status(500).json({ error: "BOT_TOKEN не настроен на сервере" });
  }

  const verified = verifyTelegramInitData(initData, botToken);
  if (!verified || !verified.user) {
    return res.status(401).json({ error: "Неверная подпись Telegram initData" });
  }

  const pool = getPool();

  try {
    const userRes = await pool.query(
      "SELECT id, referral_code FROM users WHERE telegram_id = $1",
      [verified.user.id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    const me = userRes.rows[0];

    const refsRes = await pool.query(
      `SELECT
         u.telegram_id,
         u.username,
         u.created_at,
         u.total_earned,
         COALESCE((
           SELECT SUM(re.amount) FROM referral_earnings re
           WHERE re.referrer_id = $1 AND re.referred_id = u.id
         ), 0) AS earned_from
       FROM users u
       WHERE u.referred_by = $1
       ORDER BY u.created_at DESC
       LIMIT 200`,
      [me.id]
    );

    const earnedRes = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM referral_earnings WHERE referrer_id = $1",
      [me.id]
    );

    const settingsRes = await pool.query(
      "SELECT value FROM app_settings WHERE key = 'referral'"
    );
    const referralCfg = settingsRes.rows[0]?.value || { percent: 20, firstBonus: 5 };

    const botUsername = process.env.BOT_USERNAME || "Ad_nex_bot";

    return res.status(200).json({
      count: refsRes.rows.length,
      earned: Number(earnedRes.rows[0].total),
      percent: Number(referralCfg.percent ?? 20),
      firstBonus: Number(referralCfg.firstBonus ?? 5),
      link: `https://t.me/${botUsername}?startapp=${me.referral_code}`,
      referralCode: me.referral_code,
      list: refsRes.rows.map((r) => ({
        telegramId: r.telegram_id,
        username: r.username,
        joinedAt: r.created_at,
        totalEarned: Number(r.total_earned),
        earnedFrom: Number(r.earned_from),
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
}
