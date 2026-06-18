# 🏆 Golden Template — Telegram Mini App (запись/услуги)

Переиспользуемый шаблон Telegram Mini App для ниш «запись к мастеру / услуги»:
бьюти, тату, барбершоп, доставка, ремонт, репетиторы и т.п. Один движок —
меняется конфиг под нишу.

## Стек

- **Frontend:** Vite + React 18 + TypeScript, react-router-dom 6, Zustand, Tailwind (кастомные токены).
- **Backend:** Express + PostgreSQL (`pg`, сырой параметризованный SQL).
- **Платформа:** Telegram Mini App (initData HMAC-авторизация).
- **Деплой:** Docker (multi-stage) на Railway — Express отдаёт собранный фронт + REST `/api` + Telegram webhook.

## Что умеет «из коробки»

- Авторизация по Telegram `initData` (подпись HMAC проверяется на сервере); роли клиент/админ по `MASTER_TELEGRAM_IDS`.
- Поток заявки: создание → оценка мастером + предложение времени → выбор слота клиентом → оплата (реквизиты из конфига) + чек → подтверждение → авто-сообщения (памятка и т.п.).
- Несколько типов услуг (в т.ч. бесплатная консультация), лимит активных заявок, удаление терминальных, фильтры у админа, рассылка, уведомления обеим сторонам.
- Загрузка изображений на диск/Volume (не base64 в БД).
- `/start` с кнопкой запуска мини-аппа.

## Карта проекта

```
server/                 backend (ESM, без транспиляции)
  index.mjs             bootstrap: express, статика, монтаж роутов, webhook, listen
  lib.mjs               auth/requireMaster, роли, форматтеры, ok()
  content.mjs           ★ тексты бота под нишу (памятка, противопоказания, адрес)
  db.mjs                pg Pool, схема (initSchema), запросы
  telegram.mjs          initData HMAC, sendMessage, webhook, /start
  storage.mjs           сохранение картинок на диск/Volume (абстракция под S3/R2)
shared/
  domain.js (+.d.ts)    ★ статусы и услуги — общий источник фронта и бэка
src/
  config/
    brand.ts            ★ имя, лого, реквизиты, MASTER ids
    flow.config.ts      ★ декларативные шаги анкеты (id, маршрут, заголовки, тип поля)
  styles/index.css      ★ палитра/токены (.surface-*)
  tailwind.config.js    ★ цвета бренда
  constants/            опции (расположения, противопоказания) под нишу
  components/ui|forms|common
  pages/client | pages/master
  layouts | store | services | hooks | routes | utils
```

★ — точки, которые меняются под нового клиента/нишу.

## Новый клиент за 6 шагов

1. **Бренд** — `src/config/brand.ts`: имя, подпись, путь к лого, `masterTelegramIds`, реквизиты оплаты.
2. **Лого** — положить картинку в `public/`, путь указать в `brand.ts`.
3. **Палитра** — `tailwind.config.js` (токены `brand/cream/graybg/...`) + `src/styles/index.css` (`.surface-*`).
4. **Анкета** — `src/config/flow.config.ts` (порядок/заголовки/типы шагов) + `src/constants/constants_order.ts` (опции, услуги).
5. **Тексты бота** — `server/content.mjs` (памятка/инфо) и приветствие в `server/telegram.mjs`.
6. **Окружение** — задать переменные из `.env.example` (`BOT_TOKEN`, `DATABASE_URL`, `MASTER_TELEGRAM_IDS`, `STUDIO_ADDRESS`, `STORAGE_DIR`).

Движок (авторизация, поток заявки, оплата, слоты, уведомления, рассылка) — **не трогаем**.

## Локальный запуск

```bash
npm install
cp .env.example .env.local      # без BOT_TOKEN работает dev-режим
npm run dev                     # фронт (Vite)
# бэкенд: задать DATABASE_URL и node server/index.mjs
```

## Деплой на Railway

1. Залить репозиторий, создать сервис из GitHub (Dockerfile подхватится).
2. Добавить **PostgreSQL** в тот же проект; в сервисе задать `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
3. Добавить **Volume**, смонтировать на `/data` (для картинок). `STORAGE_DIR=/data/uploads`.
4. Variables: `BOT_TOKEN`, `MASTER_TELEGRAM_IDS`, `STUDIO_ADDRESS`.
5. Сгенерировать публичный домен → проверить `/api/health` (`{"ok":true,"bot":true,"db":true}`).
6. В @BotFather привязать Web App к домену; `/start` пришлёт кнопку запуска.

## Генерация нового проекта ИИ

Системный промпт-генератор: `prompts/new-project.md` — указываешь нишу/бренд, получаешь проект на этом движке.

## Дорожная карта (level-2 полировка, опционально)

- Generic-рендерер анкеты (один движок из `flow.config` вместо отдельных экранов).
- Полный split хендлеров сервера в `server/routes/*` и крупных компонентов.
- TanStack Query вместо ручного fetch.
- Адаптер хранилища S3/R2 (интерфейс уже в `server/storage.mjs`).
