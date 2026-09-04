import { describe, it, expect } from 'vitest';
import { createCollaborativeSession } from '../src/components/editor/yjsExtension';
import type { ParticipantIdentity } from '@pairly/contracts';

describe('AT-02: CRDT Concurrent Editing Convergence and Cursor Sync', () => {
  const alice: ParticipantIdentity = {
    id: 'user-alice-123',
    displayName: 'Alice Engineer',
    avatar: 'https://avatar.test/alice.png',
    color: '#3b82f6',
    role: 'EDITOR',
    isGuest: true,
  };

  const bob: ParticipantIdentity = {
    id: 'user-bob-456',
    displayName: 'Bob Architect',
    avatar: 'https://avatar.test/bob.png',
    color: '#10b981',
    role: 'EDITOR',
    isGuest: true,
  };

  it('converges to identical document state when two participants edit non-overlapping lines concurrently', () => {
    const initialText = 'line 1: header\nline 2: middle\nline 3: footer\n';

    const sessionAlice = createCollaborativeSession(initialText, alice);
    const sessionBob = createCollaborativeSession(initialText, bob);

    // Initial state match
    expect(sessionAlice.ytext.toString()).toBe(initialText);
    expect(sessionBob.ytext.toString()).toBe(initialText);

    // Alice appends to line 1
    sessionAlice.doc.transact(() => {
      sessionAlice.ytext.insert(14, ' [edited by alice]');
    }, 'local');

    // Bob appends to line 3 concurrently before receiving Alice's update
    sessionBob.doc.transact(() => {
      const idx = sessionBob.ytext.toString().indexOf('line 3: footer') + 14;
      sessionBob.ytext.insert(idx, ' [edited by bob]');
    }, 'local');

    // Cross-apply encoded state updates
    const aliceUpdate = sessionAlice.getEncodedState();
    const bobUpdate = sessionBob.getEncodedState();

    sessionBob.applyEncodedUpdate(aliceUpdate);
    sessionAlice.applyEncodedUpdate(bobUpdate);

    // Both documents must converge to identical content (FR-EDIT-01, AT-02)
    const finalTextAlice = sessionAlice.ytext.toString();
    const finalTextBob = sessionBob.ytext.toString();

    expect(finalTextAlice).toBe(finalTextBob);
    expect(finalTextAlice).toContain('[edited by alice]');
    expect(finalTextAlice).toContain('[edited by bob]');

    sessionAlice.destroy();
    sessionBob.destroy();
  });

  it('converges deterministically when two participants insert at the exact same offset concurrently', () => {
    const initialText = 'const total = 0;';

    const sessionAlice = createCollaborativeSession(initialText, alice);
    const sessionBob = createCollaborativeSession(initialText, bob);

    // Both insert at position 0 concurrently
    sessionAlice.doc.transact(() => {
      sessionAlice.ytext.insert(0, '/* Alice Note */ ');
    }, 'local');

    sessionBob.doc.transact(() => {
      sessionBob.ytext.insert(0, '/* Bob Note */ ');
    }, 'local');

    // Cross-synchronize
    sessionBob.applyEncodedUpdate(sessionAlice.getEncodedState());
    sessionAlice.applyEncodedUpdate(sessionBob.getEncodedState());

    // Both converge deterministically
    expect(sessionAlice.ytext.toString()).toBe(sessionBob.ytext.toString());
    expect(sessionAlice.ytext.toString()).toContain('/* Alice Note */');
    expect(sessionAlice.ytext.toString()).toContain('/* Bob Note */');
    expect(sessionAlice.ytext.toString()).toContain('const total = 0;');

    sessionAlice.destroy();
    sessionBob.destroy();
  });

  it('tracks remote cursor positioning and coordinates', () => {
    const session = createCollaborativeSession('function hello() {}\n', alice);

    const receivedCursors: any[] = [];
    const unbind = session.onCursorChange((cursors) => {
      receivedCursors.push(cursors);
    });

    const bobCursor = session.updateLocalCursor(2, 5);
    session.setRemoteCursor({
      ...bobCursor,
      participantId: bob.id,
      displayName: bob.displayName,
      color: bob.color,
    });

    expect(session.remoteCursors.size).toBe(1);
    expect(session.remoteCursors.get(bob.id)).toEqual({
      participantId: bob.id,
      displayName: bob.displayName,
      color: bob.color,
      line: 2,
      column: 5,
    });

    session.removeRemoteCursor(bob.id);
    expect(session.remoteCursors.size).toBe(0);

    unbind();
    session.destroy();
  });
});
