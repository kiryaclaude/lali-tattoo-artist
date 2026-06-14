/**
 * services/chatService.ts
 * Service для работы с чатом
 */

import type { Chat, Message, ApiResponse } from '../types';
import { mockGetChat, mockSendMessage } from '../api/mock';
// TODO Backend: import { apiClient } from '../api/client';
// TODO Backend: import { ENDPOINTS } from '../api/endpoints';

// ============================================================================
// CHAT SERVICE
// ============================================================================

class ChatService {
  /**
   * Получает чат по ID заявки
   * TODO Backend: Заменить на apiClient.get(ENDPOINTS.CHAT.GET(orderId))
   */
  async getChat(orderId: string): Promise<ApiResponse<Chat>> {
    return mockGetChat(orderId);
  }

  /**
   * Отправляет сообщение в чат
   * TODO Backend: Заменить на apiClient.post(ENDPOINTS.CHAT.SEND_MESSAGE(orderId), ...)
   */
  async sendMessage(
    orderId: string,
    sender: 'client' | 'master',
    text: string
  ): Promise<ApiResponse<Message>> {
    return mockSendMessage(orderId, sender, text);
  }
}

export const chatService = new ChatService();
