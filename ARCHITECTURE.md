# Earn Ads — Telegram Mini App: архитектура проекта

Отдельный новый проект (не часть TONYX-3). Стек: React + TypeScript (фронт) + Node.js/Express (бэк) + PostgreSQL, деплой на Vercel.

MVP-стратегия: сначала реальная реклама (Adsgram) + **ручной** вывод средств. Автоматический TON-эквайринг добавляется вторым этапом, когда логика начислений обкатана и защищена от накрутки.

---

## 1. Архитектура (обзор)

```
Telegram Client
   ↓ (WebApp)
Frontend (React SPA, Vercel static)
   ↓ (REST /api/*, initData в заголовке)
Backend (Express, Vercel serverless functions)
   ↓
PostgreSQL (Supabase/Neon — бесплатный тариф)
   ↓
Adsgram / Monetag SDK (rewarded ads, callback на бэк)
   ↓
Telegram Bot API (уведомления, /start с ref-параметром)
```

Ключевой принцип безопасности: **баланс начисляется только на бэкенде**, по серверному callback от рекламной сети или по проверенному Telegram initData — фронт никогда не может напрямую сказать "начисли мне $X".

---

## 2. Структура базы данных (PostgreSQL)

```sql
-- Пользователи
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  balance NUMERIC(12,6) NOT NULL DEFAULT 0,
  total_earned NUMERIC(12,6) NOT NULL DEFAULT 0,
  referred_by BIGINT REFERENCES users(id),
  referral_code TEXT UNIQUE NOT NULL,
  checkin_day INT NOT NULL DEFAULT 0,
  last_checkin_at TIMESTAMPTZ,
  ads_watched_today INT NOT NULL DEFAULT 0,
  earned_today NUMERIC(12,6) NOT NULL DEFAULT 0,
  day_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,
  fraud_score INT NOT NULL DEFAULT 0,        -- растёт при подозрительной активности
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Просмотры рекламы (лог + защита от накрутки)
CREATE TABLE ad_views (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) NOT NULL,
  ad_network TEXT NOT NULL,                  -- 'adsgram' | 'monetag' | 'banner'
  ad_type TEXT NOT NULL,                     -- 'rewarded' | 'banner_click'
  reward_amount NUMERIC(12,6) NOT NULL,
  network_callback_id TEXT UNIQUE,           -- id события от сети, для дедупликации
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Рефералы (начисления с активности приглашённых)
CREATE TABLE referral_earnings (
  id BIGSERIAL PRIMARY KEY,
  referrer_id BIGINT REFERENCES users(id) NOT NULL,
  referred_id BIGINT REFERENCES users(id) NOT NULL,
  source_ad_view_id BIGINT REFERENCES ad_views(id),
  amount NUMERIC(12,6) NOT NULL,             -- 20% от reward_amount реферала
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Задания
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  icon_url TEXT,
  reward_amount NUMERIC(12,6) NOT NULL,
  target_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_tasks (
  user_id BIGINT REFERENCES users(id) NOT NULL,
  task_id BIGINT REFERENCES tasks(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',    -- pending | completed | claimed
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, task_id)
);

-- Заявки на вывод
CREATE TABLE withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) NOT NULL,
  amount NUMERIC(12,6) NOT NULL,
  currency TEXT NOT NULL,                    -- 'USDT_TON' | 'TON' | 'STARS'
  wallet_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending',    -- pending | approved | paid | rejected
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_ad_views_user ON ad_views(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
```

---

## 3. Основные бэкенд-хендлеры (Express)

