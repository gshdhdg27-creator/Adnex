import { getPool } from "./_db.js";

const DEFAULTS = {
  withdraw_lock: { enabled: true, requiredAdViews: 100 },
  withdraw_visible: false,
  referral: { percent: 20, firstBonus: 5 },
  adsgram: { blockId: "", enabled: true },
  tasks: null,
  ad_networks: null,
  wheel: null,
  cases: null,
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const pool = getPool();
    const result = await pool.query("SELECT key, value FROM app_settings");
    const settings = { ...DEFAULTS };
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    if (typeof settings.withdraw_visible === "object" && settings.withdraw_visible !== null) {
      settings.withdraw_visible = Boolean(settings.withdraw_visible.value ?? settings.withdraw_visible);
    }
    return res.status(200).json({ settings });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ settings: DEFAULTS });
  }
}
