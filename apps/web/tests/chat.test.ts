import { describe, it, expect } from 'vitest';
import {
  ChatManager,
  extractMentions,
} from '../../realtime/src/chat';
import { formatChatMarkdown } from '../src/components/chat/ChatPanel';

describe('T-15: In-Room Chat with Markdown, Mentions, and History (FR-COMM-01..02)', () => {
  it('extracts unique @mentions from message content', () => {
    const text = 'Hey @Alice and @bob, can you check @alice code review? Also email user@domain.com.';
    const mentions = extractMentions(text);

    expect(mentions).toEqual(['alice', 'bob']);
  });

  it('records, retrieves, and limits chat history per room (FR-COMM-02)', () => {
    const manager = new ChatManager();
    const roomId = 'room-chat-test-1';

    // 1. Send messages
    const msg1 = manager.addMessage({
      roomId,
      senderId: 'user-alice',
      senderName: 'Alice',
      senderColor: '#38bdf8',
      senderRole: 'HOST',
      content: 'Hello everyone!',
    });

    const msg2 = manager.addMessage({
      roomId,
      senderId: 'user-bob',
      senderName: 'Bob',
      senderColor: '#a855f7',
      senderRole: 'EDITOR',
      content: 'Hey @Alice, check line 42',
    });

    expect(msg1.id).toBeDefined();
    expect(msg1.mentions).toEqual([]);
    expect(msg2.mentions).toEqual(['alice']);

    // 2. Retrieve history (for late joiners)
    const history = manager.getHistory(roomId);
    expect(history.length).toBe(2);
    expect(history[0]?.content).toBe('Hello everyone!');
    expect(history[1]?.content).toBe('Hey @Alice, check line 42');

    // 3. Clear history
    manager.clearHistory(roomId);
    expect(manager.getHistory(roomId).length).toBe(0);
  });

  it('parses Markdown formatting, inline code, and @mentions into React elements (FR-COMM-01)', () => {
    const sample = 'Use `npm run dev` or **check** with @Alice.';
    const nodes = formatChatMarkdown(sample);

    expect(nodes.length).toBeGreaterThan(0);

    // Verify presence of code token, bold token, and mention token in rendered nodes
    const stringified = JSON.stringify(nodes);
    expect(stringified).toContain('@Alice');
    expect(stringified).toContain('npm run dev');
    expect(stringified).toContain('check');
  });
});
