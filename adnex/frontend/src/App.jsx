import React, { useState, useEffect, useRef } from "react";
import { Users, Home, ListChecks, CreditCard, Copy, Share2, ChevronRight, ChevronLeft, Check, Settings, X, Plus, Trash2, ShieldOff, ShieldCheck, Gift, Lock } from "lucide-react";

// ---------- Theme (ADNEX palette: cyan → purple gradient on black) ----------
const theme = {
  bg: "#000000",
  card: "#0d0d12",
  cardBorder: "rgba(255,255,255,0.07)",
  cyan: "#22d3ee",
  purple: "#8b5cf6",
  accent: "#3fa9f5", // fallback flat accent (progress track fill, text)
  accentDark: "#7c3aed",
  accentSoft: "rgba(139,92,246,0.15)",
  accentSoftBorder: "rgba(139,92,246,0.35)",
  accentLight: "#22d3ee",
  gradient: "linear-gradient(90deg, #22d3ee 0%, #8b5cf6 100%)",
  gradientV: "linear-gradient(180deg, #22d3ee 0%, #8b5cf6 100%)",
  gradientSoft: "linear-gradient(90deg, rgba(34,211,238,0.14) 0%, rgba(139,92,246,0.14) 100%)",
  panel: "#12101c",
  panelAlt: "#151320",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.45)",
  textFaint: "rgba(255,255,255,0.28)",
  divider: "rgba(255,255,255,0.08)",
  track: "rgba(255,255,255,0.1)",
  yellow: "#f5c518",
};

// ---------- Реальные настройки ----------
const ADMIN_TELEGRAM_ID = 2145640263; // твой Telegram ID — админка видна только тебе
const BOT_USERNAME = "Ad_nex_bot"; // username бота без @

const mockPendingWithdrawals = []; // заявки на вывод появятся здесь по мере поступления от пользователей

const mockUsersList = []; // список пользователей будет наполняться реальными данными из БД

const mockWheelSegments = [
  { id: "w1", label: "$0.001", value: 0.001 },
  { id: "w2", label: "$0.0005", value: 0.0005 },
  { id: "w3", label: "$0.005", value: 0.005 },
  { id: "w4", label: "$0.0002", value: 0.0002 },
  { id: "w5", label: "$0.02", value: 0.02 },
  { id: "w6", label: "$0.0008", value: 0.0008 },
  { id: "w7", label: "$0.001", value: 0.001 },
  { id: "w8", label: "$0.05", value: 0.05 },
];

const mockWheelConfig = {
  maxSpinsPerDay: 20,
  adsPerSpin: 1, // сколько просмотров рекламы даёт +1 прокрутку
};

const mockCases = [
  {
    id: "daily", title: "Ежедневный кейс", desc: "Бесплатно, раз в день", type: "daily",
    requiredAds: 0, openedToday: false,
    pool: [
      { id: "p1", amount: 0.0003, percent: 45, quantity: 999 },
      { id: "p2", amount: 0.0008, percent: 30, quantity: 500 },
      { id: "p3", amount: 0.002, percent: 15, quantity: 200 },
      { id: "p4", amount: 0.005, percent: 8, quantity: 50 },
      { id: "p5", amount: 0.02, percent: 2, quantity: 5 },
    ],
  },
  {
    id: "ad1", title: "Кейс «1 реклама»", desc: "Посмотри 1 рекламу", type: "daily",
    requiredAds: 1, watchedAds: 0, openedToday: false,
    pool: [
      { id: "p1", amount: 0.0006, percent: 40, quantity: 999 },
      { id: "p2", amount: 0.0015, percent: 30, quantity: 400 },
      { id: "p3", amount: 0.004, percent: 18, quantity: 150 },
      { id: "p4", amount: 0.01, percent: 9, quantity: 40 },
      { id: "p5", amount: 0.04, percent: 3, quantity: 5 },
    ],
  },
  {
    id: "ad3", title: "Кейс «3 рекламы»", desc: "Посмотри 3 рекламы", type: "daily",
    requiredAds: 3, watchedAds: 0, openedToday: false,
    pool: [
      { id: "p1", amount: 0.002, percent: 38, quantity: 999 },
      { id: "p2", amount: 0.005, percent: 28, quantity: 300 },
      { id: "p3", amount: 0.012, percent: 20, quantity: 100 },
      { id: "p4", amount: 0.03, percent: 10, quantity: 30 },
      { id: "p5", amount: 0.1, percent: 4, quantity: 5 },
    ],
  },
  {
    id: "ad5", title: "Кейс «5 реклам»", desc: "Посмотри 5 реклам", type: "daily",
    requiredAds: 5, watchedAds: 0, openedToday: false,
    pool: [
      { id: "p1", amount: 0.004, percent: 35, quantity: 999 },
      { id: "p2", amount: 0.01, percent: 27, quantity: 200 },
      { id: "p3", amount: 0.025, percent: 20, quantity: 80 },
      { id: "p4", amount: 0.06, percent: 13, quantity: 25 },
      { id: "p5", amount: 0.2, percent: 5, quantity: 4 },
    ],
  },
  {
    id: "ad10", title: "Кейс «10 реклам»", desc: "Посмотри 10 реклам", type: "daily",
    requiredAds: 10, watchedAds: 0, openedToday: false,
    pool: [
      { id: "p1", amount: 0.01, percent: 32, quantity: 999 },
      { id: "p2", amount: 0.025, percent: 26, quantity: 150 },
      { id: "p3", amount: 0.06, percent: 20, quantity: 60 },
      { id: "p4", amount: 0.15, percent: 15, quantity: 20 },
      { id: "p5", amount: 0.5, percent: 7, quantity: 4 },
    ],
  },
  {
    id: "friends5", title: "Кейс «Пригласи 5 друзей»", desc: "Разовая награда", type: "once",
    requiredRefs: 5, currentRefs: 0, opened: false,
    pool: [
      { id: "p1", amount: 0.03, percent: 35, quantity: 999 },
      { id: "p2", amount: 0.08, percent: 30, quantity: 200 },
      { id: "p3", amount: 0.15, percent: 20, quantity: 60 },
      { id: "p4", amount: 0.3, percent: 12, quantity: 20 },
      { id: "p5", amount: 1, percent: 3, quantity: 3 },
    ],
  },
];

const mockUser = {
  balance: 0,
  minWithdraw: 2,
  todayViews: 0,
  todayEarned: 0,
  checkinDay: 0,
  checkinTotal: 21,
  totalEarned: 0,
  adsWatchedTotal: 0,
};

const mockReferrals = {
  count: 0,
  earned: 0,
  link: "", // подставится реальная ссылка после авторизации через Telegram
  percent: 20,
  firstBonus: 0.01,
};

const mockWithdrawHistory = []; // история выводов пуста, пока пользователь не сделает первый вывод

const mockAdNetworks = [
  { id: "adsgram", name: "Adsgram", reward: 0.0002, viewsToday: 0, dailyLimit: 50, enabled: true },
  { id: "adexium", name: "Adexium", reward: 0.00015, viewsToday: 0, dailyLimit: 50, enabled: true },
  { id: "monetag", name: "Monetag", reward: 0.00025, viewsToday: 0, dailyLimit: 50, enabled: true },
  { id: "adshub", name: "Adshub", reward: 0.0001, viewsToday: 0, dailyLimit: 50, enabled: true },
];

const mockTasks = [
  { id: 1, icon: "🎰", title: "Подпишись на PM Casino", desc: "Спонсор", reward: 0.001, status: "open" },
  { id: 2, icon: "📢", title: "Подпишись на канал CryptoNews", desc: "Спонсор", reward: 0.001, status: "open" },
  { id: 3, icon: "🎮", title: "Установи приложение GameZone", desc: "Спонсор", reward: 0.003, status: "open" },
  { id: 4, icon: "💬", title: "Вступи в чат Web3 Uzbekistan", desc: "Спонсор", reward: 0.0008, status: "done" },
  { id: 5, icon: "🎁", title: "Подпишись на бот BonusHunter", desc: "Спонсор", reward: 0.0015, status: "open" },
];

