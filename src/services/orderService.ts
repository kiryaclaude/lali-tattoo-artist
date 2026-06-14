/**
 * services/orderService.ts
 * Service для работы с заказами — обращается к нашему backend REST API.
 */

import type { Order, ApiResponse, Price } from '../types';
import { apiGet, apiPost } from '../api/api_http';

class OrderService {
  /** Создаёт новую заявку (клиент определяется по Telegram initData на сервере). */
  async createOrder(
    orderData: Partial<Order>
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>('/orders', orderData);
  }

  /** Заявки текущего клиента. */
  async getClientOrders(): Promise<ApiResponse<Order[]>> {
    return apiGet<Order[]>('/orders/mine');
  }

  /** Кол-во активных заявок клиента. */
  async getActiveCount(): Promise<ApiResponse<{ count: number }>> {
    return apiGet<{ count: number }>('/orders/active-count');
  }

  /** Все заявки (для мастера). */
  async getMasterOrders(): Promise<ApiResponse<Order[]>> {
    return apiGet<Order[]>('/orders');
  }

  /** Назначить стоимость. */
  async setOrderPrice(
    orderId: string,
    totalPrice: Price
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/price`, {
      amount: totalPrice.amount,
    });
  }

  /** Запросить уточнение у клиента. */
  async requestClarification(
    orderId: string,
    message: string
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/clarify`, { message });
  }

  /** Отклонить заявку. */
  async rejectOrder(
    orderId: string,
    reason?: string
  ): Promise<ApiResponse<Order>> {
    return apiPost<Order>(`/orders/${orderId}/reject`, { reason });
  }

  /** Рассылка всем клиентам. */
  async broadcast(text: string): Promise<ApiResponse<{ total: number; sent: number }>> {
    return apiPost<{ total: number; sent: number }>('/broadcast', { text });
  }
}

export const orderService = new OrderService();
