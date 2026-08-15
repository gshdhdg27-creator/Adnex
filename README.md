# ADNEX

Telegram Mini App: заработок USDT за просмотр рекламы. Барабан, кейсы, задания, рефералы, вывод средств.

## Структура проекта

```
adnex/
├── frontend/          # React + Vite — весь UI (Главная, Задания, Бонусы, Рефералы, Вывод, Админка)
│   ├── src/
│   │   ├── App.jsx    # вся логика и экраны приложения
│   │   └── main.jsx   # точка входа
│   └── package.json
├── backend/           # Express — API (пока заготовка с TODO)
│   ├── server.js
│   ├── .env.example   # какие переменные окружения нужны
│   └── package.json
├── vercel.json        # конфиг деплоя (фронт + бэк на одном проекте)
└── ARCHITECTURE.md     # полная схема БД и список эндпоинтов (добавь отдельным файлом, см. чат)
```

## Как загрузить в GitHub

1. Создай новый репозиторий на github.com (например `adnex`), **без** README/gitignore (у нас уже есть свои).
2. Скачай этот проект и распакуй.
3. В папке проекта выполни:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: ADNEX frontend + backend skeleton"
   git branch -M main
   git remote add origin https://github.com/ТВОЙ_НИК/adnex.git
   git push -u origin main
   ```
   Если работаешь без терминала — на странице пустого репозитория GitHub есть кнопка **"uploading an existing file"**, можно перетащить папку прямо в браузере.

## Как задеплоить на Vercel

1. Зайди на vercel.com → **Add New Project** → **Import** свой репозиторий `adnex`.
2. Vercel сам подхватит `vercel.json` — ничего в настройках менять не нужно.
3. После первого деплоя получишь постоянный URL вида `adnex.vercel.app`.

## Дальше

- Локальный запуск фронтенда: `cd frontend && npm install && npm run dev`
- Локальный запуск бэкенда: `cd backend && npm install && cp .env.example .env` (заполнить значения) `&& npm run dev`
- Полную схему базы данных и список всех API-эндпоинтов — см. `ARCHITECTURE.md`.
