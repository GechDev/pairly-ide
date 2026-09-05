import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Y from 'yjs';
import type { PrismaClient } from '@prisma/client';
import { createPersistenceManager } from '../../realtime/src/persistence';
import {
  createWorkspaceSnapshot,
  getRoomSnapshots,
  getSnapshotById,
} from '@pairly/database';

describe('T-11: Workspace Snapshot Persistence & Checkpoint Recovery (AT-10)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces binary Yjs state persistence to avoid thrashing (FR-COLLAB-06)', async () => {
    const mockPersist = vi.fn().mockResolvedValue(undefined);
    const pm = createPersistenceManager(500, mockPersist);

    const doc = new Y.Doc();
    const text = doc.getText('monaco');

    // Make edits
    text.insert(0, 'console.log("Hello 1");');
    const update1 = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
    pm.bufferUpdate('room-test-1', update1);

    // Save should not have been called immediately
    expect(mockPersist).not.toHaveBeenCalled();

    // Advance 200ms - still debouncing
    await vi.advanceTimersByTimeAsync(200);
    expect(mockPersist).not.toHaveBeenCalled();

    // Another edit within debounce window
    text.insert(text.length, '\nconsole.log("Hello 2");');
    const update2 = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
    pm.bufferUpdate('room-test-1', update2);

    // Advance past flush interval (500ms)
    await vi.advanceTimersByTimeAsync(500);

    expect(mockPersist).toHaveBeenCalledTimes(1);
    expect(mockPersist).toHaveBeenCalledWith('room-test-1', expect.any(String));

    pm.destroy();
  });

  it('flushes dirty room state immediately when flush is requested', async () => {
    const mockPersist = vi.fn().mockResolvedValue(undefined);
    const pm = createPersistenceManager(5000, mockPersist);

    const doc = new Y.Doc();
    doc.getText('monaco').insert(0, 'critical update');
    const update = Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');

    pm.bufferUpdate('room-test-force', update);
    expect(mockPersist).not.toHaveBeenCalled();

    await pm.flush('room-test-force');

    expect(mockPersist).toHaveBeenCalledTimes(1);
    expect(mockPersist).toHaveBeenCalledWith('room-test-force', expect.any(String));

    pm.destroy();
  });

  it('creates, lists, and retrieves snapshots in sequential version order (FR-COLLAB-07)', async () => {
    const store: Array<{
      id: string;
      roomId: string;
      version: number;
      name: string;
      data: Buffer;
      sizeBytes: number;
      createdById: string | null;
      createdAt: Date;
    }> = [];

    const mockPrisma = {
      workspaceSnapshot: {
        findFirst: vi.fn().mockImplementation(async ({ where }: { where: { roomId: string } }) => {
          const roomSnaps = store
            .filter((s) => s.roomId === where.roomId)
            .sort((a, b) => b.version - a.version);
          return roomSnaps[0] || null;
        }),
        create: vi.fn().mockImplementation(async ({ data }: { data: any }) => {
          const entry = {
            id: `snap-${store.length + 1}`,
            ...data,
            createdAt: new Date(Date.now() + store.length * 1000),
          };
          store.push(entry);
          return entry;
        }),
        findMany: vi.fn().mockImplementation(async ({ where }: { where: { roomId: string } }) => {
          return store
            .filter((s) => s.roomId === where.roomId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }),
        findUnique: vi.fn().mockImplementation(async ({ where }: { where: { id: string } }) => {
          return store.find((s) => s.id === where.id) || null;
        }),
      },
    } as unknown as PrismaClient;

    const roomId = 'room-at10-checkpoint-test';
    const stateData = Buffer.from(new Uint8Array([1, 2, 3, 4, 5]));

    // 1. Create first checkpoint
    const snap1 = await createWorkspaceSnapshot(mockPrisma, {
      roomId,
      name: 'Initial Working State',
      data: stateData,
      createdById: 'user-alice',
    });

    expect(snap1.version).toBe(1);
    expect(snap1.name).toBe('Initial Working State');
    expect(snap1.sizeBytes).toBe(stateData.byteLength);

    // 2. Create second checkpoint
    const snap2 = await createWorkspaceSnapshot(mockPrisma, {
      roomId,
      name: 'Before Refactoring',
      data: Buffer.from(new Uint8Array([1, 2, 3, 4, 5, 6, 7])),
      createdById: 'user-bob',
    });

    expect(snap2.version).toBe(2);
    expect(snap2.name).toBe('Before Refactoring');

    // 3. List snapshots (should return both entries)
    const snapshots = await getRoomSnapshots(mockPrisma, roomId);
    expect(snapshots.length).toBe(2);
    expect(snapshots[0].name).toBe('Before Refactoring');
    expect(snapshots[1].name).toBe('Initial Working State');

    // 4. Retrieve specific snapshot by ID
    const retrieved = await getSnapshotById(mockPrisma, snap1.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(snap1.id);
    expect(retrieved?.name).toBe('Initial Working State');
  });

  it('recovers binary Yjs document state from a historical snapshot', () => {
    // 1. Original doc
    const originalDoc = new Y.Doc();
    originalDoc.getText('monaco').insert(0, 'const answer = 42;');
    const snapshotBinary = Y.encodeStateAsUpdate(originalDoc);

    // 2. Corrupted or mutated active doc
    const activeDoc = new Y.Doc();
    activeDoc.getText('monaco').insert(0, 'corrupted text syntax error');

    // 3. Rollback: Create fresh doc and apply snapshot binary update
    const restoredDoc = new Y.Doc();
    Y.applyUpdate(restoredDoc, snapshotBinary);

    expect(restoredDoc.getText('monaco').toString()).toBe('const answer = 42;');
  });
});
