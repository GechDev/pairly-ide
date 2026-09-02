import { z } from 'zod';

/**
 * User Roles supported across Pairly rooms.
 * Per SRS FR-ROOM-05: The system shall support Host, Editor, Commenter, and Viewer roles.
 */
export const RoomRoleSchema = z.enum(['HOST', 'EDITOR', 'COMMENTER', 'VIEWER']);
export type RoomRole = z.infer<typeof RoomRoleSchema>;

/**
 * Role-Based Access Control permission helpers.
 * Server-side authorization rules (SEC-01, SEC-03, FR-ROOM-05..07).
 */
export function canWrite(role: RoomRole): boolean {
  return role === 'HOST' || role === 'EDITOR';
}

export function canExecute(role: RoomRole): boolean {
  return role === 'HOST' || role === 'EDITOR';
}

export function canComment(role: RoomRole): boolean {
  return role === 'HOST' || role === 'EDITOR' || role === 'COMMENTER';
}

export function canManageRoom(role: RoomRole): boolean {
  return role === 'HOST';
}

/**
 * Room Access Modes.
 * Per SRS FR-ROOM-04: Hosts shall configure access as link-accessible,
 * passcode-protected, invite-only, or lobby-admitted.
 */
export const RoomAccessModeSchema = z.enum(['PUBLIC', 'PASSCODE', 'INVITE_ONLY', 'LOBBY']);
export type RoomAccessMode = z.infer<typeof RoomAccessModeSchema>;

/**
 * Operating Mode for the Room.
 * Per SRS FR-MODE-01, 1.2: Standard collaborative IDE, technical interview, or classroom.
 */
export const RoomModeSchema = z.enum(['COLLABORATIVE', 'INTERVIEW', 'CLASSROOM']);
export type RoomMode = z.infer<typeof RoomModeSchema>;

/**
 * Participant Identity Schema.
 * Per SRS FR-ROOM-03: Guests shall receive a temporary identity with
 * editable display name, avatar, and color.
 */
export const ParticipantIdentitySchema = z.object({
  id: z.string().min(1, 'Participant ID is required'),
  userId: z.string().nullable().optional(),
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name cannot be empty')
    .max(50, 'Display name cannot exceed 50 characters'),
  avatar: z.string().min(1, 'Avatar identifier or URL is required').max(2048),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid 6-character hex code (e.g. #3b82f6)'),
  role: RoomRoleSchema,
  isGuest: z.boolean().default(true),
});
export type ParticipantIdentity = z.infer<typeof ParticipantIdentitySchema>;

/**
 * Room Code validation.
 * Per SRS FR-ROOM-02: Unique, unguessable URL and human-friendly short code.
 */
export const RoomCodeRegex = /^[a-zA-Z0-9_-]{3,32}$/;
export const RoomCodeSchema = z
  .string()
  .trim()
  .min(3, 'Room code must be at least 3 characters')
  .max(32, 'Room code cannot exceed 32 characters')
  .regex(
    RoomCodeRegex,
    'Room code must only contain alphanumeric characters, hyphens, or underscores',
  );

/**
 * Room Creation Request Schema.
 * Validates untrusted input for creating a new collaboration room.
 */
export const CreateRoomSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    accessMode: RoomAccessModeSchema.default('PUBLIC'),
    passcode: z
      .string()
      .min(4, 'Passcode must be at least 4 characters')
      .max(64, 'Passcode cannot exceed 64 characters')
      .optional(),
    roomMode: RoomModeSchema.default('COLLABORATIVE'),
    maxParticipants: z
      .number()
      .int()
      .min(2, 'Minimum 2 participants')
      .max(100, 'Maximum 100 participants')
      .default(20),
    executionEnabled: z.boolean().default(true),
    aiEnabled: z.boolean().default(true),
    defaultRole: RoomRoleSchema.default('EDITOR'),
    expiresAt: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.accessMode === 'PASSCODE') {
        return typeof data.passcode === 'string' && data.passcode.trim().length >= 4;
      }
      return true;
    },
    {
      message: 'Passcode of at least 4 characters is required when access mode is PASSCODE',
      path: ['passcode'],
    },
  );
export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

/**
 * Room Join Request Schema.
 */
export const JoinRoomSchema = z.object({
  roomCode: RoomCodeSchema,
  passcode: z.string().min(1).max(64).optional(),
  guestProfile: z
    .object({
      displayName: z.string().trim().min(1).max(50),
      avatar: z.string().min(1).max(2048).optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
    })
    .optional(),
});
export type JoinRoomInput = z.infer<typeof JoinRoomSchema>;

/**
 * Room Settings Update Schema.
 * Per SRS FR-ROOM-04..07: Hosts dynamically modify room access, locks, and feature flags.
 */
export const UpdateRoomSettingsSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  accessMode: RoomAccessModeSchema.optional(),
  passcode: z.string().min(4).max(64).nullable().optional(),
  isLocked: z.boolean().optional(),
  executionEnabled: z.boolean().optional(),
  aiEnabled: z.boolean().optional(),
  maxParticipants: z.number().int().min(2).max(100).optional(),
  defaultRole: RoomRoleSchema.optional(),
});
export type UpdateRoomSettingsInput = z.infer<typeof UpdateRoomSettingsSchema>;

/**
 * Change Participant Role Schema.
 * Per SRS FR-ROOM-06: Host dynamically modifies participant permissions.
 */
export const ChangeParticipantRoleSchema = z.object({
  targetParticipantId: z.string().min(1, 'Target participant ID is required'),
  newRole: RoomRoleSchema,
});
export type ChangeParticipantRoleInput = z.infer<typeof ChangeParticipantRoleSchema>;

/**
 * Complete Room Model Schema.
 */
export const RoomSchema = z.object({
  id: z.string().min(1),
  code: RoomCodeSchema,
  title: z.string(),
  accessMode: RoomAccessModeSchema,
  roomMode: RoomModeSchema,
  hostId: z.string().min(1),
  isLocked: z.boolean(),
  executionEnabled: z.boolean(),
  aiEnabled: z.boolean(),
  maxParticipants: z.number().int().positive(),
  defaultRole: RoomRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable().optional(),
});
export type Room = z.infer<typeof RoomSchema>;

/* Runtime validation helpers */
export function validateCreateRoom(input: unknown) {
  return CreateRoomSchema.safeParse(input);
}

export function validateJoinRoom(input: unknown) {
  return JoinRoomSchema.safeParse(input);
}

export function validateUpdateRoomSettings(input: unknown) {
  return UpdateRoomSettingsSchema.safeParse(input);
}

export function validateChangeParticipantRole(input: unknown) {
  return ChangeParticipantRoleSchema.safeParse(input);
}
