import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Проверка, что сервер жив (Vercel и просто для себя)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// TODO: /api/auth — проверка Telegram initData (HMAC с BOT_TOKEN), логин/регистрация пользователя,
//       привязка ?startapp=REF_CODE к referred_by
// TODO: /api/me — баланс, статистика, прогресс до вывода
// TODO: /api/ads/callback — начисление баланса по серверному callback от Adsgram/Monetag
// TODO: /api/referrals — список рефералов и заработок
// TODO: /api/withdrawals — создание и история заявок на вывод
// TODO: /api/admin/* — защищённые эндпоинты админки (проверка ADMIN_TELEGRAM_ID)
// Полная схема БД и список эндпоинтов — см. ARCHITECTURE.md в корне репозитория

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`ADNEX backend running on port ${PORT}`);
});
