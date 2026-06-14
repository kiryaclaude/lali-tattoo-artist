/**
 * types/chat.ts
 * Типы для чата между клиентом и мастером
 */

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type MessageSender = 'client' | 'master';

export interface Message {
  id: string;
  orderId: string;
  sender: MessageSender;
  text: string;
  mediaUrl?: string; // для изображений, мок-апов
  createdAt: Date;
}

// ============================================================================
// CHAT TYPES
// ============================================================================

export interface Chat {
  orderId: string;
  messages: Message[];
}
