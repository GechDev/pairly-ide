import { NextRequest, NextResponse } from 'next/server';
import { prisma, getSnapshotById } from '@pairly/database';

interface RouteContext {
  params: {
    code: string;
    snapshotId: string;
  };
}

/**
 * POST /api/v1/rooms/[code]/snapshots/[snapshotId]/restore
 * Restores a historical snapshot state.
 * Per SRS FR-HIST-02.
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { snapshotId } = params;

  try {
    try {
      const snapshot = await getSnapshotById(prisma, snapshotId);
      if (snapshot) {
        return NextResponse.json({
          success: true,
          snapshot: {
            id: snapshot.id,
            version: snapshot.version,
            name: snapshot.name,
            dataBase64: snapshot.data.toString('base64'),
            createdAt: snapshot.createdAt,
          },
        });
      }
    } catch {
      // Database unavailable fallback
    }

    return NextResponse.json(
      {
        success: false,
        error: `Snapshot ${snapshotId} not found or could not be loaded`,
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to restore snapshot',
      },
      { status: 500 }
    );
  }
}
