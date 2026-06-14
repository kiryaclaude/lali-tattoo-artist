/**
 * api/mock/storage.ts
 * Mock хранилище данных (вместо реальной базы данных)
 */

import type { Order, Chat } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

export interface MockStorage {
  orders: Map<string, Order>;
  chats: Map<string, Chat>;
  currentUserId: string;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Инициализирует mock хранилище
 */
export function createMockStorage(): MockStorage {
  return {
    orders: new Map(),
    chats: new Map(),
    currentUserId: `user_${generateId()}`,
  };
}

/**
 * Глобальное mock хранилище
 */
export const mockStorage = createMockStorage();

// ============================================================================
// PERSISTENCE (localStorage — чтобы заявки переживали перезагрузку)
// ============================================================================

const DB_KEY = 'lali_mock_db';

function reviveOrderDates(order: Order): Order {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

/**
 * Загружает заявки и чаты из localStorage в mockStorage.
 */
export function loadMockStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as { orders?: Order[]; chats?: Chat[] };
    mockStorage.orders.clear();
    mockStorage.chats.clear();
    (data.orders || []).forEach((o) =>
      mockStorage.orders.set(o.id, reviveOrderDates(o))
    );
    (data.chats || []).forEach((c) => mockStorage.chats.set(c.orderId, c));
  } catch {
    // битые данные — игнорируем
  }
}

/**
 * Сохраняет текущее состояние mockStorage в localStorage.
 * Вызывать после любых мутаций заявок/чатов.
 */
export function persistMockStorage(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      DB_KEY,
      JSON.stringify({
        orders: Array.from(mockStorage.orders.values()),
        chats: Array.from(mockStorage.chats.values()),
      })
    );
  } catch {
    // переполнение/недоступность — не критично для mock
  }
}

// Гидрируем хранилище при первом импорте модуля.
loadMockStorage();

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Генерирует уникальный ID
 */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Имитирует сетевую задержку
 */
export async function simulateNetworkDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
