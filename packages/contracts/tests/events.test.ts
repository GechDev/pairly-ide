import { describe, expect, it } from 'vitest';
import {
  ChatSendPayloadSchema,
  CollaborationEventSchema,
  EventEnvelopeSchema,
  PresenceUpdatePayloadSchema,
  validateChatSend,
  validateCollaborationEvent,
  validateEventEnvelope,
  validatePresenceUpdate,
} from '../src/events.js';

describe('Collaboration Events Contracts & Validation', () => {
  describe('EventEnvelopeSchema', () => {
    it('validates a correct envelope', () => {
      const envelope = {
        eventId: 'evt_1',
        roomId: 'room_1',
        senderId: 'user_1',
        timestamp: Date.now(),
        version: 1,
        type: 'custom.event',
        payload: { foo: 'bar' },
      };

      const result = validateEventEnvelope(envelope);
      expect(result.success).toBe(true);
    });

    it('rejects envelope with missing or invalid fields', () => {
      expect(
        validateEventEnvelope({
          eventId: '',
          roomId: 'room_1',
          senderId: 'user_1',
          timestamp: -1,
          type: 'custom',
        }).success,
      ).toBe(false);
    });
  });

  describe('PresenceUpdatePayloadSchema', () => {
    it('validates cursor coordinates and selection', () => {
      const payload = {
        fileId: 'src/index.ts',
        cursor: { line: 10, column: 5 },
        selection: {
          startLine: 10,
          startColumn: 0,
          endLine: 10,
          endColumn: 20,
        },
        status: 'active',
      };

      const result = validatePresenceUpdate(payload);
      expect(result.success).toBe(true);
    });

    it('rejects negative line numbers or invalid status', () => {
      expect(
        validatePresenceUpdate({
          cursor: { line: -1, column: 0 },
        }).success,
      ).toBe(false);

      expect(
        validatePresenceUpdate({
          status: 'sleeping',
        }).success,
      ).toBe(false);
    });
  });

  describe('ChatSendPayloadSchema', () => {
    it('accepts valid chat messages', () => {
      const result = validateChatSend({
        messageId: 'msg_1',
        content: 'Hello everyone!',
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty or whitespace-only messages', () => {
      expect(
        validateChatSend({
          messageId: 'msg_1',
          content: '   ',
        }).success,
      ).toBe(false);
    });

    it('rejects messages exceeding 4000 characters', () => {
      expect(
        validateChatSend({
          messageId: 'msg_1',
          content: 'a'.repeat(4001),
        }).success,
      ).toBe(false);

      expect(
        validateChatSend({
          messageId: 'msg_1',
          content: 'a'.repeat(4000),
        }).success,
      ).toBe(true);
    });
  });

  describe('CollaborationEventSchema (Discriminated Union)', () => {
    const baseEnvelope = {
      eventId: 'evt_100',
      roomId: 'room_abc',
      senderId: 'participant_1',
      timestamp: Date.now(),
      version: 1,
    };

    it('validates presence.update event', () => {
      const event = {
        ...baseEnvelope,
        type: 'presence.update',
        payload: {
          cursor: { line: 1, column: 2 },
          status: 'active',
        },
      };

      const result = validateCollaborationEvent(event);
      expect(result.success).toBe(true);
    });

    it('validates chat.send event', () => {
      const event = {
        ...baseEnvelope,
        type: 'chat.send',
        payload: {
          messageId: 'm1',
          content: 'Can you check line 42?',
        },
      };

      const result = validateCollaborationEvent(event);
      expect(result.success).toBe(true);
    });

    it('validates role.set event', () => {
      const event = {
        ...baseEnvelope,
        type: 'role.set',
        payload: {
          targetParticipantId: 'guest_99',
          role: 'VIEWER',
        },
      };

      const result = validateCollaborationEvent(event);
      expect(result.success).toBe(true);
    });

    it('validates room.lock event', () => {
      const event = {
        ...baseEnvelope,
        type: 'room.lock',
        payload: {
          isLocked: true,
        },
      };

      const result = validateCollaborationEvent(event);
      expect(result.success).toBe(true);
    });

    it('validates file operations events', () => {
      const createEvent = {
        ...baseEnvelope,
        type: 'file.create',
        payload: {
          path: 'src/components/Header.tsx',
          isDirectory: false,
          initialContent: '// React Header',
        },
      };
      expect(validateCollaborationEvent(createEvent).success).toBe(true);

      const renameEvent = {
        ...baseEnvelope,
        type: 'file.rename',
        payload: {
          oldPath: 'src/utils.ts',
          newPath: 'src/helpers.ts',
        },
      };
      expect(validateCollaborationEvent(renameEvent).success).toBe(true);

      const deleteEvent = {
        ...baseEnvelope,
        type: 'file.delete',
        payload: {
          path: 'temp.txt',
        },
      };
      expect(validateCollaborationEvent(deleteEvent).success).toBe(true);
    });

    it('validates follow and spotlight events', () => {
      const followEvent = {
        ...baseEnvelope,
        type: 'awareness.follow',
        payload: {
          targetParticipantId: 'host_id',
        },
      };
      expect(validateCollaborationEvent(followEvent).success).toBe(true);

      const unfollowEvent = {
        ...baseEnvelope,
        type: 'awareness.follow',
        payload: {
          targetParticipantId: null,
        },
      };
      expect(validateCollaborationEvent(unfollowEvent).success).toBe(true);

      const spotlightEvent = {
        ...baseEnvelope,
        type: 'awareness.spotlight',
        payload: {
          targetParticipantId: 'interviewer_1',
        },
      };
      expect(validateCollaborationEvent(spotlightEvent).success).toBe(true);
    });

    it('rejects unknown event type', () => {
      const unknownEvent = {
        ...baseEnvelope,
        type: 'unsupported.event',
        payload: {},
      };

      const result = validateCollaborationEvent(unknownEvent);
      expect(result.success).toBe(false);
    });
  });
});
