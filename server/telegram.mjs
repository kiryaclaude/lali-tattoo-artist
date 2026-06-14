/**
 * server/telegram.mjs
 * Проверка Telegram initData (авторизация) и отправка сообщений ботом.
 */
import crypto from 'node:crypto';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Проверяет подпись initData от Telegram WebApp.
 * Возвращает объект пользователя { id, first_name, username, ... } или null.
 * Алгоритм: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyInitData(initData) {
  if (!initData) return null;

  // Локальная разработка без токена — доверяем dev-режиму
  if (!BOT_TOKEN) {
    try {
      const params = new URLSearchParams(initData);
      const userRaw = params.get('user');
      return userRaw ? JSON.parse(userRaw) : null;
    } catch {
      return null;
    }
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;
    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();
    const computed = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computed !== hash) return null;

    const userRaw = params.get('user');
    return userRaw ? JSON.parse(userRaw) : null;
  } catch {
    return null;
  }
}

/**
 * Отправляет текстовое сообщение пользователю/в чат.
 * Возвращает true при успехе. Ошибки не бросает (для рассылки).
 */
export async function sendMessage(chatId, text) {
  if (!BOT_TOKEN) {
    console.warn('[telegram] BOT_TOKEN не задан — сообщение не отправлено');
    return false;
  }
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn('[telegram] sendMessage failed:', data.description);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[telegram] sendMessage error:', e.message);
    return false;
  }
}

export const hasBotToken = () => !!BOT_TOKEN;
