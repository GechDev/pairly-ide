import { NextRequest, NextResponse } from 'next/server';
import { prisma, createWorkspaceSnapshot, getRoomSnapshots } from '@pairly/database';

interface RouteContext {
  params: {
    code: string;
  };
}

// In-memory fallback for local dev/testing when PostgreSQL is disconnected
const memorySnapshots = new Map<
  string,
  Array<{
    id: string;
    roomId: string;
    version: number;
    name: string;
    sizeBytes: number;
    data: string;
    createdAt: string;
  }>
>();

/**
 * GET /api/v1/rooms/[code]/snapshots
 * Retrieves snapshot history for a room.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { code } = params;

  try {
    const room = await prisma.room.findUnique({
      where: { code },
      select: { id: true },
    });

    if (room) {
      const snapshots = await getRoomSnapshots(prisma, room.id);
      return NextResponse.json({
        success: true,
        snapshots,
      });
    }
  } catch {
    // Database fallback to memory store
  }

  const fallbackList = (memorySnapshots.get(code) || []).map((s) => ({
    id: s.id,
    roomId: s.roomId,
    version: s.version,
    name: s.name,
    sizeBytes: s.sizeBytes,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({
    success: true,
    snapshots: fallbackList,
  });
}

/**
 * POST /api/v1/rooms/[code]/snapshots
 * Saves a new named snapshot checkpoint.
 * Per SRS FR-HIST-01 and FR-HIST-02.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { code } = params;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Checkpoint';
    const dataBase64 = typeof body.data === 'string' ? body.data : '';
    const buffer = Buffer.from(dataBase64, 'base64');

    try {
      const room = await prisma.room.findUnique({
        where: { code },
        select: { id: true },
      });

      if (room) {
        const snapshot = await createWorkspaceSnapshot(prisma, {
          roomId: room.id,
          name,
          data: buffer,
          sizeBytes: buffer.length,
        });

        return NextResponse.json(
          {
            success: true,
            snapshot: {
              id: snapshot.id,
              version: snapshot.version,
              name: snapshot.name,
              sizeBytes: snapshot.sizeBytes,
              createdAt: snapshot.createdAt,
            },
          },
          { status: 201 }
        );
      }
    } catch {
      // Fallback to memory
    }

    // Memory fallback
    const existing = memorySnapshots.get(code) || [];
    const nextVersion = existing.length + 1;
    const fallbackItem = {
      id: `snap-${code}-${nextVersion}-${Date.now()}`,
      roomId: code,
      version: nextVersion,
      name,
      sizeBytes: buffer.length,
      data: dataBase64,
      createdAt: new Date().toISOString(),
    };

    memorySnapshots.set(code, [...existing, fallbackItem]);

    return NextResponse.json(
      {
        success: true,
        snapshot: {
          id: fallbackItem.id,
          version: fallbackItem.version,
          name: fallbackItem.name,
          sizeBytes: fallbackItem.sizeBytes,
          createdAt: fallbackItem.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to create snapshot checkpoint',
      },
      { status: 400 }
    );
  }
}
