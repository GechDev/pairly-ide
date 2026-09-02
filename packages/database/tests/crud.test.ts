import { describe, expect, it } from 'vitest';
import {
  getPrismaClient,
  Prisma,
  PrismaClient,
  RoomAccessMode,
  RoomMode,
  RoomRole,
} from '../src/index.js';

describe('Prisma Client & Model CRUD Contracts', () => {
  it('getPrismaClient returns a configured PrismaClient singleton', () => {
    const client = getPrismaClient();
    expect(client).toBeDefined();
    expect(client instanceof PrismaClient).toBe(true);
    expect(client.user).toBeDefined();
    expect(client.room).toBeDefined();
    expect(client.roomParticipant).toBeDefined();
    expect(client.workspaceSnapshot).toBeDefined();
  });

  describe('User CRUD typings & query builders', () => {
    it('constructs valid User create input with all required fields', () => {
      const userInput: Prisma.UserCreateInput = {
        name: 'Jane Developer',
        email: 'jane@example.com',
        avatar: 'https://example.com/avatar.png',
        githubId: 'gh_12345',
        preferences: { theme: 'dark', keybinding: 'default' },
      };

      expect(userInput.name).toBe('Jane Developer');
      expect(userInput.email).toBe('jane@example.com');
      expect(userInput.githubId).toBe('gh_12345');
    });

    it('constructs valid User update and soft-delete input', () => {
      const updateInput: Prisma.UserUpdateInput = {
        name: 'Jane D. Senior',
        deletedAt: new Date(),
      };

      expect(updateInput.name).toBe('Jane D. Senior');
      expect(updateInput.deletedAt instanceof Date).toBe(true);
    });
  });

  describe('Room CRUD typings & relations', () => {
    it('constructs valid Room create input with defaults and relations', () => {
      const roomInput: Prisma.RoomCreateInput = {
        code: 'pair-7788',
        title: 'Fullstack Pairing Room',
        accessMode: RoomAccessMode.PASSCODE,
        passcodeHash: 'argon2id$hashedpasscode',
        roomMode: RoomMode.COLLABORATIVE,
        isLocked: false,
        executionEnabled: true,
        aiEnabled: true,
        maxParticipants: 10,
        defaultRole: RoomRole.EDITOR,
        host: {
          connect: { id: 'user_host_123' },
        },
      };

      expect(roomInput.code).toBe('pair-7788');
      expect(roomInput.accessMode).toBe('PASSCODE');
      expect(roomInput.roomMode).toBe('COLLABORATIVE');
      expect(roomInput.defaultRole).toBe('EDITOR');
    });

    it('constructs valid Room update input for dynamic host controls', () => {
      const roomUpdate: Prisma.RoomUpdateInput = {
        isLocked: true,
        executionEnabled: false,
        aiEnabled: false,
        maxParticipants: 5,
        defaultRole: RoomRole.VIEWER,
      };

      expect(roomUpdate.isLocked).toBe(true);
      expect(roomUpdate.defaultRole).toBe('VIEWER');
    });
  });

  describe('RoomParticipant CRUD typings for guests and registered users', () => {
    it('constructs valid guest participant input', () => {
      const guestInput: Prisma.RoomParticipantCreateInput = {
        guestDisplayName: 'Anonymous Lynx',
        guestAvatar: 'avatar_lynx',
        guestColor: '#8b5cf6',
        role: RoomRole.COMMENTER,
        room: {
          connect: { id: 'room_123' },
        },
      };

      expect(guestInput.guestDisplayName).toBe('Anonymous Lynx');
      expect(guestInput.role).toBe('COMMENTER');
    });

    it('constructs valid registered user participant input', () => {
      const memberInput: Prisma.RoomParticipantCreateInput = {
        role: RoomRole.EDITOR,
        user: {
          connect: { id: 'user_registered_1' },
        },
        room: {
          connect: { id: 'room_123' },
        },
      };

      expect(memberInput.role).toBe('EDITOR');
    });

    it('constructs moderation update input (mute, ban, role change)', () => {
      const moderationInput: Prisma.RoomParticipantUpdateInput = {
        role: RoomRole.VIEWER,
        isMuted: true,
        isBanned: true,
        leftAt: new Date(),
      };

      expect(moderationInput.role).toBe('VIEWER');
      expect(moderationInput.isMuted).toBe(true);
      expect(moderationInput.isBanned).toBe(true);
    });
  });

  describe('WorkspaceSnapshot CRUD & Byte Data Integrity', () => {
    it('constructs valid WorkspaceSnapshot with binary buffer', () => {
      const rawCrdtUpdate = Buffer.from([0x01, 0x02, 0x03, 0xff, 0xee]);
      const snapshotInput: Prisma.WorkspaceSnapshotCreateInput = {
        version: 1,
        name: 'Initial Checkpoint',
        data: rawCrdtUpdate,
        sizeBytes: rawCrdtUpdate.length,
        room: {
          connect: { id: 'room_123' },
        },
        createdBy: {
          connect: { id: 'user_host_123' },
        },
      };

      expect(snapshotInput.version).toBe(1);
      expect(snapshotInput.sizeBytes).toBe(5);
      expect(Buffer.isBuffer(snapshotInput.data)).toBe(true);
    });
  });
});
