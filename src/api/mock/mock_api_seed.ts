/**
 * api/mock/seed.ts
 * Начальные данные для demo (для мастера)
 */

import type { Order } from '../../types';
import { mockStorage } from './mock_api_storage';

// ============================================================================
// SEED DATA
// ============================================================================

export function seedMasterDashboard(): void {
  const now = new Date();

  const testOrders: Order[] = [
    {
      id: 'order_demo_1',
      clientId: 'client_demo_1',
      clientName: 'Анна Соколова',
      clientPhone: '+7 (999) 123-45-67',
      clientAge: 24,
      placement: 'forearm',
      size: { height: 12, width: 8 },
      sketchUrl: 'https://via.placeholder.com/200x150?text=Tattoo+Sketch+1',
      health: {
        contraindications: ['Нет противопоказаний'],
      },
      experience: {
        hasTattoos: true,
        tattooCount: 3,
      },
      wishes:
        'Хочу реалистичную розу в чёрно-серых тонах. Без белых бликов, акцент на текстуру лепестков.',
      status: 'pending',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    },
    {
      id: 'order_demo_2',
      clientId: 'client_demo_2',
      clientName: 'Максим Петров',
      clientPhone: '+7 (999) 234-56-78',
      clientAge: 28,
      placement: 'shoulder',
      size: { height: 15, width: 12 },
      sketchUrl: 'https://via.placeholder.com/200x150?text=Tattoo+Sketch+2',
      health: {
        contraindications: ['Нет противопоказаний'],
      },
      experience: {
        hasTattoos: true,
        tattooCount: 5,
      },
      wishes: 'Геометрический волк в дотворк стиле',
      status: 'pending',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
    },
  ];

  testOrders.forEach((order) => {
    mockStorage.orders.set(order.id, order);
    mockStorage.chats.set(order.id, {
      orderId: order.id,
      messages: [],
    });
  });
}