// ---------- UI primitives ----------
function Card({ children, style, className = "" }) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{ backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}`, ...style }}
    >
      {children}
    </div>
  );
}

function ProgressBar({ value, max }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: theme.track }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: theme.gradient }}
      />
    </div>
  );
}

function TopBar({ title = "ADNEX", isAdmin, onOpenAdmin }) {
  return (
    <div
      className="flex items-center px-5 pt-4 pb-3 sticky top-0 z-10"
      style={{ backgroundColor: theme.bg, borderBottom: `1px solid ${theme.divider}`, position: "relative" }}
    >
      <div style={{ flex: 1 }} />
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 30, height: 30, borderRadius: 9, background: theme.gradientV,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 15, color: theme.white,
          }}
        >
          A
        </div>
        <span
          style={{
            fontSize: 19, fontWeight: 700, letterSpacing: "0.02em",
            backgroundImage: theme.gradient, WebkitBackgroundClip: "text",
            backgroundClip: "text", color: "transparent",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
        {isAdmin && (
          <button onClick={onOpenAdmin} style={{ background: "none" }}>
            <Settings size={20} style={{ color: theme.textMuted }} />
          </button>
        )}
      </div>
    </div>
  );
}

function BottomNav({ active, onChange }) {
  const items = [
    { id: "home", label: "Главная", icon: Home },
    { id: "tasks", label: "Задания", icon: ListChecks },
    { id: "bonuses", label: "Бонусы", icon: Gift },
    { id: "referrals", label: "Рефералы", icon: Users },
    { id: "withdraw", label: "Вывод", icon: CreditCard },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-around py-2.5"
      style={{ backgroundColor: theme.bg, borderTop: `1px solid ${theme.divider}` }}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        const color = isActive ? theme.cyan : "rgba(255,255,255,0.4)";
        return (
          <button key={id} onClick={() => onChange(id)} className="flex flex-col items-center gap-1 px-2 py-1">
            <Icon size={22} style={{ color }} />
            <span style={{ fontSize: 11, color }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Screens ----------
function HomeScreen({ user, onWatchAd, adNetworks }) {
  return (
    <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 20 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
          Ваш баланс
        </p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <span style={{ color: theme.white, fontSize: 42, fontWeight: 700, lineHeight: 1 }}>
            ${user.balance.toFixed(4)}
          </span>
          <span style={{ color: theme.textMuted, fontSize: 18 }}>USDT</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: theme.textMuted, marginBottom: 6 }}>
          <span>До вывода</span>
          <span>${user.balance.toFixed(4)} / ${user.minWithdraw}</span>
        </div>
        <ProgressBar value={user.balance} max={user.minWithdraw} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 0", textAlign: "center" }}>
            <p style={{ color: theme.white, fontSize: 20, fontWeight: 700 }}>{user.todayViews}</p>
            <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>Просмотров</p>
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 0", textAlign: "center" }}>
            <p style={{ color: theme.white, fontSize: 20, fontWeight: 700 }}>${user.todayEarned.toFixed(4)}</p>
            <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>Сегодня</p>
          </div>
        </div>
      </Card>

      <div>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          Смотреть рекламу
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {adNetworks.filter((n) => n.enabled).map((net) => {
            const reached = net.viewsToday >= net.dailyLimit;
            return (
              <Card
                key={net.id}
                style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, opacity: reached ? 0.5 : 1 }}
              >
                <div
                  className="shrink-0"
                  style={{ width: 44, height: 44, borderRadius: 12, background: theme.gradientV, display: "flex", alignItems: "center", justifyContent: "center", color: theme.white, fontWeight: 700, fontSize: 14 }}
                >
                  {net.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: theme.white, fontSize: 15, fontWeight: 600 }}>{net.name}</p>
                  <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                    +${net.reward.toFixed(4)} за показ · {net.viewsToday}/{net.dailyLimit} сегодня
                  </p>
                </div>
                <button
                  onClick={() => !reached && onWatchAd(net.id)}
                  disabled={reached}
                  className="shrink-0"
                  style={{
                    background: reached ? "rgba(255,255,255,0.08)" : theme.gradient,
                    color: theme.white, fontSize: 13, fontWeight: 600, padding: "9px 18px", borderRadius: 9999,
                  }}
                >
                  Смотреть
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      <p style={{ textAlign: "center", color: theme.textFaint, fontSize: 12, padding: "0 16px" }}>
        Кликай по рекламе каждые 2–5 показов, иначе оплата снизится
      </p>

      <div>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          Статистика
        </p>
        <Card>
          {[
            ["Заработано всего", `$${user.totalEarned.toFixed(4)}`, "USDT"],
            ["Просмотрено реклам", `${user.adsWatchedTotal}`, `сегодня ${user.todayViews}`],
            ["Сегодня заработано", `$${user.todayEarned.toFixed(4)}`, "USDT"],
          ].map(([label, val, sub], i) => (
            <div
              key={label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${theme.divider}`,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>{label}</span>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: theme.white, fontWeight: 600 }}>{val}</p>
                <p style={{ color: theme.textFaint, fontSize: 12 }}>{sub}</p>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function TasksScreen({ tasks, onClaim, user }) {
  const openCount = tasks.filter((t) => t.status === "open").length;

  return (
    <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ textAlign: "center", paddingTop: 4 }}>
        <h1 style={{ color: theme.white, fontSize: 26, fontWeight: 700 }}>Задания</h1>
        <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>
          Выполняй задания от спонсоров и получай USDT
        </p>
      </div>

      <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: `linear-gradient(90deg, ${theme.card}, ${theme.panelAlt})` }}>
        <span style={{ fontSize: 24 }}>🎁</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: theme.white, fontSize: 15, fontWeight: 500 }}>Ежедневный чек-ин</p>
          <p style={{ color: theme.textMuted, fontSize: 14 }}>
            День {user.checkinDay}/{user.checkinTotal} — награда доступна!
          </p>
        </div>
        <button style={{ color: theme.cyan, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 2, background: "none" }}>
          Забрать <ChevronRight size={16} />
        </button>
      </Card>

      <Card style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>Доступно заданий</span>
        <span style={{ background: theme.gradient, color: theme.white, fontSize: 12, fontWeight: 600, width: 26, height: 26, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {openCount}
        </span>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tasks.map((t) => {
          const done = t.status === "done";
          return (
            <Card key={t.id} style={{ padding: 14, display: "flex", alignItems: "center", gap: 12, opacity: done ? 0.55 : 1 }}>
              <div
                className="shrink-0"
                style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}
              >
                {t.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: theme.white, fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{t.title}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span style={{ color: theme.textFaint, fontSize: 12 }}>{t.desc}</span>
                  <span style={{ color: theme.textFaint, fontSize: 12 }}>·</span>
                  <span style={{ color: theme.accentLight, fontSize: 12, fontWeight: 600 }}>
                    +${t.reward.toFixed(4)} USDT
                  </span>
                </div>
              </div>
              {done ? (
                <div className="shrink-0" style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: "rgba(43,127,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={16} style={{ color: theme.accentLight }} />
                </div>
              ) : (
                <button
                  onClick={() => onClaim(t.id)}
                  className="shrink-0"
                  style={{ background: theme.gradient, color: theme.white, fontSize: 13, fontWeight: 500, padding: "8px 14px", borderRadius: 9999 }}
                >
                  Перейти
                </button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SpinWheel({ segments, rotation, spinning, onSpin, spinsLeft, spinsMax, adsWatchedToday, maxAdsPerDay, onWatchAd }) {
  const segAngle = 360 / segments.length;
  const colors = ["#22d3ee", "#8b5cf6"];

  const gradientStops = segments
    .map((_, i) => {
      const color = colors[i % 2];
      const from = i * segAngle;
      const to = from + segAngle;
      return `${color} ${from}deg ${to}deg`;
    })
    .join(", ");

  const adsLeftToday = maxAdsPerDay - adsWatchedToday;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: 240, height: 240 }}>
        <div
          style={{
            position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent",
            borderTop: `16px solid ${theme.cyan}`, zIndex: 3,
          }}
        />
        <div
          style={{
            width: 240, height: 240, borderRadius: "50%",
            background: `conic-gradient(${gradientStops})`,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? "transform 3.2s cubic-bezier(0.15,0.75,0.2,1)" : "none",
            position: "relative", boxShadow: "0 0 0 6px rgba(255,255,255,0.06)",
          }}
        >
          {segments.map((s, i) => {
            const angle = i * segAngle + segAngle / 2;
            return (
              <div
                key={i}
                style={{
                  position: "absolute", top: "50%", left: "50%", width: 0, height: 0,
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <span
                  style={{
                    position: "absolute", left: 0, top: -95, transform: "translateX(-50%) rotate(0deg)",
                    color: "#fff", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                    textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div
          style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 64, height: 64, borderRadius: "50%", background: theme.bg,
            border: `3px solid ${theme.card}`, display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Gift size={26} style={{ color: theme.cyan }} />
        </div>
      </div>

      <button
        onClick={onSpin}
        disabled={spinning || spinsLeft <= 0}
        style={{
          marginTop: 20, padding: "13px 36px", borderRadius: 9999, fontWeight: 700, fontSize: 15,
          background: spinsLeft > 0 && !spinning ? theme.gradient : "rgba(255,255,255,0.06)",
          color: spinsLeft > 0 && !spinning ? theme.white : theme.textFaint,
        }}
      >
        {spinning ? "Крутится..." : spinsLeft > 0 ? "Крутить" : "Нет доступных прокруток"}
      </button>

      {adsLeftToday > 0 && (
        <button
          onClick={onWatchAd}
          disabled={spinning}
          style={{
            marginTop: 10, padding: "12px 32px", borderRadius: 9999, fontWeight: 600, fontSize: 14,
            background: theme.gradientV, color: theme.white, opacity: spinning ? 0.5 : 1,
          }}
        >
          Смотреть рекламу
        </button>
      )}

      <p style={{ color: theme.textMuted, fontSize: 13, marginTop: 10 }}>
        Прокруток сейчас: <span style={{ color: theme.white, fontWeight: 600 }}>{spinsLeft}</span>
      </p>
      <p style={{ color: theme.textFaint, fontSize: 12, marginTop: 2, textAlign: "center", padding: "0 20px" }}>
        {adsLeftToday > 0
          ? <>Просмотрено рекламы сегодня: <span style={{ color: theme.white, fontWeight: 600 }}>{adsWatchedToday}/{maxAdsPerDay}</span> — каждый просмотр даёт прокрутку</>
          : "На сегодня лимит рекламы для барабана исчерпан"}
      </p>
    </div>
  );
}

function CaseCard({ c, onOpen }) {
  let statusLabel = "Смотреть";
  let dimmed = false;
  let progressText = null;

  if (c.type === "daily") {
    if (c.openedToday) {
      statusLabel = "Открыт сегодня";
      dimmed = true;
    } else if (c.requiredAds > 0 && c.watchedAds < c.requiredAds) {
      statusLabel = "Смотреть";
      progressText = `Просмотрено рекламы: ${c.watchedAds}/${c.requiredAds}`;
    }
  } else if (c.type === "once") {
    if (c.opened) {
      statusLabel = "Уже получено";
      dimmed = true;
    } else if (c.currentRefs < c.requiredRefs) {
      statusLabel = "Пригласить";
      progressText = `Рефералов: ${c.currentRefs}/${c.requiredRefs}`;
    }
  }

  const minAmt = Math.min(...c.pool.map((p) => p.amount));
  const maxAmt = Math.max(...c.pool.map((p) => p.amount));

  return (
    <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: dimmed ? "rgba(255,255,255,0.06)" : theme.gradientV,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {dimmed ? <Lock size={20} style={{ color: theme.textFaint }} /> : <Gift size={22} style={{ color: theme.white }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: theme.white, fontSize: 14, fontWeight: 600 }}>{c.title}</p>
          <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{c.desc}</p>
          <p style={{ color: theme.accentLight, fontSize: 12, marginTop: 2 }}>
            ${minAmt.toFixed(4)}–${maxAmt.toFixed(4)} USDT
          </p>
        </div>
      </div>
      {progressText && (
        <p style={{ color: theme.textFaint, fontSize: 12, paddingLeft: 60 }}>{progressText}</p>
      )}
      <button
        onClick={() => onOpen(c.id)}
        style={{
          width: "100%", padding: "10px 0", borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: dimmed ? "rgba(255,255,255,0.05)" : theme.gradient,
          color: dimmed ? theme.textFaint : theme.white,
        }}
      >
        {statusLabel}
      </button>
    </Card>
  );
}

function CaseReel({ pool, winnerId, spinning, onFinished }) {
  // Строим длинную ленту случайных наград, в конце — гарантированно выигрышный предмет
  const stripRef = useRef(null);
  const [strip, setStrip] = useState([]);
  const ITEM_WIDTH = 92;
  const WINNER_INDEX = 44; // позиция выигрышного элемента в ленте

  useEffect(() => {
    if (!spinning) return;
    const items = [];
    for (let i = 0; i < 50; i++) {
      if (i === WINNER_INDEX) {
        items.push(pool.find((p) => p.id === winnerId));
      } else {
        items.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    setStrip(items);

    const el = stripRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.transform = "translateX(0px)";
      // форсируем reflow, чтобы сброс точно применился до старта анимации
      void el.offsetHeight;
      requestAnimationFrame(() => {
        const jitter = (Math.random() - 0.5) * ITEM_WIDTH * 0.6;
        const target = -(WINNER_INDEX * ITEM_WIDTH - ITEM_WIDTH * 1.5 + jitter);
        el.style.transition = "transform 5s cubic-bezier(0.11,0.72,0.14,1)";
        el.style.transform = `translateX(${target}px)`;
      });
    }

    const t = setTimeout(() => onFinished && onFinished(), 5100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, winnerId]);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 16, background: "rgba(255,255,255,0.03)", padding: "18px 0" }}>
      <div
        style={{
          position: "absolute", top: 0, bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: 2, background: theme.gradient, zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent",
          borderTop: `10px solid ${theme.cyan}`, zIndex: 3,
        }}
      />
      <div ref={stripRef} style={{ display: "flex", willChange: "transform" }}>
        {strip.map((p, i) => (
          <div
            key={i}
            style={{
              width: ITEM_WIDTH, flexShrink: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 6, padding: "0 6px",
            }}
          >
            <div
              style={{
                width: 60, height: 60, borderRadius: 14, background: theme.gradientV,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Gift size={26} style={{ color: theme.white }} />
            </div>
            <span style={{ color: theme.white, fontSize: 11, fontWeight: 700 }}>${p?.amount.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseDetailScreen({ caseData, onBack, spinning, winnerItem, onStartOpen, onReelFinished, result, onClaim, onWatchCaseAd, onInviteFriends, referralLink }) {
  const c = caseData;
  const needsAds = c.type === "daily" && c.requiredAds > 0 && !c.openedToday && c.watchedAds < c.requiredAds;
  const needsRefs = c.type === "once" && !c.opened && c.currentRefs < c.requiredRefs;
  const locked =
    c.type === "daily"
      ? c.openedToday || needsAds
      : c.opened || needsRefs;

  const sortedPool = [...c.pool].sort((a, b) => b.percent - a.percent);

  return (
    <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <BonusSubHeader title={c.title} onBack={onBack} />

      <Card style={{ padding: 20, textAlign: "center", background: `radial-gradient(circle at 50% 0%, rgba(139,92,246,0.14), transparent 60%), ${theme.card}` }}>
        {spinning ? (
          <CaseReel pool={c.pool} winnerId={winnerItem?.id} spinning={spinning} onFinished={onReelFinished} />
        ) : result ? (
          <div style={{ padding: "10px 0" }}>
            <p style={{ color: theme.textMuted, fontSize: 13, marginBottom: 10 }}>Поздравляем, вы выиграли:</p>
            <div
              style={{
                width: 96, height: 96, borderRadius: 24, background: theme.gradientV,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                boxShadow: `0 0 40px ${theme.accentSoft}`,
              }}
            >
              <Gift size={44} style={{ color: theme.white }} />
            </div>
            <p style={{ color: theme.white, fontSize: 26, fontWeight: 800, marginTop: 14 }}>
              +${result.amount.toFixed(4)} USDT
            </p>
          </div>
        ) : (
          <div
            style={{
              width: 96, height: 96, borderRadius: 24, background: theme.gradientV,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
            }}
          >
            <Gift size={44} style={{ color: theme.white }} />
          </div>
        )}

        {!spinning && !result && <p style={{ color: theme.textMuted, fontSize: 13, marginTop: 16 }}>{c.desc}</p>}

        {needsAds && !spinning && !result && (
          <p style={{ color: theme.textFaint, fontSize: 12, marginTop: 4 }}>
            Просмотрено рекламы: <span style={{ color: theme.white, fontWeight: 600 }}>{c.watchedAds}/{c.requiredAds}</span>
          </p>
        )}
        {needsRefs && !spinning && !result && (
          <p style={{ color: theme.textFaint, fontSize: 12, marginTop: 4 }}>
            Приглашено друзей: <span style={{ color: theme.white, fontWeight: 600 }}>{c.currentRefs}/{c.requiredRefs}</span>
          </p>
        )}

        {result ? (
          <button
            onClick={onClaim}
            style={{ marginTop: 18, width: "100%", padding: "14px 0", borderRadius: 14, fontWeight: 700, fontSize: 15, background: theme.gradient, color: theme.white }}
          >
            Забрать награду
          </button>
        ) : (
          <>
            <button
              onClick={onStartOpen}
              disabled={locked || spinning}
              style={{
                marginTop: 16, width: "100%", padding: "14px 0", borderRadius: 14, fontWeight: 700, fontSize: 15,
                background: locked || spinning ? "rgba(255,255,255,0.06)" : theme.gradient,
                color: locked || spinning ? theme.textFaint : theme.white,
              }}
            >
              {spinning ? "Открываем..." : "Открыть кейс"}
            </button>

            {needsAds && !spinning && (
              <button
                onClick={() => onWatchCaseAd(c.id)}
                style={{
                  marginTop: 10, width: "100%", padding: "13px 0", borderRadius: 14, fontWeight: 600, fontSize: 14,
                  background: theme.gradientV, color: theme.white,
                }}
              >
                Смотреть рекламу
              </button>
            )}

            {needsRefs && !spinning && (
              <button
                onClick={() => onInviteFriends(referralLink)}
                style={{
                  marginTop: 10, width: "100%", padding: "13px 0", borderRadius: 14, fontWeight: 600, fontSize: 14,
                  background: theme.gradientV, color: theme.white,
                }}
              >
                Пригласить друзей
              </button>
            )}
          </>
        )}
      </Card>

      {!result && (
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 10, paddingLeft: 4 }}>
            Возможные награды
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sortedPool.map((p) => (
              <Card key={p.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: theme.gradientV, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Gift size={16} style={{ color: theme.white }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.white, fontSize: 14, fontWeight: 600 }}>${p.amount.toFixed(4)} USDT</p>
                  <p style={{ color: theme.textFaint, fontSize: 11, marginTop: 1 }}>Осталось: {p.quantity}</p>
                </div>
                <span style={{ color: theme.cyan, fontSize: 14, fontWeight: 700 }}>{p.percent}%</span>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BonusMenuCard({ badge, online, icon, title, desc, gradient, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left", borderRadius: 24, padding: 20, position: "relative",
        overflow: "hidden", background: gradient, border: "1px solid rgba(255,255,255,0.08)",
        minHeight: 150,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        {badge && (
          <span style={{ background: theme.gradient, color: theme.white, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 9999 }}>
            {badge}
          </span>
        )}
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "#4ade80" }} />
          {online} онлайн
        </span>
      </div>
      <p style={{ color: theme.white, fontSize: 22, fontWeight: 800 }}>{title}</p>
      <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 4 }}>{desc}</p>
      <div style={{ position: "absolute", right: 14, bottom: 14, fontSize: 44, opacity: 0.9 }}>{icon}</div>
    </button>
  );
}

function BonusSubHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
      <button
        onClick={onBack}
        style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <ChevronLeft size={18} style={{ color: theme.white }} />
      </button>
      <h1 style={{ color: theme.white, fontSize: 22, fontWeight: 700 }}>{title}</h1>
    </div>
  );
}

function pickWeightedReward(pool) {
  const total = pool.reduce((sum, p) => sum + p.percent, 0) || 1;
  let r = Math.random() * total;
  for (const p of pool) {
    r -= p.percent;
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

function BonusesScreen({ wheelSpinsLeft, wheelSpinsMax, wheelSegments, wheelRotation, wheelSpinning, onSpin, wheelAdsWatchedToday, wheelMaxAdsPerDay, onWatchAdForWheel, cases, onOpenCase, onWatchCaseAd, onInviteFriends, referralLink, promoCode, setPromoCode, onRedeemPromo }) {
  const [view, setView] = useState("menu");
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [caseSpinning, setCaseSpinning] = useState(false);
  const [winnerItem, setWinnerItem] = useState(null);
  const [result, setResult] = useState(null);

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  function openCaseDetail(caseId) {
    setSelectedCaseId(caseId);
    setResult(null);
    setWinnerItem(null);
    setCaseSpinning(false);
    setView("caseDetail");
  }

  function handleStartOpen() {
    if (!selectedCase) return;
    const winner = pickWeightedReward(selectedCase.pool);
    setWinnerItem(winner);
    setCaseSpinning(true);
  }

  function handleReelFinished() {
    setCaseSpinning(false);
    setResult(winnerItem);
  }

  function handleClaimCase() {
    if (!selectedCase || !result) return;
    onOpenCase(selectedCase.id, result);
    setResult(null);
    setWinnerItem(null);
    setView("cases");
  }

  if (view === "wheel") {
    return (
      <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <BonusSubHeader title="Барабан удачи" onBack={() => setView("menu")} />
        <Card style={{ padding: "24px 16px" }}>
          <SpinWheel
            segments={wheelSegments}
            rotation={wheelRotation}
            spinning={wheelSpinning}
            onSpin={onSpin}
            spinsLeft={wheelSpinsLeft}
            spinsMax={wheelSpinsMax}
            adsWatchedToday={wheelAdsWatchedToday}
            maxAdsPerDay={wheelMaxAdsPerDay}
            onWatchAd={onWatchAdForWheel}
          />
        </Card>
      </div>
    );
  }

  if (view === "caseDetail" && selectedCase) {
    return (
      <CaseDetailScreen
        caseData={selectedCase}
        onBack={() => setView("cases")}
        spinning={caseSpinning}
        winnerItem={winnerItem}
        onStartOpen={handleStartOpen}
        onReelFinished={handleReelFinished}
        result={result}
        onClaim={handleClaimCase}
        onWatchCaseAd={onWatchCaseAd}
        onInviteFriends={onInviteFriends}
        referralLink={referralLink}
      />
    );
  }

  if (view === "cases") {
    return (
      <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <BonusSubHeader title="Кейсы" onBack={() => setView("menu")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cases.map((c) => (
            <CaseCard key={c.id} c={c} onOpen={openCaseDetail} />
          ))}
        </div>
      </div>
    );
  }

  if (view === "giveaways") {
    return (
      <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <BonusSubHeader title="Розыгрыши" onBack={() => setView("menu")} />
        <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: `linear-gradient(90deg, ${theme.card}, ${theme.panelAlt})` }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: theme.white, fontSize: 14, fontWeight: 600 }}>Розыгрыш $10 USDT</p>
            <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>Итоги — каждое воскресенье</p>
          </div>
          <span style={{ background: theme.gradientSoft, color: theme.cyan, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 9999 }}>
            Участвую
          </span>
        </Card>
      </div>
    );
  }

  if (view === "promo") {
    return (
      <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <BonusSubHeader title="Промокод" onBack={() => setView("menu")} />
        <Card style={{ padding: 14, display: "flex", gap: 8 }}>
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Введите промокод"
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "none", color: theme.white, fontSize: 14, padding: "10px 14px" }}
          />
          <button
            onClick={onRedeemPromo}
            style={{ background: theme.gradient, color: theme.white, fontSize: 13, fontWeight: 600, padding: "10px 18px", borderRadius: 10 }}
          >
            Активировать
          </button>
        </Card>
      </div>
    );
  }

  // ---- меню разделов ----
  const openCasesCount = cases.filter((c) =>
    c.type === "daily" ? !c.openedToday : !c.opened
  ).length;

  return (
    <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ textAlign: "center", paddingTop: 4, paddingBottom: 4 }}>
        <h1 style={{ color: theme.white, fontSize: 26, fontWeight: 700 }}>Бонусы</h1>
        <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Выбери раздел</p>
      </div>

      <BonusMenuCard
        badge="Крутить"
        online={12}
        icon="🎡"
        title="Барабан удачи"
        desc={`${wheelSpinsLeft}/${wheelSpinsMax} прокруток сегодня`}
        gradient="linear-gradient(135deg, #1b0f3a 0%, #3a1550 55%, #7c3aed 100%)"
        onClick={() => setView("wheel")}
      />
      <BonusMenuCard
        online={8}
        icon="🎁"
        title="Кейсы"
        desc={`Доступно к открытию: ${openCasesCount}`}
        gradient="linear-gradient(135deg, #0b1a2e 0%, #103a4a 55%, #22d3ee 130%)"
        onClick={() => setView("cases")}
      />
      <BonusMenuCard
        online={25}
        icon="🎉"
        title="Розыгрыши"
        desc="Еженедельный призовой фонд"
        gradient="linear-gradient(135deg, #2a0f1e 0%, #4a1130 55%, #ec4899 130%)"
        onClick={() => setView("giveaways")}
      />
      <BonusMenuCard
        online={4}
        icon="🏷️"
        title="Промокоды"
        desc="Активируй код и получи бонус"
        gradient="linear-gradient(135deg, #0f1a12 0%, #123a1e 55%, #4ade80 130%)"
        onClick={() => setView("promo")}
      />
    </div>
  );
}

function ReferralsScreen({ data }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", paddingTop: 8 }}>
        <h1 style={{ color: theme.white, fontSize: 30, fontWeight: 700 }}>Рефералы</h1>
        <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Приглашай друзей — зарабатывай вместе</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: theme.white, fontSize: 30, fontWeight: 700 }}>{data.count}</p>
          <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Рефералов</p>
        </Card>
        <Card style={{ padding: 20, textAlign: "center" }}>
          <p style={{ color: theme.white, fontSize: 30, fontWeight: 700 }}>${data.earned.toFixed(4)}</p>
          <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 4 }}>Заработано</p>
        </Card>
      </div>

      <Card style={{ padding: 16, display: "flex", alignItems: "center", gap: 12, background: `linear-gradient(90deg, ${theme.panel}, ${theme.card})`, border: `1px solid ${theme.accentSoftBorder}` }}>
        <div className="shrink-0" style={{ backgroundColor: theme.accentSoft, color: theme.accentLight, fontWeight: 700, fontSize: 14, width: 44, height: 44, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {data.percent}%
        </div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.4 }}>
          Получай <span style={{ color: theme.white, fontWeight: 600 }}>{data.percent}%</span> от дохода каждого реферала за каждый просмотр рекламы
        </p>
      </Card>

      <div>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          Ваша ссылка
        </p>
        <Card style={{ padding: 16 }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, wordBreak: "break-all", marginBottom: 12 }}>{data.link}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(data.link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.05)", color: theme.white, fontSize: 14, fontWeight: 500, padding: "12px 0", borderRadius: 12 }}
            >
              <Copy size={16} /> {copied ? "Скопировано" : "Копировать"}
            </button>
            <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: theme.gradient, color: theme.white, fontSize: 14, fontWeight: 500, padding: "12px 0", borderRadius: 12 }}>
              <Share2 size={16} /> Поделиться
            </button>
          </div>
        </Card>
      </div>

      <p style={{ textAlign: "center", color: theme.textFaint, fontSize: 12 }}>
        За первого реферала — бонус ${data.firstBonus.toFixed(2)}
      </p>
    </div>
  );
}

function RadialProgress({ value, max, size = 168, stroke = 12 }) {
  const pct = Math.min(1, max > 0 ? value / max : 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={theme.cyan} />
          <stop offset="100%" stopColor={theme.purple} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

function WithdrawScreen({ user, history }) {
  const [tab, setTab] = useState("crypto");
  const [amount, setAmount] = useState("");
  const [addr, setAddr] = useState("");
  const [network, setNetwork] = useState("usdt");
  const [tgUsername, setTgUsername] = useState("");
  const [starsAmount, setStarsAmount] = useState("");

  const STAR_RATE = 1.25 / 70;
  const minStars = 70;
  const currentStars = Math.floor(user.balance / STAR_RATE);

  const isStars = tab === "stars";
  const progressValue = isStars ? currentStars : user.balance;
  const progressMax = isStars ? minStars : user.minWithdraw;
  const pctLabel = Math.min(100, Math.round((progressValue / progressMax) * 100));
  const canWithdraw = isStars ? currentStars >= minStars : user.balance >= user.minWithdraw;

  const networks = [
    { id: "usdt", label: "USDT · TON" },
    { id: "ton", label: "TON" },
  ];

  return (
    <div className="px-4 pb-28" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ textAlign: "center", paddingTop: 6 }}>
        <h1 style={{ color: theme.white, fontSize: 26, fontWeight: 700 }}>Вывод средств</h1>
        <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 2 }}>Выводи заработанное в пару кликов</p>
      </div>

      {/* Переключатель способа вывода */}
      <div style={{ display: "flex", gap: 8 }}>
        {[
          { id: "crypto", label: "Крипта" },
          { id: "stars", label: "Звёзды TG" },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 14, fontSize: 14, fontWeight: 600,
                background: active ? theme.gradient : theme.card,
                border: `1px solid ${active ? "transparent" : theme.cardBorder}`,
                color: active ? theme.white : theme.textMuted,
                transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Кольцо прогресса */}
      <Card style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", background: `radial-gradient(circle at 50% 0%, rgba(139,92,246,0.10), transparent 60%), ${theme.card}` }}>
        <div style={{ position: "relative", width: 168, height: 168 }}>
          <RadialProgress value={progressValue} max={progressMax} />
          <div
            style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <span style={{ color: theme.white, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>
              ${user.balance.toFixed(4)}
            </span>
            <span style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>USDT доступно</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
          <div style={{ width: 8, height: 8, borderRadius: 9999, background: theme.gradient }} />
          <span style={{ color: theme.textMuted, fontSize: 13 }}>
            {isStars
              ? `${currentStars} / ${minStars} ★ до минимума`
              : `$${user.balance.toFixed(4)} / $${user.minWithdraw} до минимума`}
          </span>
          <span style={{ color: theme.cyan, fontSize: 13, fontWeight: 700 }}>{pctLabel}%</span>
        </div>

        {isStars && (
          <p style={{ color: theme.textFaint, fontSize: 12, marginTop: 8, textAlign: "center" }}>
            Минимум {minStars} ★ — это ${(minStars * STAR_RATE).toFixed(2)}
          </p>
        )}
      </Card>

      {!isStars && (
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
            Сеть вывода
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {networks.map((n) => {
              const selected = network === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setNetwork(n.id)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 9999, fontSize: 13, fontWeight: 600,
                    background: selected ? theme.gradientSoft : "transparent",
                    border: `1px solid ${selected ? theme.accentSoftBorder : theme.cardBorder}`,
                    color: selected ? theme.cyan : theme.textMuted,
                  }}
                >
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Квитанция-карточка с деталями */}
      <div>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          Детали заявки
        </p>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {isStars ? (
            <>
              <div style={{ padding: "14px 16px", borderBottom: `1px dashed ${theme.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Telegram username</p>
                  <input
                    value={tgUsername}
                    onChange={(e) => setTgUsername(e.target.value)}
                    placeholder="@username"
                    style={{ width: "100%", background: "transparent", color: theme.white, fontSize: 15, outline: "none", border: "none", marginTop: 4 }}
                  />
                </div>
                <button
                  onClick={() => setTgUsername("@me")}
                  style={{ background: theme.gradientSoft, color: theme.cyan, fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 9999, whiteSpace: "nowrap" }}
                >
                  Мой ник
                </button>
              </div>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Количество (★)</p>
                  <input
                    value={starsAmount}
                    onChange={(e) => setStarsAmount(e.target.value)}
                    placeholder={`от ${minStars}`}
                    style={{ width: "100%", background: "transparent", color: theme.white, fontSize: 22, fontWeight: 700, outline: "none", border: "none", marginTop: 4 }}
                  />
                </div>
                <button
                  onClick={() => setStarsAmount(String(currentStars))}
                  style={{ background: theme.gradientSoft, color: theme.cyan, fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 9999 }}
                >
                  Макс
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ padding: "14px 16px", borderBottom: `1px dashed ${theme.divider}` }}>
                <p style={{ color: theme.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Адрес кошелька</p>
                <input
                  value={addr}
                  onChange={(e) => setAddr(e.target.value)}
                  placeholder="Введите TON-адрес"
                  style={{ width: "100%", background: "transparent", color: theme.white, fontSize: 15, outline: "none", border: "none", marginTop: 4 }}
                />
              </div>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: theme.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>Сумма (USDT)</p>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`от $${user.minWithdraw}`}
                    style={{ width: "100%", background: "transparent", color: theme.white, fontSize: 22, fontWeight: 700, outline: "none", border: "none", marginTop: 4 }}
                  />
                </div>
                <button
                  onClick={() => setAmount(String(user.balance.toFixed(4)))}
                  style={{ background: theme.gradientSoft, color: theme.cyan, fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 9999 }}
                >
                  Макс
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      <button
        disabled={!canWithdraw}
        style={{
          width: "100%", padding: "17px 0", borderRadius: 16, fontWeight: 700, fontSize: 15,
          background: canWithdraw ? theme.gradient : "rgba(255,255,255,0.05)",
          color: canWithdraw ? theme.white : theme.textFaint,
          boxShadow: canWithdraw ? `0 12px 28px -10px ${theme.accentSoft}` : "none",
        }}
      >
        {isStars ? "Вывести звёзды" : "Вывести"}
      </button>

      {/* История — таймлайн */}
      <div>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          История
        </p>
        <Card style={{ padding: "16px 16px 4px" }}>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 16, position: "relative" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 9, height: 9, borderRadius: 9999, background: theme.gradient, flexShrink: 0, marginTop: 4 }} />
                {i < history.length - 1 && (
                  <div style={{ width: 1, flex: 1, background: theme.divider, marginTop: 4 }} />
                )}
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingBottom: 2 }}>
                <div>
                  <p style={{ color: theme.white, fontWeight: 600, fontSize: 14 }}>${h.amount.toFixed(2)} USDT</p>
                  <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                    {h.network} · {h.addr} · {h.date}
                  </p>
                </div>
                <span style={{ backgroundColor: "rgba(34,211,238,0.1)", color: theme.cyan, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 9999, whiteSpace: "nowrap" }}>
                  {h.status}
                </span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ---------- Admin panel ----------
function AdminTabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
        background: active ? theme.gradient : "rgba(255,255,255,0.06)",
        color: active ? theme.white : theme.textMuted,
      }}
    >
      {children}
    </button>
  );
}

function AdminWithdrawals({ requests, onApprove, onReject }) {
  if (requests.length === 0) {
    return <p style={{ color: theme.textFaint, fontSize: 14, textAlign: "center", padding: "24px 0" }}>Нет заявок на вывод</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {requests.map((r) => (
        <Card key={r.id} style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ color: theme.white, fontWeight: 700, fontSize: 15 }}>{r.amount} {r.currency}</p>
              <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{r.username} · {r.date}</p>
              <p style={{ color: theme.textFaint, fontSize: 12, marginTop: 2 }}>{r.wallet}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => onApprove(r.id)}
              style={{ flex: 1, background: theme.gradient, color: theme.white, fontSize: 13, fontWeight: 600, padding: "9px 0", borderRadius: 10 }}
            >
              Подтвердить
            </button>
            <button
              onClick={() => onReject(r.id)}
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", color: theme.textMuted, fontSize: 13, fontWeight: 600, padding: "9px 0", borderRadius: 10 }}
            >
              Отклонить
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminTasks({ tasks, onAdd, onDelete }) {
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("");
  const [icon, setIcon] = useState("🎁");

  function submit() {
    if (!title.trim() || !reward) return;
    onAdd({ icon, title, desc: "Спонсор", reward: parseFloat(reward) });
    setTitle("");
    setReward("");
    setIcon("🎁");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ color: theme.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Новое задание
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            style={{ width: 44, textAlign: "center", background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "none", color: theme.white, fontSize: 18, padding: "8px 0" }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название (Подпишись на...)"
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "none", color: theme.white, fontSize: 14, padding: "8px 12px" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Награда, $"
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: 10, border: "none", color: theme.white, fontSize: 14, padding: "8px 12px" }}
          />
          <button
            onClick={submit}
            style={{ background: theme.gradient, color: theme.white, fontSize: 13, fontWeight: 600, padding: "8px 16px", borderRadius: 10, display: "flex", alignItems: "center", gap: 4 }}
          >
            <Plus size={16} /> Добавить
          </button>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tasks.map((t) => (
          <Card key={t.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: theme.white, fontSize: 13, fontWeight: 500 }}>{t.title}</p>
              <p style={{ color: theme.accentLight, fontSize: 12 }}>+${t.reward.toFixed(4)}</p>
            </div>
            <button onClick={() => onDelete(t.id)} style={{ background: "none" }}>
              <Trash2 size={16} style={{ color: "rgba(255,90,90,0.8)" }} />
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AdminCases({ cases, onUpdatePoolItem, onAddPoolItem, onDeletePoolItem }) {
  const [openCaseId, setOpenCaseId] = useState(cases[0]?.id || null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {cases.map((c) => {
        const isOpen = openCaseId === c.id;
        const totalPercent = c.pool.reduce((s, p) => s + p.percent, 0);
        return (
          <Card key={c.id} style={{ padding: 0, overflow: "hidden" }}>
            <button
              onClick={() => setOpenCaseId(isOpen ? null : c.id)}
              style={{ width: "100%", padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", background: "none" }}
            >
              <div style={{ textAlign: "left" }}>
                <p style={{ color: theme.white, fontSize: 14, fontWeight: 600 }}>{c.title}</p>
                <p style={{ color: totalPercent === 100 ? theme.textFaint : "rgba(255,90,90,0.85)", fontSize: 11, marginTop: 2 }}>
                  Сумма шансов: {totalPercent}% {totalPercent !== 100 && "(должно быть 100%)"}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: theme.textMuted, transform: isOpen ? "rotate(90deg)" : "none" }} />
            </button>

            {isOpen && (
              <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                {c.pool.map((p) => (
                  <div key={p.id} style={{ display: "flex", gap: 6, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 8 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: theme.textFaint, fontSize: 10, marginBottom: 2 }}>Сумма, $</p>
                      <input
                        value={p.amount}
                        type="number"
                        step="0.0001"
                        onChange={(e) => onUpdatePoolItem(c.id, p.id, { amount: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 6, border: "none", color: theme.white, fontSize: 12, padding: "5px 8px" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: theme.textFaint, fontSize: 10, marginBottom: 2 }}>Шанс, %</p>
                      <input
                        value={p.percent}
                        type="number"
                        onChange={(e) => onUpdatePoolItem(c.id, p.id, { percent: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 6, border: "none", color: theme.white, fontSize: 12, padding: "5px 8px" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: theme.textFaint, fontSize: 10, marginBottom: 2 }}>Кол-во</p>
                      <input
                        value={p.quantity}
                        type="number"
                        onChange={(e) => onUpdatePoolItem(c.id, p.id, { quantity: parseInt(e.target.value) || 0 })}
                        style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 6, border: "none", color: theme.white, fontSize: 12, padding: "5px 8px" }}
                      />
                    </div>
                    <button onClick={() => onDeletePoolItem(c.id, p.id)} style={{ background: "none", paddingTop: 14 }}>
                      <Trash2 size={15} style={{ color: "rgba(255,90,90,0.8)" }} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => onAddPoolItem(c.id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.05)", color: theme.textMuted, fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 10 }}
                >
                  <Plus size={14} /> Добавить награду
                </button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function AdminUsers({ users, onToggleBlock }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {users.map((u) => (
        <Card key={u.id} style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: theme.white, fontSize: 14, fontWeight: 500 }}>{u.username}</p>
            <p style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
              ${u.balance.toFixed(4)} · {u.referrals} реф.
            </p>
          </div>
          {u.blocked && (
            <span style={{ color: "rgba(255,90,90,0.9)", fontSize: 11, fontWeight: 600, backgroundColor: "rgba(255,90,90,0.12)", padding: "3px 8px", borderRadius: 9999 }}>
              Заблокирован
            </span>
          )}
          <button onClick={() => onToggleBlock(u.id)} style={{ background: "none" }}>
            {u.blocked ? (
              <ShieldCheck size={18} style={{ color: theme.cyan }} />
            ) : (
              <ShieldOff size={18} style={{ color: theme.textMuted }} />
            )}
          </button>
        </Card>
      ))}
    </div>
  );
}

function AdminAdNetworks({ networks, onUpdate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {networks.map((n) => (
        <Card key={n.id} style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ color: theme.white, fontWeight: 700, fontSize: 15 }}>{n.name}</p>
            <button
              onClick={() => onUpdate(n.id, { enabled: !n.enabled })}
              style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 9999,
                backgroundColor: n.enabled ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)",
                color: n.enabled ? theme.cyan : theme.textMuted,
              }}
            >
              {n.enabled ? "Включена" : "Выключена"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: theme.textFaint, fontSize: 11, marginBottom: 4 }}>Награда, $</p>
              <input
                value={n.reward}
                onChange={(e) => onUpdate(n.id, { reward: parseFloat(e.target.value) || 0 })}
                type="number"
                step="0.0001"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "none", color: theme.white, fontSize: 13, padding: "7px 10px" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: theme.textFaint, fontSize: 11, marginBottom: 4 }}>Лимит в день</p>
              <input
                value={n.dailyLimit}
                onChange={(e) => onUpdate(n.id, { dailyLimit: parseInt(e.target.value) || 0 })}
                type="number"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: 8, border: "none", color: theme.white, fontSize: 13, padding: "7px 10px" }}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AdminWheel({ config, onUpdateConfig, segments, onUpdateSegment, onAddSegment, onDeleteSegment }) {
  const totalPercentCheck = segments.length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ color: theme.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Настройки барабана
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <p style={{ color: theme.textFaint, fontSize: 11, marginBottom: 4 }}>Прокруток в день</p>
            <input
              value={config.maxSpinsPerDay}
              type="number"
              onChange={(e) => onUpdateConfig({ maxSpinsPerDay: parseInt(e.target.value) || 0 })}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 8, border: "none", color: theme.white, fontSize: 13, padding: "8px 10px" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: theme.textFaint, fontSize: 11, marginBottom: 4 }}>Реклам за 1 прокрутку</p>
            <input
              value={config.adsPerSpin}
              type="number"
              min={1}
              onChange={(e) => onUpdateConfig({ adsPerSpin: Math.max(1, parseInt(e.target.value) || 1) })}
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 8, border: "none", color: theme.white, fontSize: 13, padding: "8px 10px" }}
            />
          </div>
        </div>
        <p style={{ color: theme.textFaint, fontSize: 11 }}>
          Например: «2» реклам за прокрутку — пользователь смотрит 2 ролика и получает +1 прокрутку барабана.
        </p>
      </Card>

      <div>
        <p style={{ fontSize: 11, letterSpacing: "0.08em", color: theme.textMuted, textTransform: "uppercase", marginBottom: 8, paddingLeft: 4 }}>
          Секторы наград ({totalPercentCheck})
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {segments.map((s) => (
            <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: theme.textFaint, fontSize: 10, marginBottom: 2 }}>Сумма, $</p>
                <input
                  value={s.value}
                  type="number"
                  step="0.0001"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    onUpdateSegment(s.id, { value: val, label: `$${val}` });
                  }}
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 6, border: "none", color: theme.white, fontSize: 12, padding: "5px 8px" }}
                />
              </div>
              <button onClick={() => onDeleteSegment(s.id)} style={{ background: "none", paddingTop: 14 }}>
                <Trash2 size={15} style={{ color: "rgba(255,90,90,0.8)" }} />
              </button>
            </div>
          ))}
          <button
            onClick={onAddSegment}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.05)", color: theme.textMuted, fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 10 }}
          >
            <Plus size={14} /> Добавить сектор
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminScreen({ onClose, withdrawals, onApproveWithdraw, onRejectWithdraw, tasks, onAddTask, onDeleteTask, users, onToggleBlock, adNetworks, onUpdateNetwork, cases, onUpdateCasePoolItem, onAddCasePoolItem, onDeleteCasePoolItem, wheelConfig, onUpdateWheelConfig, wheelSegments, onUpdateWheelSegment, onAddWheelSegment, onDeleteWheelSegment }) {
  const [tab, setTab] = useState("withdrawals");

  const tabs = [
    { id: "withdrawals", label: `Выводы (${withdrawals.length})` },
    { id: "tasks", label: "Задания" },
    { id: "cases", label: "Кейсы" },
    { id: "wheel", label: "Барабан" },
    { id: "users", label: "Пользователи" },
    { id: "networks", label: "Сети рекламы" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: theme.bg, zIndex: 50, display: "flex", flexDirection: "column" }}>
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${theme.divider}` }}>
        <span style={{ color: theme.white, fontSize: 18, fontWeight: 700 }}>Админ-панель</span>
        <button onClick={onClose} style={{ background: "none" }}>
          <X size={22} style={{ color: theme.textMuted }} />
        </button>
      </div>

      <div className="px-4 pt-3 pb-1" style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {tabs.map((t) => (
          <AdminTabButton key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </AdminTabButton>
        ))}
      </div>

      <div className="px-4 pt-3 pb-10" style={{ overflowY: "auto", flex: 1 }}>
        {tab === "withdrawals" && (
          <AdminWithdrawals requests={withdrawals} onApprove={onApproveWithdraw} onReject={onRejectWithdraw} />
        )}
        {tab === "tasks" && <AdminTasks tasks={tasks} onAdd={onAddTask} onDelete={onDeleteTask} />}
        {tab === "cases" && (
          <AdminCases
            cases={cases}
            onUpdatePoolItem={onUpdateCasePoolItem}
            onAddPoolItem={onAddCasePoolItem}
            onDeletePoolItem={onDeleteCasePoolItem}
          />
        )}
        {tab === "wheel" && (
          <AdminWheel
            config={wheelConfig}
            onUpdateConfig={onUpdateWheelConfig}
            segments={wheelSegments}
            onUpdateSegment={onUpdateWheelSegment}
            onAddSegment={onAddWheelSegment}
            onDeleteSegment={onDeleteWheelSegment}
          />
        )}
        {tab === "users" && <AdminUsers users={users} onToggleBlock={onToggleBlock} />}
        {tab === "networks" && <AdminAdNetworks networks={adNetworks} onUpdate={onUpdateNetwork} />}
      </div>
    </div>
  );
}

// ---------- App shell ----------
export default function App() {
  const [screen, setScreen] = useState("home");
  const [user, setUser] = useState(mockUser);
  const [tasks, setTasks] = useState(mockTasks);
  const [adNetworks, setAdNetworks] = useState(mockAdNetworks);
  const [toast, setToast] = useState(null);

  const [adminOpen, setAdminOpen] = useState(false);
  const [withdrawRequests, setWithdrawRequests] = useState(mockPendingWithdrawals);
  const [usersList, setUsersList] = useState(mockUsersList);

  // ---- Bonuses: wheel + cases + promo ----
  const [wheelSpinsLeft, setWheelSpinsLeft] = useState(0);
  const [wheelConfig, setWheelConfig] = useState(mockWheelConfig);
  const [wheelSegments, setWheelSegments] = useState(mockWheelSegments);
  const [adsSinceLastSpin, setAdsSinceLastSpin] = useState(0);
  const [wheelAdsWatchedToday, setWheelAdsWatchedToday] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [cases, setCases] = useState(mockCases);
  const [promoCode, setPromoCode] = useState("");

  // ---- Реальная авторизация через Telegram + бэкенд ----
  const [authData, setAuthData] = useState(null); // { telegramId, username, balance, referralCode, ... }

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg || !tg.initData) return; // не в Telegram (просто открыли в браузере) — работаем на моках
    tg.ready();
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          console.error("Auth error:", data.error);
          return;
        }
        setAuthData(data);
        // подставляем реальный баланс с сервера вместо мокового
        setUser((u) => ({ ...u, balance: data.balance, totalEarned: data.totalEarned }));
      })
      .catch((err) => console.error("Auth request failed:", err));
  }, []);

  const referralLink = authData?.referralCode
    ? `https://t.me/${BOT_USERNAME}?startapp=${authData.referralCode}`
    : mockReferrals.link; // пока не авторизовались (или открыто вне Telegram) — ссылки ещё нет

  // Реальный Telegram ID текущего пользователя — берём напрямую из Telegram.WebApp,
  // не дожидаясь ответа бэкенда, чтобы админка появлялась сразу.
  const currentTelegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null;
  const isAdmin = currentTelegramId === ADMIN_TELEGRAM_ID;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  function handleWatchAd(networkId) {
    const net = adNetworks.find((n) => n.id === networkId);
    if (!net || net.viewsToday >= net.dailyLimit) return;
    const reward = net.reward;
    setAdNetworks((prev) =>
      prev.map((n) => (n.id === networkId ? { ...n, viewsToday: n.viewsToday + 1 } : n))
    );
    setUser((u) => ({
      ...u,
      balance: +(u.balance + reward).toFixed(6),
      todayViews: u.todayViews + 1,
      todayEarned: +(u.todayEarned + reward).toFixed(6),
      totalEarned: +(u.totalEarned + reward).toFixed(6),
      adsWatchedTotal: u.adsWatchedTotal + 1,
    }));
    setToast(`+$${reward.toFixed(4)} USDT`);

    // Начисление прокруток барабана за просмотр рекламы (по настройке админа adsPerSpin)
    setAdsSinceLastSpin((prevCount) => {
      const next = prevCount + 1;
      if (next >= wheelConfig.adsPerSpin) {
        setWheelSpinsLeft((s) => Math.min(wheelConfig.maxSpinsPerDay, s + 1));
        return 0;
      }
      return next;
    });
  }

  function handleClaimTask(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === "done") return;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "done" } : t)));
    setUser((u) => ({
      ...u,
      balance: +(u.balance + task.reward).toFixed(6),
      totalEarned: +(u.totalEarned + task.reward).toFixed(6),
    }));
    setToast(`+$${task.reward.toFixed(4)} USDT`);
  }

  // ---- Admin actions (MOCK: только локальный state; на бэкенде — защищённые /api/admin/* эндпоинты) ----
  function handleApproveWithdraw(id) {
    setWithdrawRequests((prev) => prev.filter((r) => r.id !== id));
    setToast("Заявка подтверждена");
  }

  function handleRejectWithdraw(id) {
    setWithdrawRequests((prev) => prev.filter((r) => r.id !== id));
    setToast("Заявка отклонена");
  }

  function handleAddTask(newTask) {
    setTasks((prev) => [...prev, { ...newTask, id: Date.now(), status: "open" }]);
  }

  function handleDeleteTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function handleToggleBlockUser(userId) {
    setUsersList((prev) => prev.map((u) => (u.id === userId ? { ...u, blocked: !u.blocked } : u)));
  }

  function handleUpdateNetwork(networkId, patch) {
    setAdNetworks((prev) => prev.map((n) => (n.id === networkId ? { ...n, ...patch } : n)));
  }

  // ---- Admin: управление пулом наград кейсов ----
  function handleUpdateCasePoolItem(caseId, poolItemId, patch) {
    setCases((prev) =>
      prev.map((c) =>
        c.id !== caseId
          ? c
          : { ...c, pool: c.pool.map((p) => (p.id === poolItemId ? { ...p, ...patch } : p)) }
      )
    );
  }

  function handleAddCasePoolItem(caseId) {
    setCases((prev) =>
      prev.map((c) =>
        c.id !== caseId
          ? c
          : { ...c, pool: [...c.pool, { id: `p${Date.now()}`, amount: 0.001, percent: 0, quantity: 10 }] }
      )
    );
  }

  function handleDeleteCasePoolItem(caseId, poolItemId) {
    setCases((prev) =>
      prev.map((c) => (c.id !== caseId ? c : { ...c, pool: c.pool.filter((p) => p.id !== poolItemId) }))
    );
  }

  // ---- Admin: настройки барабана ----
  function handleUpdateWheelConfig(patch) {
    setWheelConfig((prev) => ({ ...prev, ...patch }));
  }

  function handleUpdateWheelSegment(segId, patch) {
    setWheelSegments((prev) => prev.map((s) => (s.id === segId ? { ...s, ...patch } : s)));
  }

  function handleAddWheelSegment() {
    setWheelSegments((prev) => [...prev, { id: `w${Date.now()}`, label: "$0.001", value: 0.001 }]);
  }

  function handleDeleteWheelSegment(segId) {
    setWheelSegments((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== segId) : prev));
  }

  // ---- Bonuses handlers ----
  function handleWatchAdForWheel() {
    const maxAdsPerDay = wheelConfig.maxSpinsPerDay * wheelConfig.adsPerSpin;
    if (wheelAdsWatchedToday >= maxAdsPerDay) return;
    setWheelAdsWatchedToday((n) => n + 1);
    setAdsSinceLastSpin((prevCount) => {
      const next = prevCount + 1;
      if (next >= wheelConfig.adsPerSpin) {
        setWheelSpinsLeft((s) => Math.min(wheelConfig.maxSpinsPerDay, s + 1));
        setToast("+1 прокрутка барабана");
        return 0;
      }
      setToast(`Реклама просмотрена (${next}/${wheelConfig.adsPerSpin} до прокрутки)`);
      return next;
    });
  }

  function handleSpinWheel() {
    if (wheelSpinsLeft <= 0 || wheelSpinning) return;
    setWheelSpinning(true);
    const segCount = wheelSegments.length;
    const segAngle = 360 / segCount;
    const winnerIndex = Math.floor(Math.random() * segCount);
    const winnerCenter = winnerIndex * segAngle + segAngle / 2;

    // Итоговый поворот (по модулю 360) должен ставить центр выигрышного сектора точно под указатель (сверху).
    // Раньше targetAngle считался без учёта остатка от прошлых прокруток — из-за этого колесо
    // визуально останавливалось не на том секторе, за который начислялась награда.
    const desiredMod = ((360 - winnerCenter) % 360 + 360) % 360;
    setWheelRotation((prevRotation) => {
      const currentMod = ((prevRotation % 360) + 360) % 360;
      let delta = desiredMod - currentMod;
      if (delta <= 0) delta += 360; // всегда крутим вперёд, а не назад
      const fullSpins = 360 * 5;
      return prevRotation + fullSpins + delta;
    });
    setWheelSpinsLeft((n) => n - 1);

    setTimeout(() => {
      const reward = wheelSegments[winnerIndex].value;
      setUser((u) => ({
        ...u,
        balance: +(u.balance + reward).toFixed(6),
        totalEarned: +(u.totalEarned + reward).toFixed(6),
      }));
      setToast(`Барабан: +$${reward.toFixed(4)} USDT`);
      setWheelSpinning(false);
    }, 3200);
  }

  function handleOpenCase(caseId, wonItem) {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updatedPool = c.pool.map((p) =>
          p.id === wonItem.id ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p
        );
        const base = { ...c, pool: updatedPool };
        if (c.type === "daily") return { ...base, openedToday: true, watchedAds: 0 };
        if (c.type === "once") return { ...base, opened: true };
        return base;
      })
    );
    setUser((u) => ({
      ...u,
      balance: +(u.balance + wonItem.amount).toFixed(6),
      totalEarned: +(u.totalEarned + wonItem.amount).toFixed(6),
    }));
    setToast(`Кейс: +$${wonItem.amount.toFixed(4)} USDT`);
  }

  function handleRedeemPromo() {
    if (!promoCode.trim()) return;
    setToast(`Промокод «${promoCode}» отправлен на проверку`);
    setPromoCode("");
  }

  // Просмотр рекламы для разблокировки кейса (учёт очков-просмотров отдельно от Home)
  function handleWatchCaseAd(caseId) {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId || c.requiredAds == null) return c;
        const watchedAds = Math.min(c.requiredAds, (c.watchedAds || 0) + 1);
        return { ...c, watchedAds };
      })
    );
    setToast("+1 просмотр засчитан");
  }

  function handleInviteFriends(link) {
    navigator.clipboard?.writeText(link);
    setToast("Реф-ссылка скопирована — отправь другу");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: theme.bg, fontFamily: "system-ui, sans-serif", position: "relative", maxWidth: 448, margin: "0 auto" }}>
      <TopBar title="ADNEX" isAdmin={isAdmin} onOpenAdmin={() => setAdminOpen(true)} />

      {screen === "home" && <HomeScreen user={user} onWatchAd={handleWatchAd} adNetworks={adNetworks} />}
      {screen === "tasks" && <TasksScreen tasks={tasks} onClaim={handleClaimTask} user={user} />}
      {screen === "bonuses" && (
        <BonusesScreen
          wheelSpinsLeft={wheelSpinsLeft}
          wheelSpinsMax={wheelConfig.maxSpinsPerDay}
          wheelSegments={wheelSegments}
          wheelRotation={wheelRotation}
          wheelSpinning={wheelSpinning}
          onSpin={handleSpinWheel}
          wheelAdsWatchedToday={wheelAdsWatchedToday}
          wheelMaxAdsPerDay={wheelConfig.maxSpinsPerDay * wheelConfig.adsPerSpin}
          onWatchAdForWheel={handleWatchAdForWheel}
          cases={cases}
          onOpenCase={handleOpenCase}
          onWatchCaseAd={handleWatchCaseAd}
          onInviteFriends={handleInviteFriends}
          referralLink={referralLink}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          onRedeemPromo={handleRedeemPromo}
        />
      )}
      {screen === "referrals" && <ReferralsScreen data={{ ...mockReferrals, link: referralLink }} />}
      {screen === "withdraw" && <WithdrawScreen user={user} history={mockWithdrawHistory} />}

      {adminOpen && (
        <AdminScreen
          onClose={() => setAdminOpen(false)}
          withdrawals={withdrawRequests}
          onApproveWithdraw={handleApproveWithdraw}
          onRejectWithdraw={handleRejectWithdraw}
          tasks={tasks}
          onAddTask={handleAddTask}
          onDeleteTask={handleDeleteTask}
          users={usersList}
          onToggleBlock={handleToggleBlockUser}
          adNetworks={adNetworks}
          onUpdateNetwork={handleUpdateNetwork}
          cases={cases}
          onUpdateCasePoolItem={handleUpdateCasePoolItem}
          onAddCasePoolItem={handleAddCasePoolItem}
          onDeleteCasePoolItem={handleDeleteCasePoolItem}
          wheelConfig={wheelConfig}
          onUpdateWheelConfig={handleUpdateWheelConfig}
          wheelSegments={wheelSegments}
          onUpdateWheelSegment={handleUpdateWheelSegment}
          onAddWheelSegment={handleAddWheelSegment}
          onDeleteWheelSegment={handleDeleteWheelSegment}
        />
      )}

      {toast && (
        <div
          style={{
            position: "fixed", top: 64, left: "50%", transform: "translateX(-50%)",
            background: theme.gradient, color: theme.white, fontSize: 14, fontWeight: 600,
            padding: "8px 16px", borderRadius: 9999, boxShadow: "0 10px 25px rgba(0,0,0,0.3)", zIndex: 20,
          }}
        >
          {toast}
        </div>
      )}

      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
}
