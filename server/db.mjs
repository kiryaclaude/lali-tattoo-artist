/**
 * server/db.mjs
 * PostgreSQL: пул соединений, схема и запросы к заявкам/клиентам.
 */
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  // Railway internal-соединение идёт без SSL; для публичного URL можно включить.
  ssl:
    process.env.PGSSLMODE === 'require'
      ? { rejectUnauthorized: false }
      : false,
});

/** Создаёт таблицы, если их ещё нет. */
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id          TEXT PRIMARY KEY,
      name        TEXT,
      username    TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id              TEXT PRIMARY KEY,
      client_id       TEXT NOT NULL,
      client_name     TEXT,
      client_phone    TEXT,
      client_age      INTEGER,
      placement       TEXT,
      size_height     INTEGER,
      size_width      INTEGER,
      sketch_url      TEXT,
      health          JSONB,
      experience      JSONB,
      wishes          TEXT,
      status          TEXT NOT NULL DEFAULT 'pending',
      master_feedback TEXT,
      total_price     JSONB,
      prepayment      JSONB,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  // Доп. поля (на случай, если таблица уже создана старой схемой)
  await pool.query(
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`
  );
}

/** Преобразует строку БД в объект заявки для фронтенда. */
function rowToOrder(r) {
  if (!r) return null;
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name || '',
    clientPhone: r.client_phone || '',
    clientAge: r.client_age,
    placement: r.placement,
    size: { height: r.size_height, width: r.size_width },
    sketchUrl: r.sketch_url || '',
    health: r.health || {},
    experience: r.experience || {},
    wishes: r.wishes || '',
    status: r.status,
    masterFeedback: r.master_feedback || undefined,
    totalPrice: r.total_price || undefined,
    prepayment: r.prepayment || undefined,
    paymentProofUrl: r.payment_proof_url || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const INACTIVE = ['rejected', 'cancelled'];

export async function upsertClient({ id, name, username }) {
  await pool.query(
    `INSERT INTO clients (id, name, username) VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, username = EXCLUDED.username`,
    [String(id), name || null, username || null]
  );
}

export async function getAllClientIds() {
  const { rows } = await pool.query(`SELECT id FROM clients`);
  return rows.map((r) => r.id);
}

export async function createOrder(o) {
  const { rows } = await pool.query(
    `INSERT INTO orders
      (id, client_id, client_name, client_phone, client_age, placement,
       size_height, size_width, sketch_url, health, experience, wishes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      o.id,
      String(o.clientId),
      o.clientName || '',
      o.clientPhone || '',
      o.clientAge ?? null,
      o.placement,
      o.size?.height ?? null,
      o.size?.width ?? null,
      o.sketchUrl || '',
      o.health || {},
      o.experience || {},
      o.wishes || '',
      o.status || 'pending',
    ]
  );
  return rowToOrder(rows[0]);
}

export async function getOrder(id) {
  const { rows } = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return rowToOrder(rows[0]);
}

export async function getClientOrders(clientId) {
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE client_id = $1 ORDER BY created_at DESC`,
    [String(clientId)]
  );
  return rows.map(rowToOrder);
}

export async function countActiveClientOrders(clientId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS c FROM orders
     WHERE client_id = $1 AND status <> ALL($2)`,
    [String(clientId), INACTIVE]
  );
  return rows[0].c;
}

export async function getAllOrders() {
  const { rows } = await pool.query(
    `SELECT * FROM orders ORDER BY created_at DESC`
  );
  return rows.map(rowToOrder);
}

export async function setOrderPrice(id, totalPrice, prepayment) {
  const { rows } = await pool.query(
    `UPDATE orders SET total_price = $2, prepayment = $3,
       status = 'price_set', updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, totalPrice, prepayment]
  );
  return rowToOrder(rows[0]);
}

export async function rejectOrder(id, reason) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = 'rejected', master_feedback = $2,
       updated_at = now() WHERE id = $1 RETURNING *`,
    [id, reason || null]
  );
  return rowToOrder(rows[0]);
}

export async function clarifyOrder(id, message) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = 'awaiting_price', master_feedback = $2,
       updated_at = now() WHERE id = $1 RETURNING *`,
    [id, message]
  );
  return rowToOrder(rows[0]);
}

/** Клиент загрузил чек об оплате → статус payment_pending. */
export async function setReceipt(id, dataUrl) {
  const { rows } = await pool.query(
    `UPDATE orders SET payment_proof_url = $2, status = 'payment_pending',
       updated_at = now() WHERE id = $1 RETURNING *`,
    [id, dataUrl]
  );
  return rowToOrder(rows[0]);
}

/** Мастер подтвердил запись → статус confirmed. */
export async function confirmOrder(id) {
  const { rows } = await pool.query(
    `UPDATE orders SET status = 'confirmed', updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return rowToOrder(rows[0]);
}

/** Удаляет заявку. */
export async function deleteOrder(id) {
  await pool.query(`DELETE FROM orders WHERE id = $1`, [id]);
}

/** Клиент ответил на уточнение → возвращаем в pending, дописываем ответ в пожелания. */
export async function clientReply(id, message) {
  const { rows } = await pool.query(
    `UPDATE orders
       SET status = 'pending',
           wishes = COALESCE(NULLIF(wishes, ''), '') ||
                    CASE WHEN COALESCE(wishes,'') = '' THEN '' ELSE E'\n\n' END ||
                    '✏️ Ответ клиента: ' || $2,
           updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, message]
  );
  return rowToOrder(rows[0]);
}
