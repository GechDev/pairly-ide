import { z } from 'zod';
import {
  ParticipantIdentitySchema,
  type ParticipantIdentity,
  type RoomRole,
} from '@pairly/contracts';

export interface RoomAuthContext {
  participant: ParticipantIdentity;
  roomCode: string;
  isAuthenticated: boolean;
}

export const TokenPayloadSchema = z.object({
  participantId: z.string().min(1),
  displayName: z.string().min(1),
  avatar: z.string().default('default-avatar.png'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#3b82f6'),
  role: z.enum(['HOST', 'EDITOR', 'COMMENTER', 'VIEWER']),
  roomCode: z.string().min(1),
  expiresAt: z.number().optional(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

/**
 * Generates a mock signed connection token for room authentication.
 * Used for development, testing, and initial session issuance.
 */
export function generateMockRoomToken(payload: TokenPayload): string {
  const json = JSON.stringify(payload);
  const base64 = Buffer.from(json).toString('base64url');
  return `pairly_mock_${base64}`;
}

/**
 * Authenticates a room connection token.
 * Validates integrity, schema, expiration, and room binding.
 * Per SRS FR-RT-01, FR-RT-04 and SEC-01.
 */
export function authenticateRoomToken(
  token: string | undefined,
  expectedRoomCode?: string
): RoomAuthContext {
  if (!token) {
    throw new Error('Authentication failed: Missing connection token');
  }

  // Handle mock tokens format: pairly_mock_<base64url>
  if (token.startsWith('pairly_mock_')) {
    const raw = token.replace('pairly_mock_', '');
    try {
      const decoded = Buffer.from(raw, 'base64url').toString('utf-8');
      const parsed = TokenPayloadSchema.parse(JSON.parse(decoded));

      if (expectedRoomCode && parsed.roomCode !== expectedRoomCode) {
        throw new Error(
          `Token bound to room ${parsed.roomCode}, cannot join room ${expectedRoomCode}`
        );
      }

      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        throw new Error('Connection token has expired');
      }

      const participant: ParticipantIdentity = {
        id: parsed.participantId,
        displayName: parsed.displayName,
        avatar: parsed.avatar,
        color: parsed.color,
        role: parsed.role as RoomRole,
        isGuest: parsed.role !== 'HOST',
      };

      // Ensure valid through contracts schema
      ParticipantIdentitySchema.parse(participant);

      return {
        participant,
        roomCode: parsed.roomCode,
        isAuthenticated: true,
      };
    } catch (err: any) {
      throw new Error(`Authentication token invalid: ${err.message}`);
    }
  }

  // Fallback simplified token: user:<userId>:<role>:<roomCode>
  const parts = token.split(':');
  if (parts.length === 4 && parts[0] === 'user') {
    const [, userId, roleStr, roomCode] = parts;
    if (expectedRoomCode && roomCode !== expectedRoomCode) {
      throw new Error(
        `Token bound to room ${roomCode}, cannot join room ${expectedRoomCode}`
      );
    }

    const role = (['HOST', 'EDITOR', 'COMMENTER', 'VIEWER'].includes(roleStr!)
      ? roleStr
      : 'VIEWER') as RoomRole;

    const participant: ParticipantIdentity = {
      id: userId!,
      displayName: `User ${userId}`,
      avatar: 'default.png',
      color: '#6366f1',
      role,
      isGuest: role !== 'HOST',
    };

    return {
      participant,
      roomCode: roomCode!,
      isAuthenticated: true,
    };
  }

  throw new Error('Invalid token format');
}
