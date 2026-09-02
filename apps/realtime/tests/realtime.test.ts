import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import WebSocket from 'ws';
import { buildServer } from '../src/server.js';
import { generateMockRoomToken } from '../src/auth.js';
import type { FastifyInstance } from 'fastify';

describe('Realtime WebSocket Service Integration', () => {
  let app: FastifyInstance;
  let port: number;

  beforeAll(async () => {
    app = buildServer();
    const address = await app.listen({ port: 0, host: '127.0.0.1' });
    const url = new URL(address);
    port = Number(url.port);
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes a valid /health endpoint', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');
    expect(body.service).toBe('@pairly/realtime');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof body.activeRooms).toBe('number');
  });

  it('rejects WebSocket connection without valid token', async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/rooms/room-abc`);

    const receivedError = await new Promise<{ type: string; code: string }>((resolve) => {
      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
      ws.on('error', () => {});
    });

    expect(receivedError.type).toBe('ERROR');
    expect(receivedError.code).toBe('AUTHENTICATION_FAILED');
  });

  it('establishes WebSocket handshake with valid token and receives room state', async () => {
    const token = generateMockRoomToken({
      participantId: 'user-1',
      displayName: 'Alice Host',
      avatar: 'avatar1.png',
      color: '#3b82f6',
      role: 'HOST',
      roomCode: 'room-101',
    });

    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/ws/rooms/room-101?token=${encodeURIComponent(token)}`
    );

    const initialMessage = await new Promise<any>((resolve) => {
      ws.on('message', (data) => {
        resolve(JSON.parse(data.toString()));
      });
    });

    expect(initialMessage.type).toBe('ROOM_JOINED');
    expect(initialMessage.roomCode).toBe('room-101');
    expect(initialMessage.participant.id).toBe('user-1');
    expect(initialMessage.participant.role).toBe('HOST');
    expect(initialMessage.participants).toHaveLength(1);

    ws.close();
  });

  it('synchronizes peer presence and ping/pong latency harness', async () => {
    const tokenA = generateMockRoomToken({
      participantId: 'peer-a',
      displayName: 'Alice',
      avatar: 'avatarA.png',
      color: '#10b981',
      role: 'HOST',
      roomCode: 'room-collab',
    });

    const tokenB = generateMockRoomToken({
      participantId: 'peer-b',
      displayName: 'Bob',
      avatar: 'avatarB.png',
      color: '#f59e0b',
      role: 'EDITOR',
      roomCode: 'room-collab',
    });

    // 1. Connect peer A
    const wsA = new WebSocket(
      `ws://127.0.0.1:${port}/ws/rooms/room-collab?token=${encodeURIComponent(tokenA)}`
    );

    await new Promise((resolve) => {
      wsA.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_JOINED') resolve(true);
      });
    });

    // 2. Connect peer B and ensure peer A receives USER_JOINED
    const peerBJoinedPromise = new Promise<any>((resolve) => {
      wsA.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'USER_JOINED') resolve(msg);
      });
    });

    const wsB = new WebSocket(
      `ws://127.0.0.1:${port}/ws/rooms/room-collab?token=${encodeURIComponent(tokenB)}`
    );

    const userJoinedEvent = await peerBJoinedPromise;
    expect(userJoinedEvent.participant.id).toBe('peer-b');
    expect(userJoinedEvent.participant.role).toBe('EDITOR');

    // 3. Test Ping/Pong Latency Measurement Harness
    const startPing = Date.now();
    wsB.send(JSON.stringify({ type: 'PING', timestamp: startPing }));

    const pongEvent = await new Promise<any>((resolve) => {
      wsB.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PONG') resolve(msg);
      });
    });

    expect(pongEvent.type).toBe('PONG');
    expect(pongEvent.clientTimestamp).toBe(startPing);
    expect(typeof pongEvent.serverTimestamp).toBe('number');
    const roundTrip = Date.now() - pongEvent.clientTimestamp;
    expect(roundTrip).toBeGreaterThanOrEqual(0);

    // 4. Disconnect peer B and verify peer A receives USER_LEFT
    const peerBLeftPromise = new Promise<any>((resolve) => {
      wsA.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'USER_LEFT') resolve(msg);
      });
    });

    wsB.close();
    const userLeftEvent = await peerBLeftPromise;
    expect(userLeftEvent.participantId).toBe('peer-b');

    wsA.close();
  });
});
