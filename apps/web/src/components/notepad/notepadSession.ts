import * as Y from 'yjs';

export interface NotepadSession {
  doc: Y.Doc;
  text: Y.Text;
  getText: () => string;
  insert: (index: number, content: string) => void;
  deleteText: (index: number, length: number) => void;
  setText: (content: string) => void;
  onUpdate: (callback: (updateBase64: string, origin: any) => void) => () => void;
  applyRemoteUpdate: (updateBase64: string) => void;
  exportMarkdownBlob: () => Blob;
  destroy: () => void;
}

/**
 * Creates an isolated Yjs document session specifically for the room's collaborative notepad.
 * Per SRS FR-BOARD-01..04:
 * Uses a dedicated, separate Y.Doc buffer ('notepad') to guarantee that notes editing
 * never conflicts with or mutates the active code workspace (FR-BOARD-02).
 */
export function createNotepadSession(initialText = ''): NotepadSession {
  const doc = new Y.Doc();
  const text = doc.getText('notepad');

  if (initialText && text.length === 0) {
    text.insert(0, initialText);
  }

  const onUpdate = (callback: (updateBase64: string, origin: any) => void) => {
    const handler = (update: Uint8Array, origin: any) => {
      const base64 = Buffer.from(update).toString('base64');
      callback(base64, origin);
    };

    doc.on('update', handler);
    return () => {
      doc.off('update', handler);
    };
  };

  const applyRemoteUpdate = (updateBase64: string) => {
    try {
      const binary = Uint8Array.from(Buffer.from(updateBase64, 'base64'));
      Y.applyUpdate(doc, binary, 'remote');
    } catch {
      // Ignore malformed binary framing
    }
  };

  const exportMarkdownBlob = (): Blob => {
    const content = text.toString();
    return new Blob([content], { type: 'text/markdown;charset=utf-8' });
  };

  return {
    doc,
    text,
    getText: () => text.toString(),
    insert: (index: number, content: string) => {
      text.insert(index, content);
    },
    deleteText: (index: number, length: number) => {
      text.delete(index, length);
    },
    setText: (content: string) => {
      doc.transact(() => {
        text.delete(0, text.length);
        text.insert(0, content);
      });
    },
    onUpdate,
    applyRemoteUpdate,
    exportMarkdownBlob,
    destroy: () => {
      doc.destroy();
    },
  };
}
