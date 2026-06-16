/**
 * server/index.mjs
 * Express: отдаёт фронтенд, REST API, авторизация через Telegram initData,
 * уведомления и рассылка через бота.
 */
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  verifyInitData,
  sendMessage,
  hasBotToken,
  sendWelcome,
  setWebhook,
  WEBHOOK_SECRET,
} from './telegram.mjs';
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
const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const fmtSlot = (iso) => {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const app = express();
app.use(express.json({ limit: '6mb' })); // запас под изображения (эскиз/чек)

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
app.get('/api/health', async (_req, res) => {
  let dbOk = false;
  try {
    await db.pool.query('SELECT 1');
    dbOk = true;
  } catch {
    dbOk = false;
  }
  res.json({ ok: true, bot: hasBotToken(), db: dbOk });
});

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

    // Уведомляем мастера(ов) — с возможностью написать клиенту
    const username = req.user.username;
    const name = escapeHtml(order.clientName || 'Клиент');
    const mention = `<a href="tg://user?id=${clientId}">${name}</a>`;
    const note =
      `🆕 <b>Новая заявка</b>\n` +
      `${mention} · ${escapeHtml(order.placement)} · ` +
      `${order.size.width}×${order.size.height} см` +
      (order.wishes ? `\n\n${escapeHtml(order.wishes)}` : '') +
      (username ? '' : `\n\n💬 Напишите клиенту: нажмите на имя выше`);
    const extra = username
      ? {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💬 Написать клиенту', url: `https://t.me/${username}` }],
            ],
          },
        }
      : {};
    for (const mid of MASTER_IDS) sendMessage(mid, note, extra);

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

// Одна заявка (владелец или мастер) — для просмотра деталей
app.get('/api/orders/:id', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(order.clientId) !== String(req.user.id) && !isMaster(req.user.id)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    ok(res, order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Клиент загружает чек об оплате
app.post('/api/orders/:id/receipt', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(order.clientId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    const dataUrl = req.body?.dataUrl;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'no_file' });
    }
    const updated = await db.setReceipt(req.params.id, dataUrl);
    const note =
      `🧾 <b>Клиент оплатил</b>\n${updated.clientName || 'Клиент'} прислал чек по заявке ` +
      `${updated.placement} · ${updated.size.width}×${updated.size.height} см`;
    for (const mid of MASTER_IDS) sendMessage(mid, note);
    ok(res, updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Клиент отвечает на запрос уточнения → заявка снова в работе (pending)
app.post('/api/orders/:id/reply', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(order.clientId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    const message = (req.body?.message || '').trim();
    if (!message) return res.status(400).json({ success: false, error: 'empty' });

    const updated = await db.clientReply(req.params.id, message);
    const note =
      `✏️ <b>Ответ от клиента</b>\n${updated.clientName || 'Клиент'} ` +
      `(${updated.placement} · ${updated.size.width}×${updated.size.height} см):\n${message}`;
    for (const mid of MASTER_IDS) sendMessage(mid, note);
    ok(res, updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Удаление заявки: клиент — только свои завершённые/отклонённые; мастер — любые
app.delete('/api/orders/:id', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });

    const master = isMaster(req.user.id);
    const owner = String(order.clientId) === String(req.user.id);
    const terminal = ['rejected', 'confirmed', 'cancelled'].includes(order.status);

    if (!master && !(owner && terminal)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }

    await db.deleteOrder(req.params.id);
    ok(res, { id: req.params.id });
  } catch (e) {
    console.error(e);
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
    const slots = Array.isArray(req.body?.slots)
      ? req.body.slots.filter((s) => typeof s === 'string').slice(0, 10)
      : [];
    const totalPrice = { amount, currency: 'RUB' };
    const prepayment = { amount: Math.ceil(amount * 0.2), currency: 'RUB' };
    const order = await db.setOrderPrice(
      req.params.id,
      totalPrice,
      prepayment,
      slots
    );
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });

    const slotsLine = slots.length
      ? `\n\n🗓 Выберите удобное время в приложении (${slots.length} ${
          slots.length === 1 ? 'вариант' : 'варианта'
        }).`
      : '';
    sendMessage(
      order.clientId,
      `💰 <b>Мастер оценил вашу тату</b>\n\nСтоимость: ${fmtPrice(totalPrice)}\n` +
        `Предоплата для записи: ${fmtPrice(prepayment)}${slotsLine}`
    );
    ok(res, order);
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'server_error' });
  }
});

// Клиент выбирает предложенный слот времени
app.post('/api/orders/:id/select-slot', auth, async (req, res) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });
    if (String(order.clientId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'forbidden' });
    }
    const slot = req.body?.slot;
    if (!slot || !(order.proposedSlots || []).includes(slot)) {
      return res.status(400).json({ success: false, error: 'bad_slot' });
    }
    const updated = await db.selectSlot(req.params.id, slot);
    for (const mid of MASTER_IDS) {
      sendMessage(
        mid,
        `🗓 <b>Клиент выбрал время</b>\n${updated.clientName || 'Клиент'}: ${fmtSlot(slot)}`
      );
    }
    ok(res, updated);
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

// Подтвердить запись (после оплаты)
app.post('/api/orders/:id/confirm', auth, requireMaster, async (req, res) => {
  try {
    const order = await db.confirmOrder(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'not_found' });
    const when = order.selectedSlot
      ? `\n🗓 ${fmtSlot(order.selectedSlot)}`
      : '';
    sendMessage(
      order.clientId,
      `✅ <b>Запись подтверждена!</b>${when}\nМастер ждёт вас. Спасибо!`
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

// ============================ TELEGRAM WEBHOOK ============================
// Приём апдейтов от бота (команда /start и т.п.)
app.post('/api/tg/webhook', (req, res) => {
  if (req.get('X-Telegram-Bot-Api-Secret-Token') !== WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }
  res.sendStatus(200); // отвечаем сразу, обработка — асинхронно

  const msg = req.body?.message;
  const text = typeof msg?.text === 'string' ? msg.text.trim() : '';
  if (msg?.chat?.id && /^\/start(@\w+)?$/.test(text)) {
    sendWelcome(msg.chat.id).catch(() => {});
  }
});

// ============================ STATIC ============================
app.use(express.static(DIST));
app.get('*', (_req, res) => res.sendFile(join(DIST, 'index.html')));

// ============================ START ============================
db.initSchema()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on 0.0.0.0:${PORT} (bot: ${hasBotToken()})`);
      setWebhook();
    });
  })
  .catch((e) => {
    console.error('DB init failed:', e);
    // Всё равно поднимаем сервер, чтобы отдать фронтенд
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`Server listening on 0.0.0.0:${PORT} (DB ERROR)`)
    );
  });
