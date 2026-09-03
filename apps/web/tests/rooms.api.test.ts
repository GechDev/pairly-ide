import { describe, it, expect } from 'vitest';
import { generateRoomCode } from '../src/lib/nanoid';
import { generateGuestIdentity } from '../src/lib/guest';
import { POST } from '../src/app/api/v1/rooms/route';

describe('Room Creation & Identity Unit Tests', () => {
  it('generates unguessable room code matching regex', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}$/);
    expect(code.length).toBe(9);
  });

  it('generates unique guest identity with curated color and avatar', () => {
    const guest = generateGuestIdentity('HOST');
    expect(guest.id).toMatch(/^guest_/);
    expect(guest.displayName.length).toBeGreaterThan(3);
    expect(guest.avatar).toContain('dicebear');
    expect(guest.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(guest.role).toBe('HOST');
    expect(guest.isGuest).toBe(true);
  });

  it('POST /api/v1/rooms creates a room and returns token and joinUrl', async () => {
    const req = new Request('http://localhost:3000/api/v1/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Interview Sandbox',
        roomMode: 'INTERVIEW',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.room.code).toBeDefined();
    expect(data.guest.role).toBe('HOST');
    expect(data.token).toContain('pairly_mock_');
    expect(data.joinUrl).toBe(`/room/${data.room.code}`);
  });
});
