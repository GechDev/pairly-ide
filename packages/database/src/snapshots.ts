import type { PrismaClient } from '@prisma/client';

export interface CreateSnapshotInput {
  roomId: string;
  name?: string;
  data: Buffer;
  sizeBytes?: number;
  createdById?: string | null;
}

/**
 * Creates a named workspace snapshot checkpoint in the database.
 * Per SRS FR-HIST-01 and FR-HIST-02.
 */
export async function createWorkspaceSnapshot(
  prisma: PrismaClient,
  input: CreateSnapshotInput
) {
  // Determine next version number for this room
  const latest = await prisma.workspaceSnapshot.findFirst({
    where: { roomId: input.roomId },
    orderBy: { version: 'desc' },
    select: { version: true },
  });

  const nextVersion = (latest?.version ?? 0) + 1;
  const sizeBytes = input.sizeBytes ?? input.data.length;

  return await prisma.workspaceSnapshot.create({
    data: {
      roomId: input.roomId,
      version: nextVersion,
      name: input.name || `Snapshot v${nextVersion}`,
      data: input.data,
      sizeBytes,
      createdById: input.createdById ?? null,
    },
  });
}

/**
 * Retrieves snapshot metadata history for a room.
 */
export async function getRoomSnapshots(prisma: PrismaClient, roomId: string) {
  return await prisma.workspaceSnapshot.findMany({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      roomId: true,
      version: true,
      name: true,
      sizeBytes: true,
      createdAt: true,
      createdById: true,
    },
  });
}

/**
 * Retrieves a specific snapshot by ID including binary data payload.
 */
export async function getSnapshotById(prisma: PrismaClient, snapshotId: string) {
  return await prisma.workspaceSnapshot.findUnique({
    where: { id: snapshotId },
  });
}

/**
 * Deletes a specific snapshot by ID.
 */
export async function deleteSnapshotById(prisma: PrismaClient, snapshotId: string) {
  return await prisma.workspaceSnapshot.delete({
    where: { id: snapshotId },
  });
}
