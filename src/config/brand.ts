/**
 * config/brand.ts
 * Единственное место с клиент-специфичными данными.
 * Для нового клиента/ниши меняем ТОЛЬКО этот файл (+ theme/flow).
 */

export const BRAND = {
  /** Название и подпись (для текстовых мест). */
  name: 'LALI',
  tagline: 'tattoo artist',

  /** Логотип на главной (файл в /public). */
  logo: '/lali-logo-mark.jpg',

  /** Telegram id админов/мастеров — у них открывается кабинет. */
  masterTelegramIds: [628854840] as number[],

  /** Реквизиты для предоплаты (показываются клиенту). */
  payment: {
    card: '2200 7013 4217 5137',
    holder: 'Лолита П',
    bank: 'Т-банк',
  },
} as const;
