import { z } from 'zod';
import { ParticipantIdentitySchema, RoomRoleSchema } from './room.js';

/**
 * Collaboration Event Types.
 * Per SRS 6.3: Event families include presence, chat, role, file, and room errors.
 */
export const EventTypeSchema = z.enum([
  'presence.update',
  'chat.send',
  'chat.message',
  'role.set',
  'room.lock',
  'room.kick',
  'room.error',
  'file.create',
  'file.rename',
  'file.delete',
  'awareness.follow',
  'awareness.spotlight',
]);
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Presence Update Payload.
 * Tracks remote cursor, active file, selection, and connection activity.
 */
export const PresenceUpdatePayloadSchema = z.object({
  fileId: z.string().nullable().optional(),
  cursor: z
    .object({
      line: z.number().int().nonnegative('Line number must be non-negative'),
      column: z.number().int().nonnegative('Column number must be non-negative'),
    })
    .optional(),
  selection: z
    .object({
      startLine: z.number().int().nonnegative(),
      startColumn: z.number().int().nonnegative(),
      endLine: z.number().int().nonnegative(),
      endColumn: z.number().int().nonnegative(),
    })
    .optional(),
  status: z.enum(['active', 'idle', 'away']).default('active'),
});
export type PresenceUpdatePayload = z.infer<typeof PresenceUpdatePayloadSchema>;

/**
 * Chat Message Send Payload (client to coordinator).
 * Enforces size limits and schema validation (SRS 6.3, FR-COMM-01, FR-COMM-02).
 */
export const ChatSendPayloadSchema = z.object({
  messageId: z.string().min(1, 'messageId is required'),
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message cannot exceed 4000 characters'),
  replyToMessageId: z.string().nullable().optional(),
});
export type ChatSendPayload = z.infer<typeof ChatSendPayloadSchema>;

/**
 * Chat Message Broadcast Payload (coordinator to clients).
 */
export const ChatMessagePayloadSchema = z.object({
  messageId: z.string().min(1),
  sender: ParticipantIdentitySchema,
  content: z.string().min(1).max(4000),
  replyToMessageId: z.string().nullable().optional(),
  timestamp: z.number().int().positive(),
});
export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;

/**
 * Role Modification Payload.
 * Per SRS FR-ROOM-06: Host changes participant role.
 */
export const RoleSetPayloadSchema = z.object({
  targetParticipantId: z.string().min(1, 'targetParticipantId is required'),
  role: RoomRoleSchema,
});
export type RoleSetPayload = z.infer<typeof RoleSetPayloadSchema>;

/**
 * Room Lock Payload.
 * Per SRS FR-ROOM-07.
 */
export const RoomLockPayloadSchema = z.object({
  isLocked: z.boolean(),
});
export type RoomLockPayload = z.infer<typeof RoomLockPayloadSchema>;

/**
 * Room Kick/Remove Participant Payload.
 * Per SRS FR-ROOM-07.
 */
export const RoomKickPayloadSchema = z.object({
  targetParticipantId: z.string().min(1, 'targetParticipantId is required'),
  reason: z.string().max(200).optional(),
});
export type RoomKickPayload = z.infer<typeof RoomKickPayloadSchema>;

/**
 * Room Error Event Payload.
 */
export const RoomErrorPayloadSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.record(z.unknown()).optional(),
});
export type RoomErrorPayload = z.infer<typeof RoomErrorPayloadSchema>;

/**
 * Multi-File Workspace Event Payloads (SRS FR-EDIT-02).
 */
export const FileCreatePayloadSchema = z.object({
  path: z.string().min(1, 'File path is required').max(500, 'File path too long'),
  isDirectory: z.boolean().default(false),
  initialContent: z.string().optional(),
});
export type FileCreatePayload = z.infer<typeof FileCreatePayloadSchema>;

export const FileRenamePayloadSchema = z.object({
  oldPath: z.string().min(1).max(500),
  newPath: z.string().min(1).max(500),
});
export type FileRenamePayload = z.infer<typeof FileRenamePayloadSchema>;

export const FileDeletePayloadSchema = z.object({
  path: z.string().min(1).max(500),
});
export type FileDeletePayload = z.infer<typeof FileDeletePayloadSchema>;

/**
 * Follow Mode & Spotlight Payloads (SRS FR-EDIT-07, FR-EDIT-08).
 */
export const FollowPayloadSchema = z.object({
  targetParticipantId: z.string().min(1).nullable(),
});
export type FollowPayload = z.infer<typeof FollowPayloadSchema>;

export const SpotlightPayloadSchema = z.object({
  targetParticipantId: z.string().min(1).nullable(),
});
export type SpotlightPayload = z.infer<typeof SpotlightPayloadSchema>;

/**
 * Generic Event Envelope Schema.
 */
export const EventEnvelopeSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
  roomId: z.string().min(1, 'roomId is required'),
  senderId: z.string().min(1, 'senderId is required'),
  timestamp: z.number().int().positive('timestamp must be a positive integer'),
  version: z.number().int().nonnegative().default(1),
  type: z.string().min(1),
  payload: z.unknown(),
});
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;

/**
 * Strictly-typed Collaboration Events (Discriminated Union on 'type').
 */
export const CollaborationEventSchema = z.discriminatedUnion('type', [
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('presence.update'),
    payload: PresenceUpdatePayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('chat.send'),
    payload: ChatSendPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('chat.message'),
    payload: ChatMessagePayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('role.set'),
    payload: RoleSetPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('room.lock'),
    payload: RoomLockPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('room.kick'),
    payload: RoomKickPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('room.error'),
    payload: RoomErrorPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('file.create'),
    payload: FileCreatePayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('file.rename'),
    payload: FileRenamePayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('file.delete'),
    payload: FileDeletePayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('awareness.follow'),
    payload: FollowPayloadSchema,
  }),
  z.object({
    eventId: z.string().min(1),
    roomId: z.string().min(1),
    senderId: z.string().min(1),
    timestamp: z.number().int().positive(),
    version: z.number().int().nonnegative().default(1),
    type: z.literal('awareness.spotlight'),
    payload: SpotlightPayloadSchema,
  }),
]);
export type CollaborationEvent = z.infer<typeof CollaborationEventSchema>;

/* Runtime validation helpers */
export function validateEventEnvelope(input: unknown) {
  return EventEnvelopeSchema.safeParse(input);
}

export function validateCollaborationEvent(input: unknown) {
  return CollaborationEventSchema.safeParse(input);
}

export function validateChatSend(input: unknown) {
  return ChatSendPayloadSchema.safeParse(input);
}

export function validatePresenceUpdate(input: unknown) {
  return PresenceUpdatePayloadSchema.safeParse(input);
}
