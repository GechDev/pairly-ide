import type { WebSocket } from 'ws';
import type { ParticipantIdentity } from '@pairly/contracts';

export interface RoomParticipantSession {
  participant: ParticipantIdentity;
  socket: WebSocket;
  connectedAt: number;
  lastPingAt: number;
  latencyMs: number;
}

export interface ActiveRoom {
  code: string;
  createdAt: number;
  participants: Map<string, RoomParticipantSession>;
}

export class RoomManager {
  private rooms: Map<string, ActiveRoom> = new Map();

  /**
   * Retrieves or initializes an active room in memory.
   */
  public getOrCreateRoom(roomCode: string): ActiveRoom {
    let room = this.rooms.get(roomCode);
    if (!room) {
      room = {
        code: roomCode,
        createdAt: Date.now(),
        participants: new Map(),
      };
      this.rooms.set(roomCode, room);
    }
    return room;
  }

  /**
   * Adds or updates a participant session in the specified room.
   */
  public joinRoom(
    roomCode: string,
    participant: ParticipantIdentity,
    socket: WebSocket
  ): RoomParticipantSession {
    const room = this.getOrCreateRoom(roomCode);
    const session: RoomParticipantSession = {
      participant,
      socket,
      connectedAt: Date.now(),
      lastPingAt: Date.now(),
      latencyMs: 0,
    };

    room.participants.set(participant.id, session);
    return session;
  }

  /**
   * Removes a participant from a room.
   */
  public leaveRoom(roomCode: string, participantId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    const removed = room.participants.delete(participantId);
    if (room.participants.size === 0) {
      this.rooms.delete(roomCode);
    }
    return removed;
  }

  /**
   * Records a pong response and calculates round-trip latency.
   */
  public recordPong(roomCode: string, participantId: string): number {
    const room = this.rooms.get(roomCode);
    if (!room) return 0;

    const session = room.participants.get(participantId);
    if (!session) return 0;

    const latency = Date.now() - session.lastPingAt;
    session.latencyMs = latency;
    return latency;
  }

  /**
   * Sets ping timestamp for latency measurement.
   */
  public recordPing(roomCode: string, participantId: string): void {
    const room = this.rooms.get(roomCode);
    const session = room?.participants.get(participantId);
    if (session) {
      session.lastPingAt = Date.now();
    }
  }

  /**
   * Returns a list of participant identities in a given room.
   */
  public getParticipants(roomCode: string): ParticipantIdentity[] {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.participants.values()).map((s) => s.participant);
  }

  /**
   * Broadcasts a JSON message to all participants in a room (optionally excluding one).
   */
  public broadcast(
    roomCode: string,
    data: any,
    excludeParticipantId?: string
  ): number {
    const room = this.rooms.get(roomCode);
    if (!room) return 0;

    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    let sentCount = 0;

    for (const [id, session] of room.participants.entries()) {
      if (excludeParticipantId && id === excludeParticipantId) continue;
      if (session.socket.readyState === session.socket.OPEN) {
        session.socket.send(payload);
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Returns statistics across all active rooms.
   */
  public getStats() {
    let totalParticipants = 0;
    for (const room of this.rooms.values()) {
      totalParticipants += room.participants.size;
    }
    return {
      activeRooms: this.rooms.size,
      totalParticipants,
    };
  }
}
