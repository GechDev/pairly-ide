import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { RoomManager } from './rooms.js';
import { authenticateRoomToken } from './auth.js';
import { authorizeAction } from './rbac/guard.js';

export interface ServerOptions {
  roomManager?: RoomManager;
  logger?: boolean;
}

export function buildServer(options: ServerOptions = {}): FastifyInstance {
  const server = fastify({
    logger: options.logger ?? false,
  });

  const roomManager = options.roomManager ?? new RoomManager();

  // Register plugins
  server.register(cors, {
    origin: '*',
  });

  server.register(websocket, {
    options: {
      maxPayload: 1024 * 1024, // 1MB
    },
  });

  // Health check endpoint (FR-RT-01, FR-RT-04)
  server.get('/health', async () => {
    return {
      status: 'ok',
      service: '@pairly/realtime',
      timestamp: Date.now(),
      uptime: process.uptime(),
      ...roomManager.getStats(),
    };
  });

  // WebSocket coordination route
  server.register(async (instance) => {
    instance.get(
      '/ws/rooms/:roomCode',
      { websocket: true },
      (socket, req) => {
        const { roomCode } = req.params as { roomCode: string };
        const query = req.query as { token?: string };

        // 1. Authenticate connection token
        let authContext;
        try {
          authContext = authenticateRoomToken(query.token, roomCode);
        } catch (err: any) {
          socket.send(
            JSON.stringify({
              type: 'ERROR',
              code: 'AUTHENTICATION_FAILED',
              message: err.message,
            })
          );
          socket.close(4001, 'Unauthorized');
          return;
        }

        const { participant } = authContext;

        // 2. Register participant in active room
        roomManager.joinRoom(roomCode, participant, socket);

        // 3. Confirm room connection with initial state snapshot
        socket.send(
          JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode,
            participant,
            participants: roomManager.getParticipants(roomCode),
          })
        );

        // 4. Broadcast participant presence to peers
        roomManager.broadcast(
          roomCode,
          {
            type: 'USER_JOINED',
            participant,
          },
          participant.id
        );

        // 5. Handle inbound messages and ping/pong latency harness with RBAC
        socket.on('message', (rawData) => {
          try {
            const data = JSON.parse(rawData.toString());

            if (data.type === 'PING') {
              socket.send(
                JSON.stringify({
                  type: 'PONG',
                  clientTimestamp: data.timestamp,
                  serverTimestamp: Date.now(),
                })
              );
              return;
            }

            if (data.type === 'PONG') {
              roomManager.recordPong(roomCode, participant.id);
              return;
            }

            // Always fetch the latest participant state (in case role changed dynamically)
            const currentParticipant =
              roomManager.getParticipant(roomCode, participant.id) || participant;
            const isRoomLocked = roomManager.isRoomLocked(roomCode);

            // Handle Administrative Role Change (FR-ROOM-06)
            if (data.type === 'CHANGE_ROLE') {
              const auth = authorizeAction('CHANGE_ROLE', {
                role: currentParticipant.role,
              });
              if (!auth.allowed) {
                socket.send(
                  JSON.stringify({
                    type: 'ERROR',
                    code: auth.code || 'UNAUTHORIZED_ACTION',
                    message: auth.message,
                  })
                );
                return;
              }

              const { targetParticipantId, newRole } = data;
              const success = roomManager.updateParticipantRole(
                roomCode,
                targetParticipantId,
                newRole
              );
              if (success) {
                roomManager.broadcast(roomCode, {
                  type: 'ROLE_CHANGED',
                  participantId: targetParticipantId,
                  newRole,
                });
              }
              return;
            }

            // Handle Room Lock Toggle (FR-ROOM-04)
            if (data.type === 'TOGGLE_ROOM_LOCK') {
              const auth = authorizeAction('TOGGLE_ROOM_LOCK', {
                role: currentParticipant.role,
              });
              if (!auth.allowed) {
                socket.send(
                  JSON.stringify({
                    type: 'ERROR',
                    code: auth.code || 'UNAUTHORIZED_ACTION',
                    message: auth.message,
                  })
                );
                return;
              }

              const locked = Boolean(data.isLocked);
              roomManager.setRoomLock(roomCode, locked);
              roomManager.broadcast(roomCode, {
                type: 'ROOM_LOCK_UPDATED',
                isLocked: locked,
              });
              return;
            }

            // Enforce RBAC on Document Updates (FR-ROOM-05..07, AT-03)
            if (data.type === 'DOCUMENT_UPDATE' || data.type === 'YJS_UPDATE') {
              const auth = authorizeAction('DOCUMENT_UPDATE', {
                role: currentParticipant.role,
                isRoomLocked,
              });
              if (!auth.allowed) {
                socket.send(
                  JSON.stringify({
                    type: 'ERROR',
                    code: auth.code || 'UNAUTHORIZED_ACTION',
                    message: auth.message,
                    originalAction: data.type,
                  })
                );
                return; // Discard unauthorized edit
              }
            }

            // Enforce RBAC on Code Execution (FR-EXEC-01)
            if (data.type === 'EXECUTE_CODE') {
              const auth = authorizeAction('EXECUTE_CODE', {
                role: currentParticipant.role,
                isRoomLocked,
              });
              if (!auth.allowed) {
                socket.send(
                  JSON.stringify({
                    type: 'ERROR',
                    code: auth.code || 'UNAUTHORIZED_ACTION',
                    message: auth.message,
                    originalAction: data.type,
                  })
                );
                return; // Discard unauthorized execution
              }
            }

            // Broadcast permitted collaborative messages
            roomManager.broadcast(roomCode, data, participant.id);
          } catch {
            // Non-JSON or raw binary framing
          }
        });

        // 6. Handle participant disconnect
        socket.on('close', () => {
          roomManager.leaveRoom(roomCode, participant.id);
          roomManager.broadcast(roomCode, {
            type: 'USER_LEFT',
            participantId: participant.id,
          });
        });
      }
    );
  });

  return server;
}
