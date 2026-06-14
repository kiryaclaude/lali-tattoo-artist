/**
 * api/mock/chat.ts
 * Mock реализация API для чата
 * TODO Backend: Заменить на реальные API вызовы к backend
 */

import type { Chat, Message, ApiResponse } from '../../types';
import { mockStorage, simulateNetworkDelay, generateId } from './mock_api_storage';

// ============================================================================
// GET CHAT
// ============================================================================

export async function mockGetChat(orderId: string): Promise<ApiResponse<Chat>> {
  await simulateNetworkDelay();

  const chat = mockStorage.chats.get(orderId);

  if (!chat) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Chat for order ${orderId} not found`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  return {
    success: true,
    data: chat,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

export async function mockSendMessage(
  orderId: string,
  sender: 'client' | 'master',
  text: string
): Promise<ApiResponse<Message>> {
  await simulateNetworkDelay();

  const chat = mockStorage.chats.get(orderId);
  if (!chat) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Chat for order ${orderId} not found`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  const message: Message = {
    id: generateId(),
    orderId,
    sender,
    text,
    createdAt: new Date(),
  };

  chat.messages.push(message);

  return {
    success: true,
    data: message,
    timestamp: new Date().toISOString(),
  };
}
