import { getPool } from "./_db.js";
import { verifyTelegramInitData } from "./_telegram.js";

async function getReferralPercent(pool) {
  try {
    const r = await pool.query("SELECT value FROM app_settings WHERE key = 'referral'");
    return Number(r.rows[0]?.value?.percent ?? 20) / 100;
  } catch {
    return 0.2;
  }
}

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

  const reward = Number(amount);
  if (!Number.isFinite(reward) || reward < 0 || reward > 100000) {
    return res.status(400).json({ error: "Некорректная сумма" });
  }

  const pool = getPool();

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [verified.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "Пользователь не найден. Сначала откройте приложение заново." });
    }
    const dbUser = userRes.rows[0];

    if (dbUser.is_blocked) {
      return res.status(403).json({ error: "Аккаунт заблокирован" });
    }

    const isOnce = scope === "once";
    const limit = Math.max(1, Number(dailyLimit) || 1);

    const countQuery = isOnce
      ? "SELECT COALESCE(SUM(value),0) as total FROM daily_actions WHERE user_id = $1 AND action_key = $2"
      : "SELECT COALESCE(SUM(value),0) as total FROM daily_actions WHERE user_id = $1 AND action_key = $2 AND action_date = CURRENT_DATE";
    const countRes = await pool.query(countQuery, [dbUser.id, actionKey]);
    const currentCount = Number(countRes.rows[0].total);

    if (currentCount >= limit) {
      return res.status(409).json({ error: "Лимит исчерпан", countToday: currentCount });
    }

    // Транзакция: действие + баланс + реферал
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        "INSERT INTO daily_actions (user_id, action_key, action_date, value) VALUES ($1, $2, CURRENT_DATE, 1)",
        [dbUser.id, actionKey]
      );

      let newBalance = Number(dbUser.balance);
      let newTotal = Number(dbUser.total_earned);

      if (reward > 0) {
        const updated = await client.query(
          "UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2 RETURNING balance, total_earned",
          [reward, dbUser.id]
        );
        newBalance = Number(updated.rows[0].balance);
        newTotal = Number(updated.rows[0].total_earned);

        if (dbUser.referred_by) {
          const pct = await getReferralPercent(pool);
          const bonus = +(reward * pct).toFixed(6);
          if (bonus > 0) {
            await client.query(
              "UPDATE users SET balance = balance + $1, total_earned = total_earned + $1 WHERE id = $2",
              [bonus, dbUser.referred_by]
            );
            await client.query(
              "INSERT INTO referral_earnings (referrer_id, referred_id, amount, note) VALUES ($1, $2, $3, $4)",
              [dbUser.referred_by, dbUser.id, bonus, actionKey]
            );
          }
        }
      }

      await client.query("COMMIT");

      return res.status(200).json({
        ok: true,
        balance: newBalance,
        totalEarned: newTotal,
        countToday: currentCount + 1,
      });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
}
