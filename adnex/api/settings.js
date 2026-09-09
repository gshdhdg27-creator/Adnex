import { getPool } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pool = getPool();

  try {
    const result = await pool.query("SELECT key, value FROM app_settings");
    const settings = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return res.status(200).json({ settings });
  } catch (err) {
    console.error(err);
    // Если таблицы ещё нет или что-то пошло не так — отдаём безопасные значения по умолчанию,
    // чтобы приложение не сломалось для обычных пользователей.
    return res.status(200).json({
      settings: { withdraw_lock: { enabled: true, requiredAdViews: 100 } },
    });
  }
}
