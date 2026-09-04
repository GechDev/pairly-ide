import * as Y from 'yjs';
import type { ParticipantIdentity } from '@pairly/contracts';

export interface RemoteCursor {
  participantId: string;
  displayName: string;
  color: string;
  line: number;
  column: number;
  selectionEnd?: {
    line: number;
    column: number;
  };
}

export interface CollaborativeSession {
  doc: Y.Doc;
  ytext: Y.Text;
  participant: ParticipantIdentity;
  remoteCursors: Map<string, RemoteCursor>;
  getEncodedState: () => string;
  applyEncodedUpdate: (base64Update: string) => void;
  updateLocalCursor: (line: number, column: number) => RemoteCursor;
  setRemoteCursor: (cursor: RemoteCursor) => void;
  removeRemoteCursor: (participantId: string) => void;
  onUpdate: (callback: (updateBase64: string, origin: any) => void) => () => void;
  onCursorChange: (callback: (cursors: RemoteCursor[]) => void) => () => void;
  destroy: () => void;
}

/**
 * Initializes a collaborative editing session powered by Yjs CRDTs.
 * Per SRS FR-EDIT-01 and FR-EDIT-05.
 */
export function createCollaborativeSession(
  initialText = '',
  participant: ParticipantIdentity
): CollaborativeSession {
  const doc = new Y.Doc();
  const ytext = doc.getText('contents');

  if (initialText && ytext.length === 0) {
    ytext.insert(0, initialText);
  }

  const remoteCursors = new Map<string, RemoteCursor>();
  const cursorListeners = new Set<(cursors: RemoteCursor[]) => void>();

  const onUpdateListeners = new Set<
    (updateBase64: string, origin: any) => void
  >();

  const updateHandler = (update: Uint8Array, origin: any) => {
    const base64 = Buffer.from(update).toString('base64');
    for (const listener of onUpdateListeners) {
      listener(base64, origin);
    }
  };

  doc.on('update', updateHandler);

  const notifyCursors = () => {
    const cursorsList = Array.from(remoteCursors.values());
    for (const listener of cursorListeners) {
      listener(cursorsList);
    }
  };

  const setRemoteCursor = (cursor: RemoteCursor): void => {
    remoteCursors.set(cursor.participantId, cursor);
    notifyCursors();
  };

  const removeRemoteCursor = (participantId: string): void => {
    remoteCursors.delete(participantId);
    notifyCursors();
  };

  const updateLocalCursor = (line: number, column: number): RemoteCursor => {
    const cursor: RemoteCursor = {
      participantId: participant.id,
      displayName: participant.displayName,
      color: participant.color,
      line,
      column,
    };
    return cursor;
  };

  const getEncodedState = (): string => {
    const state = Y.encodeStateAsUpdate(doc);
    return Buffer.from(state).toString('base64');
  };

  const applyEncodedUpdate = (base64Update: string): void => {
    try {
      const bytes = Buffer.from(base64Update, 'base64');
      Y.applyUpdate(doc, new Uint8Array(bytes), 'remote');
    } catch (err) {
      console.error('[Yjs] Failed to apply remote update:', err);
    }
  };

  const onUpdate = (
    callback: (updateBase64: string, origin: any) => void
  ): (() => void) => {
    onUpdateListeners.add(callback);
    return () => onUpdateListeners.delete(callback);
  };

  const onCursorChange = (
    callback: (cursors: RemoteCursor[]) => void
  ): (() => void) => {
    cursorListeners.add(callback);
    return () => cursorListeners.delete(callback);
  };

  const destroy = () => {
    doc.off('update', updateHandler);
    onUpdateListeners.clear();
    cursorListeners.clear();
    doc.destroy();
  };

  return {
    doc,
    ytext,
    participant,
    remoteCursors,
    getEncodedState,
    applyEncodedUpdate,
    updateLocalCursor,
    setRemoteCursor,
    removeRemoteCursor,
    onUpdate,
    onCursorChange,
    destroy,
  };
}
