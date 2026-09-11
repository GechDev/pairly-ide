import { NextRequest, NextResponse } from 'next/server';

export interface AbuseReportRecord {
  id: string;
  roomId: string;
  reporterId: string;
  reportedParticipantId?: string;
  category: 'HARASSMENT' | 'MALICIOUS_CODE' | 'SPAM' | 'SECURITY_VIOLATION' | 'OTHER';
  description: string;
  contextSnapshot?: Record<string, any>;
  createdAt: number;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

// In-memory reports store
const reportsStore: AbuseReportRecord[] = [];

/**
 * POST /api/v1/reports
 * Submits an in-room abuse report for administrative review (FR-ADMIN-01, SEC-10).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      roomId,
      reporterId,
      reportedParticipantId,
      category,
      description,
      contextSnapshot,
    } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }
    if (!reporterId) {
      return NextResponse.json({ error: 'Reporter ID is required' }, { status: 400 });
    }
    if (!description || description.trim().length < 5) {
      return NextResponse.json(
        { error: 'Description must be at least 5 characters long' },
        { status: 400 },
      );
    }

    const reportRecord: AbuseReportRecord = {
      id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      roomId,
      reporterId,
      reportedParticipantId,
      category: category || 'HARASSMENT',
      description: description.trim(),
      contextSnapshot,
      createdAt: Date.now(),
      status: 'PENDING',
    };

    reportsStore.push(reportRecord);

    return NextResponse.json(
      {
        success: true,
        reportId: reportRecord.id,
        message: 'Abuse report received and queued for administrative review (FR-ADMIN-01)',
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit report';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/v1/reports
 * Retrieves submitted abuse reports (for moderation & administrative inspection).
 */
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get('roomId');
  const filtered = roomId ? reportsStore.filter((r) => r.roomId === roomId) : reportsStore;

  return NextResponse.json({ reports: filtered, count: filtered.length }, { status: 200 });
}
