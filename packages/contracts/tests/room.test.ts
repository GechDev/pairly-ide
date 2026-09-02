import { describe, expect, it } from 'vitest';
import {
  canComment,
  canExecute,
  canManageRoom,
  canWrite,
  ChangeParticipantRoleSchema,
  CreateRoomSchema,
  JoinRoomSchema,
  ParticipantIdentitySchema,
  RoomCodeSchema,
  RoomRoleSchema,
  UpdateRoomSettingsSchema,
  validateChangeParticipantRole,
  validateCreateRoom,
  validateJoinRoom,
  validateUpdateRoomSettings,
} from '../src/room.js';

describe('Room Contracts & Validation', () => {
  describe('RoomRole & RBAC helpers', () => {
    it('validates supported roles per SRS FR-ROOM-05', () => {
      expect(RoomRoleSchema.parse('HOST')).toBe('HOST');
      expect(RoomRoleSchema.parse('EDITOR')).toBe('EDITOR');
      expect(RoomRoleSchema.parse('COMMENTER')).toBe('COMMENTER');
      expect(RoomRoleSchema.parse('VIEWER')).toBe('VIEWER');
      expect(() => RoomRoleSchema.parse('ADMIN')).toThrow();
    });

    it('enforces write permissions: HOST and EDITOR can write, COMMENTER and VIEWER cannot', () => {
      expect(canWrite('HOST')).toBe(true);
      expect(canWrite('EDITOR')).toBe(true);
      expect(canWrite('COMMENTER')).toBe(false);
      expect(canWrite('VIEWER')).toBe(false);
    });

    it('enforces execution permissions: HOST and EDITOR can execute, COMMENTER and VIEWER cannot', () => {
      expect(canExecute('HOST')).toBe(true);
      expect(canExecute('EDITOR')).toBe(true);
      expect(canExecute('COMMENTER')).toBe(false);
      expect(canExecute('VIEWER')).toBe(false);
    });

    it('enforces comment permissions: HOST, EDITOR, and COMMENTER can comment; VIEWER cannot', () => {
      expect(canComment('HOST')).toBe(true);
      expect(canComment('EDITOR')).toBe(true);
      expect(canComment('COMMENTER')).toBe(true);
      expect(canComment('VIEWER')).toBe(false);
    });

    it('enforces room management: only HOST can manage room', () => {
      expect(canManageRoom('HOST')).toBe(true);
      expect(canManageRoom('EDITOR')).toBe(false);
      expect(canManageRoom('COMMENTER')).toBe(false);
      expect(canManageRoom('VIEWER')).toBe(false);
    });
  });

  describe('ParticipantIdentitySchema', () => {
    it('accepts valid guest participant identity', () => {
      const valid = {
        id: 'guest_123',
        displayName: 'Alice Developer',
        avatar: 'https://example.com/avatar.png',
        color: '#3b82f6',
        role: 'EDITOR',
        isGuest: true,
      };

      const result = ParticipantIdentitySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid hex colors', () => {
      const invalid = {
        id: 'guest_123',
        displayName: 'Alice',
        avatar: 'avatar1',
        color: 'blue', // not a valid hex
        role: 'EDITOR',
      };

      const result = ParticipantIdentitySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects empty or excessively long display names', () => {
      expect(
        ParticipantIdentitySchema.safeParse({
          id: 'p1',
          displayName: '   ',
          avatar: 'av',
          color: '#112233',
          role: 'VIEWER',
        }).success,
      ).toBe(false);

      expect(
        ParticipantIdentitySchema.safeParse({
          id: 'p1',
          displayName: 'a'.repeat(51),
          avatar: 'av',
          color: '#112233',
          role: 'VIEWER',
        }).success,
      ).toBe(false);
    });
  });

  describe('RoomCodeSchema', () => {
    it('accepts valid short codes and unguessable room codes', () => {
      expect(RoomCodeSchema.parse('pair-1234')).toBe('pair-1234');
      expect(RoomCodeSchema.parse('k7m9-x2p1')).toBe('k7m9-x2p1');
      expect(RoomCodeSchema.parse('workspace_abc-123')).toBe('workspace_abc-123');
    });

    it('rejects codes that are too short, too long, or contain invalid symbols', () => {
      expect(() => RoomCodeSchema.parse('ab')).toThrow();
      expect(() => RoomCodeSchema.parse('a'.repeat(33))).toThrow();
      expect(() => RoomCodeSchema.parse('room@invalid')).toThrow();
      expect(() => RoomCodeSchema.parse('room with space')).toThrow();
    });
  });

  describe('CreateRoomSchema & validateCreateRoom', () => {
    it('validates minimal default room creation payload', () => {
      const result = validateCreateRoom({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accessMode).toBe('PUBLIC');
        expect(result.data.roomMode).toBe('COLLABORATIVE');
        expect(result.data.maxParticipants).toBe(20);
        expect(result.data.executionEnabled).toBe(true);
        expect(result.data.aiEnabled).toBe(true);
        expect(result.data.defaultRole).toBe('EDITOR');
      }
    });

    it('validates customized room creation parameters', () => {
      const result = validateCreateRoom({
        title: 'Backend Pairing Session',
        accessMode: 'INVITE_ONLY',
        roomMode: 'INTERVIEW',
        maxParticipants: 10,
        executionEnabled: false,
        aiEnabled: false,
        defaultRole: 'VIEWER',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Backend Pairing Session');
        expect(result.data.accessMode).toBe('INVITE_ONLY');
        expect(result.data.roomMode).toBe('INTERVIEW');
        expect(result.data.maxParticipants).toBe(10);
      }
    });

    it('requires a passcode of at least 4 characters when accessMode is PASSCODE', () => {
      const missingPasscode = validateCreateRoom({
        accessMode: 'PASSCODE',
      });
      expect(missingPasscode.success).toBe(false);

      const shortPasscode = validateCreateRoom({
        accessMode: 'PASSCODE',
        passcode: '123',
      });
      expect(shortPasscode.success).toBe(false);

      const validPasscode = validateCreateRoom({
        accessMode: 'PASSCODE',
        passcode: 'secret123',
      });
      expect(validPasscode.success).toBe(true);
    });

    it('rejects participant limits outside allowed bounds [2, 100]', () => {
      expect(validateCreateRoom({ maxParticipants: 1 }).success).toBe(false);
      expect(validateCreateRoom({ maxParticipants: 101 }).success).toBe(false);
      expect(validateCreateRoom({ maxParticipants: 50 }).success).toBe(true);
    });
  });

  describe('JoinRoomSchema & validateJoinRoom', () => {
    it('validates join room input with optional guest profile', () => {
      const result = validateJoinRoom({
        roomCode: 'room-alpha',
        passcode: 'pass123',
        guestProfile: {
          displayName: 'Bob',
          color: '#22c55e',
        },
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid join room input', () => {
      const result = validateJoinRoom({
        roomCode: '??bad-code??',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateRoomSettings & ChangeParticipantRole', () => {
    it('validates room settings updates', () => {
      const result = validateUpdateRoomSettings({
        isLocked: true,
        executionEnabled: false,
        maxParticipants: 30,
      });

      expect(result.success).toBe(true);
    });

    it('validates role change payload', () => {
      const result = validateChangeParticipantRole({
        targetParticipantId: 'user_456',
        newRole: 'VIEWER',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid role change payload', () => {
      const result = validateChangeParticipantRole({
        targetParticipantId: '',
        newRole: 'SUPERUSER',
      });

      expect(result.success).toBe(false);
    });
  });
});
