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

async function getReferralConfig(pool) {
  try {
    const r = await pool.query("SELECT value FROM app_settings WHERE key = 'referral'");
    return r.rows[0]?.value || { percent: 20, firstBonus: 5 };
  } catch {
    return { percent: 20, firstBonus: 5 };
  }
}

async function countReferrals(pool, userId) {
  const r = await pool.query(
    "SELECT COUNT(*)::int AS c FROM users WHERE referred_by = $1",
    [userId]
  );
  return r.rows[0].c;
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
      // Обновляем username если изменился
      if (user.username && user.username !== u.username) {
        await pool.query("UPDATE users SET username = $1 WHERE id = $2", [user.username, u.id]);
        u.username = user.username;
      }
      const actions = await fetchActions(pool, u.id);
      const referralsCount = await countReferrals(pool, u.id);
      return res.status(200).json({
        telegramId: u.telegram_id,
        username: u.username,
        balance: Number(u.balance),
        totalEarned: Number(u.total_earned),
        referralCode: u.referral_code,
        referralsCount,
        checkinDay: u.checkin_day || 0,
        isBlocked: Boolean(u.is_blocked),
        actions,
      });
    }

    // Новый пользователь
    let referredById = null;
    if (startParam) {
      const referrer = await pool.query(
        "SELECT id FROM users WHERE referral_code = $1",
        [startParam]
      );
      if (referrer.rows.length > 0 && referrer.rows[0].id) {
        referredById = referrer.rows[0].id;
      }
    }

    let referralCode = generateReferralCode();
    for (let i = 0; i < 5; i++) {
      const clash = await pool.query("SELECT 1 FROM users WHERE referral_code = $1", [referralCode]);
      if (clash.rows.length === 0) break;
      referralCode = generateReferralCode();
    }

    const inserted = await pool.query(
      `INSERT INTO users (telegram_id, username, referred_by, referral_code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user.id, user.username || null, referredById, referralCode]
    );

    const u = inserted.rows[0];

    // Бонус рефереру за первого приглашённого (разовый)
    if (referredById) {
      const cfg = await getReferralConfig(pool);
      const firstBonus = Number(cfg.firstBonus ?? 5);
      if (firstBonus > 0) {
        await pool.query(
          "UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2",
          [firstBonus, referredById]
        );
        await pool.query(
          `INSERT INTO referral_earnings (referrer_id, referred_id, amount, note)
           VALUES ($1, $2, $3, $4)`,
          [referredById, u.id, firstBonus, "first_invite"]
        );
      }
    }

    return res.status(200).json({
      telegramId: u.telegram_id,
      username: u.username,
      balance: Number(u.balance),
      totalEarned: Number(u.total_earned),
      referralCode: u.referral_code,
      referredBy: referredById,
      referralsCount: 0,
      checkinDay: 0,
      isBlocked: false,
      actions: [],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error", detail: String(err.message || err) });
  }
}
