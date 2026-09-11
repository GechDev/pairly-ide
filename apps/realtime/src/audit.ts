/**
 * Security Audit Logging Engine (FR-ADMIN-06, SEC-10)
 *
 * Implements an administrative audit trail capturing security-critical
 * actions: role changes, participant bans, room lock state, code execution,
 * and abuse reports.
 */

export type AuditEventType =
  | 'ROLE_CHANGE'
  | 'PARTICIPANT_BAN'
  | 'ROOM_LOCK'
  | 'CODE_EXECUTION'
  | 'ABUSE_REPORT'
  | 'SESSION_JOIN'
  | 'SESSION_LEAVE';

export interface AuditEvent {
  id: string;
  roomId: string;
  eventType: AuditEventType;
  actorId: string;
  targetId?: string;
  timestamp: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export class AuditLogger {
  private events: AuditEvent[] = [];
  private maxBufferSize: number;

  constructor(maxBufferSize: number = 10_000) {
    this.maxBufferSize = maxBufferSize;
  }

  /**
   * Record a security audit event into the immutable memory buffer.
   */
  public logEvent(eventInput: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const event: AuditEvent = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      ...eventInput,
    };

    this.events.push(event);

    // Evict oldest if buffer cap exceeded
    if (this.events.length > this.maxBufferSize) {
      this.events.shift();
    }

    return event;
  }

  /**
   * Query recorded audit events filtered by room or event type.
   */
  public getEvents(roomId?: string, eventType?: AuditEventType): AuditEvent[] {
    return this.events.filter((e) => {
      if (roomId && e.roomId !== roomId) return false;
      if (eventType && e.eventType !== eventType) return false;
      return true;
    });
  }

  /**
   * Clear recorded events (for testing or memory management).
   */
  public clear(roomId?: string): void {
    if (roomId) {
      this.events = this.events.filter((e) => e.roomId !== roomId);
    } else {
      this.events = [];
    }
  }
}

export const defaultAuditLogger = new AuditLogger();
