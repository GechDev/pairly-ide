import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

interface RouteContext {
  params: { code: string };
}

function base64UrlEncode(data: string | Buffer): string {
  return Buffer.from(data).toString('base64url');
}

function generateLiveKitToken({
  room,
  participantName,
  identity,
  apiKey,
  apiSecret,
}: {
  room: string;
  participantName: string;
  identity: string;
  apiKey: string;
  apiSecret: string;
}): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7200; // 2 hour TTL

  // Standard LiveKit JWT Header
  const header = { alg: 'HS256', typ: 'JWT' };

  // Standard LiveKit JWT Claims
  const payload = {
    iss: apiKey,
    sub: identity,
    name: participantName,
    nbf: now - 5,
    exp,
    video: {
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  // Authentic cryptographic HMAC-SHA256 signature accepted by LiveKit Cloud SFU
  const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('base64url');

  return `${message}.${signature}`;
}

/**
 * POST & GET /api/v1/rooms/[code]/media/token
 * Issues cryptographically verified WebRTC SFU access tokens for in-room media calls (FR-COMM-03..07, T-30).
 * Compatible with LiveKit Cloud and self-hosted LiveKit instances.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const participantName = body.participantName || body.name || 'Guest';
    const identity =
      body.identity ||
      `user_${participantName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`;

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret =
      process.env.LIVEKIT_API_SECRET || 'secretsecretsecretsecretsecretsecretsecret';
    const wsUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    const isConfigured = Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);

    const token = generateLiveKitToken({
      room: code,
      participantName,
      identity,
      apiKey,
      apiSecret,
    });

    return NextResponse.json(
      {
        token,
        wsUrl,
        isConfigured,
        room: code,
        identity,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Media token generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const participantName = searchParams.get('username') || searchParams.get('name') || 'Guest';
    const identity =
      searchParams.get('identity') ||
      `user_${participantName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`;

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret =
      process.env.LIVEKIT_API_SECRET || 'secretsecretsecretsecretsecretsecretsecret';
    const wsUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';
    const isConfigured = Boolean(process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);

    const token = generateLiveKitToken({
      room: code,
      participantName,
      identity,
      apiKey,
      apiSecret,
    });

    return NextResponse.json(
      {
        token,
        wsUrl,
        isConfigured,
        room: code,
        identity,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Media token generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
