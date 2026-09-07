export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderColor: string;
  senderRole?: string;
  content: string;
  mentions: string[];
  createdAt: number;
}

export interface SendMessagePayload {
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderColor: string;
  senderRole?: string;
  content: string;
}

/**
 * Extracts unique @mentions from message content (e.g., "@alice @bob").
 */
export function extractMentions(content: string): string[] {
  const matches = content.matchAll(/(?:^|\s)@([a-zA-Z0-9_-]+)/g);
  const unique = new Set<string>();
  for (const match of matches) {
    if (match[1]) {
      unique.add(match[1].toLowerCase());
    }
  }
  return Array.from(unique);
}

/**
 * In-Room Chat Manager.
 * Handles message persistence, mention extraction, and chat history retention (FR-COMM-01..02).
 */
export class ChatManager {
  private roomMessages = new Map<string, ChatMessage[]>();

  /**
   * Adds and records a chat message for a room.
   */
  addMessage(payload: SendMessagePayload): ChatMessage {
    const mentions = extractMentions(payload.content);
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roomId: payload.roomId,
      senderId: payload.senderId,
      senderName: payload.senderName,
      senderAvatar: payload.senderAvatar,
      senderColor: payload.senderColor,
      senderRole: payload.senderRole,
      content: payload.content.trim(),
      mentions,
      createdAt: Date.now(),
    };

    let list = this.roomMessages.get(payload.roomId);
    if (!list) {
      list = [];
      this.roomMessages.set(payload.roomId, list);
    }

    list.push(message);

    // Keep recent 500 messages per room buffer
    if (list.length > 500) {
      list.shift();
    }

    return message;
  }

  /**
   * Retrieves message history for late joiners (FR-COMM-02).
   */
  getHistory(roomId: string, limit = 50): ChatMessage[] {
    const list = this.roomMessages.get(roomId) || [];
    return list.slice(-limit);
  }

  /**
   * Clears room chat history.
   */
  clearHistory(roomId: string): void {
    this.roomMessages.delete(roomId);
  }
}

export const defaultChatManager = new ChatManager();
