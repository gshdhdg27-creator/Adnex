import { getPool } from "./_db.js";
import { verifyTelegramInitData } from "./_telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { initData, actionKey, amount, dailyLimit, scope } = req.body || {};
  if (!initData || !actionKey || amount === undefined || amount === null) {
    return res.status(400).json({ error: "initData, actionKey и amount обязательны" });
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
    const userRes = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [verified.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден. Сначала откройте приложение заново." });
    }
    const dbUser = userRes.rows[0];

    const isOnce = scope === "once";
    const limit = dailyLimit || 1;

    const countQuery = isOnce
      ? "SELECT COALESCE(SUM(value),0) as total FROM daily_actions WHERE user_id = $1 AND action_key = $2"
      : "SELECT COALESCE(SUM(value),0) as total FROM daily_actions WHERE user_id = $1 AND action_key = $2 AND action_date = CURRENT_DATE";
    const countRes = await pool.query(countQuery, [dbUser.id, actionKey]);
    const currentCount = Number(countRes.rows[0].total);

    if (currentCount >= limit) {
      return res.status(409).json({ error: "Лимит на сегодня исчерпан", countToday: currentCount });
    }

    await pool.query(
      "INSERT INTO daily_actions (user_id, action_key, action_date, value) VALUES ($1, $2, CURRENT_DATE, 1)",
      [dbUser.id, actionKey]
    );

    const updated = await pool.query(
      "UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2 RETURNING balance, total_earned",
      [amount, dbUser.id]
    );

    if (dbUser.referred_by && Number(amount) > 0) {
      const bonus = Number(amount) * 0.2;
      await pool.query(
        "UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2",
        [bonus, dbUser.referred_by]
      );
      await pool.query(
        "INSERT INTO referral_earnings (referrer_id, referred_id, amount) VALUES ($1, $2, $3)",
        [dbUser.referred_by, dbUser.id, bonus]
      );
    }

    return res.status(200).json({
      ok: true,
      balance: Number(updated.rows[0].balance),
      totalEarned: Number(updated.rows[0].total_earned),
      countToday: currentCount + 1,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
}
