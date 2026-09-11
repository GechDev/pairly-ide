import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../src/app/api/v1/reports/route';
import { defaultAuditLogger, AuditLogger } from '../../realtime/src/audit';

describe('T-23: Abuse Reporting & Security Audit Logging (FR-ADMIN-01, 06, SEC-10)', () => {
  beforeEach(() => {
    defaultAuditLogger.clear();
  });

  it('records administrative audit events for role changes, bans, and executions (SEC-10)', () => {
    const logger = new AuditLogger();

    // 1. Role Change Audit Event
    const roleEvent = logger.logEvent({
      roomId: 'room-sec-1',
      eventType: 'ROLE_CHANGE',
      actorId: 'usr-host',
      targetId: 'usr-guest',
      metadata: { previousRole: 'VIEWER', newRole: 'EDITOR' },
    });

    expect(roleEvent.id).toBeDefined();
    expect(roleEvent.eventType).toBe('ROLE_CHANGE');
    expect(roleEvent.timestamp).toBeGreaterThan(0);

    // 2. Participant Ban Audit Event
    const banEvent = logger.logEvent({
      roomId: 'room-sec-1',
      eventType: 'PARTICIPANT_BAN',
      actorId: 'usr-host',
      targetId: 'usr-malicious',
      metadata: { reason: 'Injected malicious fork bomb script' },
    });
    expect(banEvent.eventType).toBe('PARTICIPANT_BAN');

    // 3. Code Execution Audit Event
    const execEvent = logger.logEvent({
      roomId: 'room-sec-1',
      eventType: 'CODE_EXECUTION',
      actorId: 'usr-guest',
      metadata: { language: 'python', executionDurationMs: 420 },
    });
    expect(execEvent.eventType).toBe('CODE_EXECUTION');

    // Query events by room
    const roomEvents = logger.getEvents('room-sec-1');
    expect(roomEvents.length).toBe(3);

    // Filter by event type
    const bansOnly = logger.getEvents('room-sec-1', 'PARTICIPANT_BAN');
    expect(bansOnly.length).toBe(1);
    expect(bansOnly[0]?.targetId).toBe('usr-malicious');
  });

  it('enforces buffer size limit for audit event history', () => {
    const logger = new AuditLogger(5);
    for (let i = 0; i < 10; i++) {
      logger.logEvent({
        roomId: 'room-buffer',
        eventType: 'SESSION_JOIN',
        actorId: `user-${i}`,
      });
    }

    const events = logger.getEvents('room-buffer');
    expect(events.length).toBe(5);
    expect(events[4]?.actorId).toBe('user-9');
  });

  it('POST /api/v1/reports receives abuse report and queues for administrative review (FR-ADMIN-01)', async () => {
    const reportPayload = {
      roomId: 'room-sec-1',
      reporterId: 'usr-alice',
      reportedParticipantId: 'usr-spammer',
      category: 'HARASSMENT',
      description: 'Participant repeatedly spammed chat with abusive messages.',
      contextSnapshot: {
        activeFileName: 'src/main.ts',
        timestamp: Date.now(),
      },
    };

    const req = new NextRequest('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reportId).toBeDefined();
    expect(data.message).toContain('administrative review');
  });

  it('rejects POST /api/v1/reports when required parameters are missing or description is too short', async () => {
    const invalidReq = new NextRequest('http://localhost:3000/api/v1/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'room-sec-1',
        reporterId: 'usr-alice',
        description: 'bad', // less than 5 characters
      }),
    });

    const res = await invalidReqPayloadCheck(invalidReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Description must be at least 5 characters');
  });

  it('GET /api/v1/reports allows administrative inspection of submitted reports', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/reports?roomId=room-sec-1', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.reports)).toBe(true);
    expect(data.count).toBeGreaterThan(0);
    expect(data.reports[0].roomId).toBe('room-sec-1');
  });
});

async function invalidReqPayloadCheck(req: NextRequest) {
  return POST(req);
}
