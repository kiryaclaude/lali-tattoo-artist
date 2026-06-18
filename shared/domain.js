/**
 * shared/domain.js
 * Единый источник домена для фронта И бэка (статусы, услуги, лейблы).
 * Плейн-ESM, чтобы импортировался и из Vite/TS, и из Node (.mjs) без сборки.
 */

export const SERVICES = ['tattoo', 'coverup', 'correction', 'consultation'];

export const SERVICE_LABELS = {
  tattoo: 'Запись на тату',
  coverup: 'Перекрытие',
  correction: 'Коррекция',
  consultation: 'Консультация',
};

export const ORDER_STATUSES = [
  'pending',
  'awaiting_price',
  'price_set',
  'payment_pending',
  'confirmed',
  'rejected',
  'cancelled',
];

export const ORDER_STATUS_LABELS = {
  pending: 'Ожидает',
  awaiting_price: 'Запрашивает уточнение',
  price_set: 'Согласовано',
  payment_pending: 'Ожидание оплаты',
  confirmed: 'Подтверждено',
  rejected: 'Отклонено',
  cancelled: 'Отменено',
};

/** Терминальные статусы (можно удалять, не считаются активными). */
export const TERMINAL_STATUSES = ['rejected', 'cancelled', 'confirmed'];

/** Активная заявка = не отклонена и не отменена (учитывается в лимите). */
export function isActiveStatus(status) {
  return status !== 'rejected' && status !== 'cancelled';
}
