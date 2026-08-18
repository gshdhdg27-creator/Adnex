import { getPool } from "./_db.js";

export default async function handler(req, res) {
  try {
    const pool = getPool();
    const result = await pool.query("SELECT NOW() as time, (SELECT COUNT(*) FROM users) as users_count");
    return res.status(200).json({
      status: "ok",
      dbTime: result.rows[0].time,
      usersInDb: result.rows[0].users_count,
      botTokenSet: Boolean(process.env.BOT_TOKEN),
    });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}
