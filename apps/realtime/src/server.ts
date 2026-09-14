import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { RoomManager } from './rooms.js';
import { authenticateRoomToken } from './auth.js';
import { authorizeAction } from './rbac/guard.js';
import { defaultTerminalManager } from './pty/runner.js';
import { defaultChatManager } from './chat.js';
import { defaultNotepadManager } from './notepad.js';
import { createPersistenceManager } from './persistence.js';

const defaultPersistenceManager = createPersistenceManager();

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

        // 3a. Send current code document snapshot for late joiners (FR-EDIT-01)
        const latestDocState = defaultPersistenceManager.getLatestState(roomCode);
        if (latestDocState) {
          socket.send(
            JSON.stringify({
              type: 'DOC_UPDATE',
              update: latestDocState,
            })
          );
        }

        // 3b. Send recent terminal history for late joiners (FR-EXEC-08)
        const history = defaultTerminalManager.getRoomHistory(roomCode);
        if (history.length > 0) {
          socket.send(
            JSON.stringify({
              type: 'TERMINAL_HISTORY',
              chunks: history,
            })
          );
        }

        // 3c. Send chat history for late joiners (FR-COMM-02)
        const chatHistory = defaultChatManager.getHistory(roomCode);
        if (chatHistory.length > 0) {
          socket.send(
            JSON.stringify({
              type: 'CHAT_HISTORY',
              messages: chatHistory,
            })
          );
        }

        // 3d. Send notepad state for late joiners (FR-BOARD-02)
        const notepad = defaultNotepadManager.getNotepad(roomCode);
        socket.send(
          JSON.stringify({
            type: 'NOTEPAD_SNAPSHOT',
            content: notepad.content,
            updatedAt: notepad.updatedAt,
          })
        );

        // 3e. Send whiteboard state snapshot for late joiners
        const whiteboardElements = roomManager.getWhiteboardElements(roomCode);
        if (whiteboardElements.length > 0) {
          socket.send(
            JSON.stringify({
              type: 'WHITEBOARD_SNAPSHOT',
              elements: whiteboardElements,
            })
          );
        }

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

            // Handle Host Spotlight Toggle (FR-EDIT-08)
            if (data.type === 'SPOTLIGHT_TOGGLE') {
              const auth = authorizeAction('SPOTLIGHT_PARTICIPANT', {
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

              roomManager.broadcast(roomCode, {
                type: 'SPOTLIGHT_CHANGED',
                targetParticipantId: data.targetParticipantId ?? null,
                spotlightedBy: currentParticipant.id,
              });
              return;
            }

            // Handle Participant Kick / Removal (FR-ROOM-07)
            if (data.type === 'USER_KICK') {
              const auth = authorizeAction('KICK_PARTICIPANT', {
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

              const { targetParticipantId, reason } = data;
              const targetSession = roomManager.getParticipantSession(roomCode, targetParticipantId);
              if (targetSession) {
                targetSession.socket.send(
                  JSON.stringify({
                    type: 'KICKED_FROM_ROOM',
                    reason: reason || 'Removed by room host',
                  })
                );
                targetSession.socket.close(4003, 'Kicked by host');
              }
              roomManager.leaveRoom(roomCode, targetParticipantId);
              roomManager.broadcast(roomCode, {
                type: 'USER_KICKED',
                targetParticipantId,
                reason: reason || 'Removed by room host',
                kickedBy: currentParticipant.id,
              });
              return;
            }

            // Handle Participant Audio Mute (Host Moderation)
            if (data.type === 'USER_MUTE') {
              const auth = authorizeAction('MUTE_PARTICIPANT', {
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

              roomManager.broadcast(roomCode, {
                type: 'USER_MUTED',
                targetParticipantId: data.targetParticipantId,
                isMuted: Boolean(data.isMuted),
                mutedBy: currentParticipant.id,
              });
              return;
            }

            // Enforce RBAC on Document Updates (FR-ROOM-05..07, AT-03)
            if (
              data.type === 'DOCUMENT_UPDATE' ||
              data.type === 'YJS_UPDATE' ||
              data.type === 'DOC_UPDATE'
            ) {
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

              const updateData = data.update || data.data;
              if (updateData) {
                defaultPersistenceManager.bufferUpdate(roomCode, updateData);
              }

              // Relay document update to peers
              roomManager.broadcast(roomCode, data, participant.id);
              return;
            }

            // Realtime Collaborative Cursor Sync (FR-EDIT-05)
            if (data.type === 'CURSOR_UPDATE') {
              roomManager.broadcast(
                roomCode,
                {
                  type: 'CURSOR_UPDATE',
                  cursor: data.cursor,
                },
                participant.id
              );
              return;
            }

            // Relay WebRTC Peer Signaling (FR-COMM-03..06)
            if (data.type === 'WEBRTC_SIGNAL') {
              const { targetParticipantId, signal } = data;
              if (targetParticipantId) {
                const targetSession = roomManager.getParticipantSession(roomCode, targetParticipantId);
                if (targetSession && targetSession.socket.readyState === targetSession.socket.OPEN) {
                  targetSession.socket.send(
                    JSON.stringify({
                      type: 'WEBRTC_SIGNAL',
                      fromParticipantId: participant.id,
                      signal,
                    })
                  );
                }
              }
              return;
            }

            // Real-Time Media State Updates (Camera, Mic, Screen)
            if (data.type === 'MEDIA_STATE_UPDATE') {
              roomManager.broadcast(
                roomCode,
                {
                  type: 'MEDIA_STATE_UPDATE',
                  participantId: participant.id,
                  mediaState: data.mediaState,
                },
                participant.id
              );
              return;
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

            // Realtime Terminal Execution: Spawn Runner (FR-EXEC-01..02)
            if (data.type === 'RUN_START') {
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
                return;
              }

              defaultTerminalManager.startRun(roomCode, data.params, {
                onChunk: (chunk) => {
                  roomManager.broadcast(roomCode, {
                    type: 'TERMINAL_CHUNK',
                    chunk,
                  });
                },
                onStatusChange: (status, result) => {
                  roomManager.broadcast(roomCode, {
                    type: 'TERMINAL_STATUS',
                    status,
                    result,
                  });
                },
              });
              return;
            }

            // Realtime Terminal: Interactive Stdin (FR-EXEC-03)
            if (data.type === 'RUN_STDIN') {
              const auth = authorizeAction('EXECUTE_CODE', {
                role: currentParticipant.role,
                isRoomLocked,
              });
              if (!auth.allowed) return;

              defaultTerminalManager.sendStdin(data.runId, data.data);
              return;
            }

            // Realtime Terminal: Clear Output History
            if (data.type === 'TERMINAL_CLEAR') {
              defaultTerminalManager.clearRoomHistory(roomCode);
              roomManager.broadcast(roomCode, { type: 'TERMINAL_CLEARED' });
              return;
            }

            // Realtime In-Room Chat (FR-COMM-01..02)
            if (data.type === 'CHAT_SEND') {
              const text = String(data.content || '').trim();
              if (!text || text.length > 4000) return;

              const message = defaultChatManager.addMessage({
                roomId: roomCode,
                senderId: currentParticipant.id,
                senderName: currentParticipant.displayName,
                senderAvatar: currentParticipant.avatar,
                senderColor: currentParticipant.color,
                senderRole: currentParticipant.role,
                content: text,
              });

              roomManager.broadcast(roomCode, {
                type: 'CHAT_MESSAGE',
                message,
              });
              return;
            }

            // Realtime Shared Collaborative Notepad (FR-BOARD-02)
            if (data.type === 'NOTEPAD_UPDATE') {
              const content = typeof data.content === 'string' ? data.content : '';
              const state = defaultNotepadManager.updateNotepad(roomCode, content, currentParticipant.id);
              roomManager.broadcast(
                roomCode,
                {
                  type: 'NOTEPAD_UPDATE',
                  content: state.content,
                  updatedAt: state.updatedAt,
                  senderId: currentParticipant.id,
                },
                participant.id
              );
              return;
            }

            // Collaborative Remote Pointer Relay (CodeX Inspired)
            if (data.type === 'POINTER_UPDATE') {
              roomManager.broadcast(
                roomCode,
                {
                  type: 'POINTER_UPDATE',
                  participantId: currentParticipant.id,
                  name: currentParticipant.displayName,
                  color: currentParticipant.color,
                  x: data.x,
                  y: data.y,
                },
                currentParticipant.id
              );
              return;
            }

            // Collaborative Whiteboard: Peer Drawing (code-editor inspired)
            if (data.type === 'WHITEBOARD_DRAW' && data.element) {
              roomManager.addWhiteboardElement(roomCode, data.element);
              roomManager.broadcast(
                roomCode,
                {
                  type: 'WHITEBOARD_DRAW',
                  element: data.element,
                  senderId: currentParticipant.id,
                },
                currentParticipant.id
              );
              return;
            }

            // Collaborative Whiteboard: Clear Canvas
            if (data.type === 'WHITEBOARD_CLEAR') {
              roomManager.clearWhiteboard(roomCode);
              roomManager.broadcast(
                roomCode,
                {
                  type: 'WHITEBOARD_CLEAR',
                  senderId: currentParticipant.id,
                },
                currentParticipant.id
              );
              return;
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
