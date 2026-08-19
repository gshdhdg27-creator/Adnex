import { getPool } from "./_db.js";
import { verifyTelegramInitData } from "./_telegram.js";

function generateReferralCode() {
  return Math.random().toString(36).slice(2, 10);
}

async function fetchActions(pool, userId) {
  const res = await pool.query(
    "SELECT action_key, action_date::text as action_date, value FROM daily_actions WHERE user_id = $1",
    [userId]
  );
  return res.rows;
}

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

  const { user, startParam } = verified;
  const pool = getPool();

  try {
    const existing = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [user.id]);

    if (existing.rows.length > 0) {
      const u = existing.rows[0];
      const actions = await fetchActions(pool, u.id);
      return res.status(200).json({
        telegramId: u.telegram_id,
        username: u.username,
        balance: Number(u.balance),
        totalEarned: Number(u.total_earned),
        referralCode: u.referral_code,
        actions,
      });
    }

    let referredById = null;
    if (startParam) {
      const referrer = await pool.query("SELECT id FROM users WHERE referral_code = $1", [startParam]);
      if (referrer.rows.length > 0) {
        referredById = referrer.rows[0].id;
      }
    }

    const referralCode = generateReferralCode();
    const inserted = await pool.query(
      `INSERT INTO users (telegram_id, username, referred_by, referral_code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, user.username || null, referredById, referralCode]
    );

    const u = inserted.rows[0];
    return res.status(200).json({
      telegramId: u.telegram_id,
      username: u.username,
      balance: Number(u.balance),
      totalEarned: Number(u.total_earned),
      referralCode: u.referral_code,
      referredBy: referredById,
      actions: [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
}