| Метод | Путь | Назначение |
|---|---|---|
| `POST` | `/api/auth` | Проверка Telegram `initData` (HMAC-подпись), создание/логин пользователя, привязка `?startapp=REF_CODE` |
| `GET` | `/api/me` | Баланс, статистика сегодня, прогресс до вывода, чек-ин статус |
| `POST` | `/api/ads/callback` | **Серверный** callback от Adsgram/Monetag после реального показа — начисляет баланс. Проверка подписи сети + дедупликация по `network_callback_id` |
| `POST` | `/api/checkin` | Ежедневный чек-ин, увеличивает `checkin_day`, выдаёт награду по таблице наград дня |
| `GET` | `/api/tasks` | Список активных заданий + статус выполнения для юзера |
| `POST` | `/api/tasks/:id/claim` | Забрать награду за задание (после проверки условия) |
| `GET` | `/api/referrals` | Список рефералов, сумма заработка, реф-ссылка |
| `POST` | `/api/withdrawals` | Создать заявку на вывод (проверка мин. суммы, баланса, валидности TON-адреса) |
| `GET` | `/api/withdrawals` | История выводов пользователя |
| `POST` | `/api/admin/withdrawals/:id/approve` | (админ, защищено токеном/твоим telegram_id) Подтвердить и провести выплату вручную |

**Антифрод-логика (в `/api/ads/callback` и middleware):**
- Проверка Telegram `initData` на каждый запрос (HMAC с bot token).
- Rate-limit: не больше 1 показа рекламы за N секунд на пользователя.
- Каждые 2–5 показов — обязательный "клик" подтверждения (как на скринах), иначе `reward_amount` снижается программно.
- `fraud_score` растёт при: слишком частых показах, одинаковом device fingerprint у разных telegram_id, VPN/датацентр IP. При превышении порога — `is_blocked = true`, вывод блокируется.

---

## 4. Фронтенд — структура (React + TS)

```
src/
  screens/
    Home.tsx           # баланс, прогресс, кнопки "Смотреть", чек-ин, индив. задание
    Ads.tsx             # запуск rewarded-рекламы, баннер, статистика
    Referrals.tsx       # реф-ссылка, список, сумма
    Withdraw.tsx        # форма вывода, история
    Tasks.tsx           # список заданий
  components/
    BalanceCard.tsx
    ProgressBar.tsx
    BottomNav.tsx       # Web3 | Рефералы | Главная | Реклама | Вывод
    CheckinBanner.tsx
    WatchAdButton.tsx   # обёртка над Adsgram SDK
  hooks/
    useTelegramAuth.ts  # инициализация Telegram.WebApp, initData
    useUser.ts          # баланс/статистика через React Query
  lib/
    api.ts              # обёртка fetch с initData в заголовке
```

**Интеграция Adsgram (пример):**
```ts
// components/WatchAdButton.tsx
const AdController = window.Adsgram.init({ blockId: "YOUR_BLOCK_ID" });

async function watchAd() {
  try {
    const result = await AdController.show(); // юзер посмотрел рекламу
    // result содержит подтверждение показа от SDK
    await api.post('/ads/report', { networkEventId: result.eventId });
    // баланс обновится через callback на бэке — рефетчим /api/me
  } catch (e) {
    // реклама не досмотрена / отменена — награда не начисляется
  }
}
```

Дизайн: тёмная тема (`#0a0e14` фон, синие акценты `#2b7fff`), карточки со скруглением 16px, крупные цифры баланса — как на референсных скринах.

---

## 5. Порядок разработки (для coding agent)

1. Схема БД + миграции + подключение к Supabase/Neon.
2. `/api/auth` с проверкой Telegram initData — без этого всё остальное небезопасно.
3. Экран Home + `/api/me` (статичные данные для проверки UI).
4. Интеграция Adsgram + `/api/ads/callback` — первая реальная монетизация.
5. Рефералы (начисление 20%) + Withdraw с ручным подтверждением.
6. Чек-ин, задания, антифрод-пороги.
7. (Этап 2) Автоматическая выплата через TON-кошелёк.

---

## 6. Что нужно от тебя перед стартом

- Зарегистрироваться в [Adsgram](https://adsgram.ai) или Monetag, получить `blockId`/API-ключ.
- Создать БД в Supabase (бесплатный тариф) — понадобится connection string.
- Решить: TON-кошелёк для приёма/выдачи выводов на первом этапе — обычный (ручной перевод) или сразу смотреть в сторону @wallet/Tonkeeper API.

Дальше могу превратить каждый пункт в конкретный промпт на русском для GitHub Copilot coding agent — начнём со схемы БД и `/api/auth`?
