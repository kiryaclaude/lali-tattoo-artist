/**
 * server/index.mjs
 * Express: отдаёт фронтенд, REST API, авторизация через Telegram initData,
 * уведомления и рассылка через бота.
 */
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { verifyInitData, sendMessage, hasBotToken } from './telegram.mjs';
import * as db from './db.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT) || 3000;

const MASTER_IDS = (process.env.MASTER_TELEGRAM_IDS || '628854840')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const isMaster = (id) => MASTER_IDS.includes(String(id));
const newId = () =>
  `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const fmtPrice = (p) => (p ? `${p.amount.toLocaleString('ru-RU')} ₽` : '');

const app = express();
app.use(express.json({ limit: '1mb' }));

// ---- Auth: читаем Telegram initData из заголовка ----
function auth(req, res, next) {
  const initData = req.get('X-Telegram-Init-Data') || '';
  let user = verifyInitData(initData);

  // Dev-режим без токена: принимаем id из заголовка для локального теста
  if (!user && !hasBotToken()) {
    const devId = req.get('X-Dev-User-Id');
    if (devId) user = { id: Number(devId) || devId, first_name: 'Dev' };
  }

  if (!user || !user.id) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  req.user = user;
  next();
}

function requireMaster(req, res, next) {
  if (!isMaster(req.user.id)) {
    return res.status(403).json({ success: false, error: 'forbidden' });
  }
  next();
}

const ok = (res, data) => res.json({ success: true, data });

// ---- Health ----
app.get('/api/health', (_req, res) =>
  res.json({ ok: true, bot: hasBotToken() })
);

// ---- Кто я (роль) ----
app.get('/api/me', auth, (req, res) =>
  ok(res, { id: req.user.id, isMaster: isMaster(req.user.id) })
);

// ============================ CLIENT ============================

// Создать заявку
app.post('/api/orders', auth, async (req, res) => {
  try {
    const clientId = String(req.user.id);
    const active = await db.countActiveClientOrders(clientId);
    if (active >= 3) {
      return res
        .status(409)
        .json({ success: false, error: 'limit', message: 'Лимит: максимум 3 активные заявки' });
    }

    const b = req.body || {};
    const order = await db.createOrder({
      id: newId(),
      clientId,
      clientName:
        b.clientName ||
        [req.user.first_name, req.user.last_name].filter(Boolean).join(' '),
      clientPhone: b.clientPhone || '',
      clientAge: b.clientAge,
      placement: b.placement,
      size: b.size,
      sketchUrl: b.sketchUrl || '',
      health: b.health || {},
      experience: b.experience || {},
      wishes: b.wishes || '',
      status: 'pending',
    });

    await db.upsertClient({
      id: clientId,
      name: order.clientName,
      username: req.user.username,
    });

    // Уведомляем мастера(ов)
    const note =
      `🆕 <b>Новая заявка</b>\n` +
      `${order.clientName || 'Клиент'} · ${order.placement} · ` +
      `${order.size.width}×${order.size.height} см` +
      (order.wishes ? `\n\n${order.wishes}` : '');
    for (const mid of MASTER_IDS) sendMessage(mid, note);

    ok(res, order);
  } catch (e) {
    console.error('create order error:', e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Мои заявки
app.get('/api/orders/mine', auth, async (req, res) => {
  try {
    ok(res, await db.getClientOrders(String(req.user.id)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Кол-во активных (для лимита)
app.get('/api/orders/active-count', auth, async (req, res) => {
  try {
    ok(res, { count: await db.countActiveClientOrders(String(req.user.id)) });
  } catch (e) {
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ============================ MASTER ============================

// Все заявки
app.get('/api/orders', auth, requireMaster, async (_req, res) => {
  try {
    ok(res, await db.getAllOrders());
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Назначить цену
app.post('/api/orders/:id/price', auth, requireMaster, async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0)
      return res.status(400).json({ success: false, error: 'bad_amount' });
    const totalPrice = { amount, currency: 'RUB' };
    const prepayment = { amount: Math.ceil(amount * 0.2), currency: 'RUB' };
    const order = await db.setOrderPrice(req.params.id, totalPrice, prepayment);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });

    sendMessage(
      order.clientId,
      `💰 <b>Мастер оценил вашу тату</b>\n\nСтоимость: ${fmtPrice(totalPrice)}\n` +
        `Предоплата для записи: ${fmtPrice(prepayment)}`
    );
    ok(res, order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Запросить уточнение
app.post('/api/orders/:id/clarify', auth, requireMaster, async (req, res) => {
  try {
    const message = (req.body?.message || '').trim();
    if (!message)
      return res.status(400).json({ success: false, error: 'empty' });
    const order = await db.clarifyOrder(req.params.id, message);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });

    sendMessage(
      order.clientId,
      `✍️ <b>Мастер запросил уточнение</b>\n\n${message}`
    );
    ok(res, order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Отклонить
app.post('/api/orders/:id/reject', auth, requireMaster, async (req, res) => {
  try {
    const reason = (req.body?.reason || 'Отклонено мастером').trim();
    const order = await db.rejectOrder(req.params.id, reason);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });

    sendMessage(
      order.clientId,
      `К сожалению, ваша заявка отклонена.\n${reason}`
    );
    ok(res, order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Рассылка всем клиентам
app.post('/api/broadcast', auth, requireMaster, async (req, res) => {
  try {
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ success: false, error: 'empty' });

    const ids = await db.getAllClientIds();
    let sent = 0;
    for (const id of ids) {
      const okSent = await sendMessage(id, `📢 ${text}`);
      if (okSent) sent++;
    }
    ok(res, { total: ids.length, sent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// ============================ STATIC ============================
app.use(express.static(DIST));
app.get('*', (_req, res) => res.sendFile(join(DIST, 'index.html')));

// ============================ START ============================
db.initSchema()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`Server listening on 0.0.0.0:${PORT} (bot: ${hasBotToken()})`)
    );
  })
  .catch((e) => {
    console.error('DB init failed:', e);
    // Всё равно поднимаем сервер, чтобы отдать фронтенд
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`Server listening on 0.0.0.0:${PORT} (DB ERROR)`)
    );
  });
