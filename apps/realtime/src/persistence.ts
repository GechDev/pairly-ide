import * as Y from 'yjs';

export interface InMemorySnapshot {
  id: string;
  roomId: string;
  version: number;
  name: string;
  dataBase64: string;
  sizeBytes: number;
  createdAt: number;
}

export interface PersistenceManager {
  bufferUpdate: (roomId: string, updateBase64: string) => void;
  createNamedSnapshot: (roomId: string, name: string, dataBase64?: string) => InMemorySnapshot;
  getSnapshots: (roomId: string) => InMemorySnapshot[];
  getSnapshotById: (roomId: string, snapshotId: string) => InMemorySnapshot | undefined;
  getLatestState: (roomId: string) => string | null;
  flush: (roomId?: string) => Promise<void>;
  destroy: () => void;
}

/**
 * Debounced persistence manager for Yjs CRDT workspace documents.
 * Per SRS FR-HIST-01 and FR-HIST-02:
 * - Debounces and records binary updates.
 * - Supports manual "Save Checkpoint" named versions.
 * - Enables rollback and restoration of historical states.
 */
export function createPersistenceManager(
  flushIntervalMs = 30000,
  onPersist?: (roomId: string, stateBase64: string) => Promise<void>
): PersistenceManager {
  const roomDocs = new Map<string, Y.Doc>();
  const snapshots = new Map<string, InMemorySnapshot[]>();
  const dirtyRooms = new Set<string>();

  const getOrCreateDoc = (roomId: string): Y.Doc => {
    let doc = roomDocs.get(roomId);
    if (!doc) {
      doc = new Y.Doc();
      roomDocs.set(roomId, doc);
    }
    return doc;
  };

  const bufferUpdate = (roomId: string, updateBase64: string) => {
    try {
      const doc = getOrCreateDoc(roomId);
      const updateBytes = Buffer.from(updateBase64, 'base64');
      Y.applyUpdate(doc, new Uint8Array(updateBytes));
      dirtyRooms.add(roomId);
    } catch (err) {
      console.error(`[Persistence] Failed to apply update to room ${roomId}:`, err);
    }
  };

  const createNamedSnapshot = (
    roomId: string,
    name: string,
    customDataBase64?: string
  ): InMemorySnapshot => {
    const doc = getOrCreateDoc(roomId);
    const state = customDataBase64 || Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
    const existing = snapshots.get(roomId) || [];
    const nextVersion = existing.length + 1;

    const snapshot: InMemorySnapshot = {
      id: `snap-${roomId}-${nextVersion}-${Date.now()}`,
      roomId,
      version: nextVersion,
      name,
      dataBase64: state,
      sizeBytes: Buffer.byteLength(state, 'utf8'),
      createdAt: Date.now(),
    };

    snapshots.set(roomId, [...existing, snapshot]);
    return snapshot;
  };

  const getSnapshots = (roomId: string): InMemorySnapshot[] => {
    return snapshots.get(roomId) || [];
  };

  const getSnapshotById = (roomId: string, snapshotId: string): InMemorySnapshot | undefined => {
    return snapshots.get(roomId)?.find((s) => s.id === snapshotId);
  };

  const getLatestState = (roomId: string): string | null => {
    const doc = roomDocs.get(roomId);
    if (!doc) return null;
    return Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64');
  };

  const flush = async (specificRoomId?: string) => {
    const roomsToFlush = specificRoomId
      ? [specificRoomId]
      : Array.from(dirtyRooms.values());

    for (const rId of roomsToFlush) {
      if (dirtyRooms.has(rId)) {
        const state = getLatestState(rId);
        if (state && onPersist) {
          try {
            await onPersist(rId, state);
          } catch (err) {
            console.error(`[Persistence] Flush failed for room ${rId}:`, err);
          }
        }
        dirtyRooms.delete(rId);
      }
    }
  };

  const intervalTimer = setInterval(() => {
    void flush();
  }, flushIntervalMs);

  const destroy = () => {
    clearInterval(intervalTimer);
    roomDocs.forEach((doc) => doc.destroy());
    roomDocs.clear();
    snapshots.clear();
    dirtyRooms.clear();
  };

  return {
    bufferUpdate,
    createNamedSnapshot,
    getSnapshots,
    getSnapshotById,
    getLatestState,
    flush,
    destroy,
  };
}
