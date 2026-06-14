/**
 * api/endpoints.ts
 * Конфигурация API endpoints
 * TODO Backend: Убедиться, что endpoints соответствуют backend реализации
 */

// ============================================================================
// ENDPOINTS CONSTANTS
// ============================================================================

export const ENDPOINTS = {
  // ========================================================================
  // ORDERS
  // ========================================================================
  ORDERS: {
    CREATE: '/orders',
    GET: (orderId: string) => `/orders/${orderId}`,
    LIST: '/orders',
    LIST_BY_STATUS: (status: string) => `/orders?status=${status}`,

    // Master endpoints
    MASTER_ORDERS: '/master/orders',
    MASTER_ORDERS_BY_STATUS: (status: string) =>
      `/master/orders?status=${status}`,

    // Order actions
    SET_PRICE: (orderId: string) => `/orders/${orderId}/price`,
    REJECT: (orderId: string) => `/orders/${orderId}/reject`,
    CONFIRM: (orderId: string) => `/orders/${orderId}/confirm`,
  },

  // ========================================================================
  // CHAT
  // ========================================================================
  CHAT: {
    GET: (orderId: string) => `/chats/${orderId}`,
    SEND_MESSAGE: (orderId: string) => `/chats/${orderId}/messages`,
  },

  // ========================================================================
  // UPLOAD
  // ========================================================================
  UPLOAD: {
    FILE: '/upload',
  },

  // ========================================================================
  // USERS
  // ========================================================================
  USERS: {
    GET_PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
  },

  // ========================================================================
  // TELEGRAM
  // ========================================================================
  TELEGRAM: {
    VERIFY: '/telegram/verify',
  },
} as const;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Все возможные ошибки API
 */
export const API_ERROR_CODES = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_FILE: 'INVALID_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Network
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // General
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
