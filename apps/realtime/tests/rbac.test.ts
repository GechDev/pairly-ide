import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { buildServer } from '../src/server.js';
import { generateMockRoomToken } from '../src/auth.js';
import { authorizeAction } from '../src/rbac/guard.js';
import type { FastifyInstance } from 'fastify';

describe('RBAC Authorization Guard Unit Tests', () => {
  it('blocks DOCUMENT_UPDATE and EXECUTE_CODE for VIEWER and COMMENTER roles', () => {
    const viewerCheck = authorizeAction('DOCUMENT_UPDATE', { role: 'VIEWER' });
    expect(viewerCheck.allowed).toBe(false);
    expect(viewerCheck.code).toBe('UNAUTHORIZED_ACTION');

    const commenterCheck = authorizeAction('DOCUMENT_UPDATE', { role: 'COMMENTER' });
    expect(commenterCheck.allowed).toBe(false);
    expect(commenterCheck.code).toBe('UNAUTHORIZED_ACTION');

    const execCheck = authorizeAction('EXECUTE_CODE', { role: 'VIEWER' });
    expect(execCheck.allowed).toBe(false);
    expect(execCheck.code).toBe('UNAUTHORIZED_ACTION');
  });

  it('permits DOCUMENT_UPDATE and EXECUTE_CODE for EDITOR and HOST', () => {
    const editorWrite = authorizeAction('DOCUMENT_UPDATE', { role: 'EDITOR' });
    expect(editorWrite.allowed).toBe(true);

    const hostWrite = authorizeAction('DOCUMENT_UPDATE', { role: 'HOST' });
    expect(hostWrite.allowed).toBe(true);

    const editorExec = authorizeAction('EXECUTE_CODE', { role: 'EDITOR' });
    expect(editorExec.allowed).toBe(true);
  });

  it('restricts administrative mutations to HOST only', () => {
    const editorRoleChange = authorizeAction('CHANGE_ROLE', { role: 'EDITOR' });
    expect(editorRoleChange.allowed).toBe(false);
    expect(editorRoleChange.code).toBe('UNAUTHORIZED_ACTION');

    const hostRoleChange = authorizeAction('CHANGE_ROLE', { role: 'HOST' });
    expect(hostRoleChange.allowed).toBe(true);
  });

  it('blocks mutations when room is locked for non-host participants', () => {
    const editorLocked = authorizeAction('DOCUMENT_UPDATE', {
      role: 'EDITOR',
      isRoomLocked: true,
    });
    expect(editorLocked.allowed).toBe(false);
    expect(editorLocked.code).toBe('ROOM_LOCKED');

    // Host can still write when room is locked
    const hostLocked = authorizeAction('DOCUMENT_UPDATE', {
      role: 'HOST',
      isRoomLocked: true,
    });
    expect(hostLocked.allowed).toBe(true);
  });
});

describe('AT-03: Realtime RBAC Enforcement Integration Test', () => {
  let app: FastifyInstance;
  let port: number;

  beforeAll(async () => {
    app = buildServer();
    const address = await app.listen({ port: 0, host: '127.0.0.1' });
    port = Number(new URL(address).port);
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks viewer document updates with UNAUTHORIZED_ACTION and permits edits after dynamic role promotion', async () => {
    const roomCode = 'room-at03';

    // 1. Connect Host
    const hostToken = generateMockRoomToken({
      participantId: 'host-user',
      displayName: 'Alice Host',
      avatar: 'host.png',
      color: '#3b82f6',
      role: 'HOST',
      roomCode,
    });

    const hostWs = new WebSocket(
      `ws://127.0.0.1:${port}/ws/rooms/${roomCode}?token=${encodeURIComponent(hostToken)}`
    );

    await new Promise((resolve) => {
      hostWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_JOINED') resolve(true);
      });
    });

    // 2. Connect Viewer
    const viewerToken = generateMockRoomToken({
      participantId: 'viewer-user',
      displayName: 'Bob Viewer',
      avatar: 'viewer.png',
      color: '#ec4899',
      role: 'VIEWER',
      roomCode,
    });

    const viewerWs = new WebSocket(
      `ws://127.0.0.1:${port}/ws/rooms/${roomCode}?token=${encodeURIComponent(viewerToken)}`
    );

    await new Promise((resolve) => {
      viewerWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_JOINED') resolve(true);
      });
    });

    // 3. Viewer attempts to emit DOCUMENT_UPDATE
    let hostReceivedLeak = false;
    hostWs.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'DOCUMENT_UPDATE') {
        hostReceivedLeak = true;
      }
    });

    const viewerErrorPromise = new Promise<any>((resolve) => {
      viewerWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ERROR') resolve(msg);
      });
    });

    viewerWs.send(
      JSON.stringify({
        type: 'DOCUMENT_UPDATE',
        payload: { file: 'main.ts', change: 'malicious overwrite' },
      })
    );

    const errorEvent = await viewerErrorPromise;
    expect(errorEvent.type).toBe('ERROR');
    expect(errorEvent.code).toBe('UNAUTHORIZED_ACTION');
    expect(errorEvent.originalAction).toBe('DOCUMENT_UPDATE');

    // Assert Host NEVER received the unauthorized update
    expect(hostReceivedLeak).toBe(false);

    // 4. Host dynamically promotes Viewer to EDITOR (FR-ROOM-06)
    const rolePromotionPromise = new Promise<any>((resolve) => {
      viewerWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROLE_CHANGED') resolve(msg);
      });
    });

    hostWs.send(
      JSON.stringify({
        type: 'CHANGE_ROLE',
        targetParticipantId: 'viewer-user',
        newRole: 'EDITOR',
      })
    );

    const roleEvent = await rolePromotionPromise;
    expect(roleEvent.type).toBe('ROLE_CHANGED');
    expect(roleEvent.participantId).toBe('viewer-user');
    expect(roleEvent.newRole).toBe('EDITOR');

    // 5. Now as an EDITOR, document updates succeed and broadcast to Host
    const hostReceivedValidUpdatePromise = new Promise<any>((resolve) => {
      hostWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'DOCUMENT_UPDATE') resolve(msg);
      });
    });

    viewerWs.send(
      JSON.stringify({
        type: 'DOCUMENT_UPDATE',
        payload: { file: 'main.ts', change: 'valid collaborative edit' },
      })
    );

    const receivedUpdate = await hostReceivedValidUpdatePromise;
    expect(receivedUpdate.payload.change).toBe('valid collaborative edit');

    // 6. Host locks room (FR-ROOM-04)
    hostWs.send(
      JSON.stringify({
        type: 'TOGGLE_ROOM_LOCK',
        isLocked: true,
      })
    );

    // Wait for lock confirmation
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Now edits from the promoted editor are blocked due to room lock
    const lockedErrorPromise = new Promise<any>((resolve) => {
      viewerWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ERROR') resolve(msg);
      });
    });

    viewerWs.send(
      JSON.stringify({
        type: 'DOCUMENT_UPDATE',
        payload: { file: 'main.ts', change: 'edit while locked' },
      })
    );

    const lockedEvent = await lockedErrorPromise;
    expect(lockedEvent.type).toBe('ERROR');
    expect(lockedEvent.code).toBe('ROOM_LOCKED');

    hostWs.close();
    viewerWs.close();
  });
});
