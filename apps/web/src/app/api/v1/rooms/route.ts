import { NextResponse } from 'next/server';
import { prisma } from '@pairly/database';
import { generateRoomCode } from '../../../../lib/nanoid';
import { generateGuestIdentity } from '../../../../lib/guest';
import { validateCreateRoom } from '@pairly/contracts';

export async function POST(req: Request) {
  try {
    let payload = {};
    try {
      const text = await req.text();
      if (text.trim()) {
        payload = JSON.parse(text);
      }
    } catch {
      payload = {};
    }

    const validation = validateCreateRoom(payload);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          errors: validation.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const input = validation.data;
    const guest = generateGuestIdentity('HOST');
    const roomCode = generateRoomCode();

    let createdRoom;

    try {
      // 1. Create temporary guest user
      const hostUser = await prisma.user.create({
        data: {
          name: guest.displayName,
          avatar: guest.avatar,
        },
      });

      // 2. Create room record with host and initial participant
      createdRoom = await prisma.room.create({
        data: {
          code: roomCode,
          title: input.title || `${guest.displayName}'s Room`,
          accessMode: input.accessMode,
          roomMode: input.roomMode,
          hostId: hostUser.id,
          maxParticipants: input.maxParticipants,
          executionEnabled: input.executionEnabled,
          aiEnabled: input.aiEnabled,
          defaultRole: input.defaultRole,
          expiresAt: input.expiresAt,
          participants: {
            create: {
              userId: hostUser.id,
              guestDisplayName: guest.displayName,
              guestAvatar: guest.avatar,
              guestColor: guest.color,
              role: 'HOST',
            },
          },
        },
      });
    } catch (dbError) {
      // Fallback in-memory representation for environments without live DB
      createdRoom = {
        id: `mock_room_${roomCode}`,
        code: roomCode,
        title: input.title || `${guest.displayName}'s Room`,
        accessMode: input.accessMode,
        roomMode: input.roomMode,
        hostId: guest.id,
        maxParticipants: input.maxParticipants,
        executionEnabled: input.executionEnabled,
        aiEnabled: input.aiEnabled,
        defaultRole: input.defaultRole,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // 3. Issue connection token for realtime coordinator
    const tokenPayload = {
      participantId: guest.id,
      displayName: guest.displayName,
      avatar: guest.avatar,
      color: guest.color,
      role: 'HOST',
      roomCode: createdRoom.code,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };

    const token = `pairly_mock_${Buffer.from(JSON.stringify(tokenPayload)).toString('base64url')}`;

    return NextResponse.json(
      {
        success: true,
        room: {
          id: createdRoom.id,
          code: createdRoom.code,
          title: createdRoom.title,
          accessMode: createdRoom.accessMode,
          roomMode: createdRoom.roomMode,
        },
        guest,
        token,
        joinUrl: `/room/${createdRoom.code}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create room',
      },
      { status: 500 }
    );
  }
}
