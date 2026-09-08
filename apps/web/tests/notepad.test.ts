import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { createNotepadSession } from '../src/components/notepad/notepadSession';
import { createWorkspaceManager } from '../src/components/workspace/workspaceState';

describe('Shared Collaborative Notepad (FR-BOARD-02, FR-BOARD-04)', () => {
  it('initializes dedicated Yjs CRDT session with default/initial content', () => {
    const session = createNotepadSession('# Hello Notes\n\nTesting collaborative notes.');
    expect(session.getText()).toBe('# Hello Notes\n\nTesting collaborative notes.');
    expect(session.getYDoc()).toBeInstanceOf(Y.Doc);
    session.destroy();
  });

  it('updates local text and dispatches update callbacks', () => {
    const session = createNotepadSession('Initial');
    let emittedUpdate: string | null = null;
    let emittedOrigin: any = null;

    const unsub = session.onUpdate((update, origin) => {
      emittedUpdate = update;
      emittedOrigin = origin;
    });

    session.setText('Updated text content');
    expect(session.getText()).toBe('Updated text content');
    expect(emittedUpdate).toBeTruthy();
    expect(typeof emittedUpdate).toBe('string');
    expect(emittedOrigin).toBe('local');

    unsub();
    session.destroy();
  });

  it('converges across two peer notepad sessions via base64 CRDT sync', () => {
    const peerA = createNotepadSession();
    const peerB = createNotepadSession();

    // Peer A makes changes and sends to Peer B
    let updateFromA: string = '';
    peerA.onUpdate((b64) => {
      updateFromA = b64;
    });

    peerA.setText('Merged markdown content from peer A');
    expect(updateFromA).toBeTruthy();

    peerB.applyUpdate(updateFromA);
    expect(peerB.getText()).toBe('Merged markdown content from peer A');

    peerA.destroy();
    peerB.destroy();
  });

  it('exports valid markdown blob with correct mime-type and UTF-8 encoding', async () => {
    const content = '# Architectural Notes\n\n- [x] Sandboxed execution\n- [x] Shared notepad';
    const session = createNotepadSession(content);

    const blob = session.exportMarkdownBlob();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/markdown;charset=utf-8');

    const text = await blob.text();
    expect(text).toBe(content);
    session.destroy();
  });

  it('preserves complete Yjs buffer isolation from workspace file CRDT trees', () => {
    const workspace = createWorkspaceManager();
    const notepadSession = createNotepadSession('# Isolated Notepad Notes');

    // Add code file to workspace
    const initialFiles = workspace.getState().items;
    notepadSession.setText('# Completely Mutated Notes\n\nRandom text that should not affect code');

    // Workspace files must remain intact and completely decoupled
    const currentFiles = workspace.getState().items;
    expect(currentFiles.length).toBe(initialFiles.length);
    expect(currentFiles.find((f) => f.name === 'main.ts')?.content).toBe(
      initialFiles.find((f) => f.name === 'main.ts')?.content
    );

    notepadSession.destroy();
  });
});
