/**
 * services/orderService.ts
 * Service для работы с заказами (обёртка над API)
 * Использует либо mock API (разработка), либо реальный (production)
 */

import type { Order, ApiResponse, ApiListResponse, Price } from '../types';
import {
  mockCreateOrder,
  mockGetOrder,
  mockGetClientOrders,
  countActiveClientOrders,
  mockGetMasterOrders,
  mockSetOrderPrice,
  mockRejectOrder,
  mockRequestClarification,
  mockConfirmOrder,
} from '../api/mock';
// TODO Backend: import { apiClient } from '../api/client';
// TODO Backend: import { ENDPOINTS } from '../api/endpoints';

// ============================================================================
// ORDER SERVICE
// ============================================================================

class OrderService {
  /**
   * Создает новую заявку
   * TODO Backend: Заменить на apiClient.post(ENDPOINTS.ORDERS.CREATE, data)
   */
  async createOrder(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Order>> {
    return mockCreateOrder(orderData);
  }

  /**
   * Получает заявки текущего клиента
   * TODO Backend: Заменить на apiClient.get(ENDPOINTS.ORDERS.CLIENT_ORDERS)
   */
  async getClientOrders(clientId: string): Promise<ApiListResponse<Order>> {
    return mockGetClientOrders(clientId);
  }

  /**
   * Кол-во активных заявок клиента (для лимита)
   */
  countActiveOrders(clientId: string): number {
    return countActiveClientOrders(clientId);
  }

  /**
   * Получает заявку по ID
   * TODO Backend: Заменить на apiClient.get(ENDPOINTS.ORDERS.GET(orderId))
   */
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return mockGetOrder(orderId);
  }

  /**
   * Получает все заявки мастера (опционально фильтр по статусу)
   * TODO Backend: Заменить на apiClient.get(ENDPOINTS.ORDERS.MASTER_ORDERS)
   */
  async getMasterOrders(status?: string): Promise<ApiListResponse<Order>> {
    return mockGetMasterOrders(status);
  }

  /**
   * Устанавливает цену за заявку
   * TODO Backend: Заменить на apiClient.put(ENDPOINTS.ORDERS.SET_PRICE(orderId), ...)
   */
  async setOrderPrice(
    orderId: string,
    totalPrice: Price,
    prepayment?: Price
  ): Promise<ApiResponse<Order>> {
    return mockSetOrderPrice(orderId, totalPrice, prepayment);
  }

  /**
   * Отклоняет заявку
   * TODO Backend: Заменить на apiClient.put(ENDPOINTS.ORDERS.REJECT(orderId), ...)
   */
  async rejectOrder(orderId: string, reason?: string): Promise<ApiResponse<Order>> {
    return mockRejectOrder(orderId, reason);
  }

  /**
   * Запрашивает уточнение у клиента (статус -> awaiting_price)
   * TODO Backend: Заменить на apiClient.put(ENDPOINTS.ORDERS.CLARIFY(orderId), ...)
   */
  async requestClarification(
    orderId: string,
    message: string
  ): Promise<ApiResponse<Order>> {
    return mockRequestClarification(orderId, message);
  }

  /**
   * Подтверждает заявку после оплаты
   * TODO Backend: Заменить на apiClient.put(ENDPOINTS.ORDERS.CONFIRM(orderId), ...)
   */
  async confirmOrder(
    orderId: string,
    paymentProofUrl: string
  ): Promise<ApiResponse<Order>> {
    return mockConfirmOrder(orderId, paymentProofUrl);
  }
}

export const orderService = new OrderService();
