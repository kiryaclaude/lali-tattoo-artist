/**
 * api/mock/orders.ts
 * Mock реализация API для заказов
 * TODO Backend: Заменить на реальные API вызовы к backend
 */

import type { Order, ApiResponse, ApiListResponse, Price } from '../../types';
import {
  mockStorage,
  simulateNetworkDelay,
  persistMockStorage,
} from './mock_api_storage';

// Статусы, которые НЕ считаются активной заявкой.
const INACTIVE_STATUSES: ReadonlyArray<Order['status']> = ['rejected', 'cancelled'];

// ============================================================================
// CREATE ORDER
// ============================================================================

export async function mockCreateOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<Order>> {
  await simulateNetworkDelay();

  const newOrder: Order = {
    ...orderData,
    id: `order_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockStorage.orders.set(newOrder.id, newOrder);
  mockStorage.chats.set(newOrder.id, {
    orderId: newOrder.id,
    messages: [],
  });
  persistMockStorage();

  return {
    success: true,
    data: newOrder,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// CLIENT ORDERS (заявки конкретного клиента)
// ============================================================================

/**
 * Возвращает заявки клиента, новые — первыми.
 */
export async function mockGetClientOrders(
  clientId: string
): Promise<ApiListResponse<Order>> {
  await simulateNetworkDelay();

  const orders = Array.from(mockStorage.orders.values())
    .filter((o) => o.clientId === clientId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    success: true,
    data: orders,
    total: orders.length,
    page: 1,
    pageSize: orders.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Сколько у клиента активных заявок (без отклонённых/отменённых).
 */
export function countActiveClientOrders(clientId: string): number {
  return Array.from(mockStorage.orders.values()).filter(
    (o) => o.clientId === clientId && !INACTIVE_STATUSES.includes(o.status)
  ).length;
}

// ============================================================================
// GET ORDER
// ============================================================================

export async function mockGetOrder(
  orderId: string
): Promise<ApiResponse<Order>> {
  await simulateNetworkDelay();

  const order = mockStorage.orders.get(orderId);

  if (!order) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Order ${orderId} not found`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// LIST ORDERS (для мастера)
// ============================================================================

export async function mockGetMasterOrders(
  status?: string
): Promise<ApiListResponse<Order>> {
  await simulateNetworkDelay();

  let orders = Array.from(mockStorage.orders.values());

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  // Сортируем по дате создания (новые первыми)
  orders.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    success: true,
    data: orders,
    total: orders.length,
    page: 1,
    pageSize: orders.length,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// SET PRICE
// ============================================================================

export async function mockSetOrderPrice(
  orderId: string,
  totalPrice: Price,
  prepayment?: Price
): Promise<ApiResponse<Order>> {
  await simulateNetworkDelay();

  const order = mockStorage.orders.get(orderId);
  if (!order) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Order ${orderId} not found`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  order.totalPrice = totalPrice;
  order.prepayment = prepayment || {
    amount: Math.ceil(totalPrice.amount * 0.2),
    currency: totalPrice.currency,
  };
  order.status = 'price_set';
  order.updatedAt = new Date();

  mockStorage.orders.set(orderId, order);
  persistMockStorage();

  return {
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// REJECT ORDER
// ============================================================================

export async function mockRejectOrder(
  orderId: string,
  reason?: string
): Promise<ApiResponse<Order>> {
  await simulateNetworkDelay();

  const order = mockStorage.orders.get(orderId);
  if (!order) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Order ${orderId} not found`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  order.status = 'rejected';
  order.masterFeedback = reason;
  order.updatedAt = new Date();

  mockStorage.orders.set(orderId, order);
  persistMockStorage();

  return {
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// REQUEST CLARIFICATION (мастер запросил уточнение)
// ============================================================================

export async function mockRequestClarification(
  orderId: string,
  message: string
): Promise<ApiResponse<Order>> {
  await simulateNetworkDelay();

  const order = mockStorage.orders.get(orderId);
  if (!order) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: `Order ${orderId} not found` },
      timestamp: new Date().toISOString(),
    };
  }

  order.status = 'awaiting_price';
  order.masterFeedback = message;
  order.updatedAt = new Date();

  mockStorage.orders.set(orderId, order);
  persistMockStorage();

  return {
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// CONFIRM ORDER
// ============================================================================

export async function mockConfirmOrder(
  orderId: string,
  paymentProofUrl: string
): Promise<ApiResponse<Order>> {
  await simulateNetworkDelay();

  const order = mockStorage.orders.get(orderId);
  if (!order) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Order ${orderId} not found`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  order.status = 'confirmed';
  order.paymentProofUrl = paymentProofUrl;
  order.updatedAt = new Date();

  mockStorage.orders.set(orderId, order);
  persistMockStorage();

  return {
    success: true,
    data: order,
    timestamp: new Date().toISOString(),
  };
}
