import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMe, PUT as updateMe, DELETE as deleteMe } from '../src/app/api/v1/users/me/route';
import { GET as exportMe } from '../src/app/api/v1/users/me/export/route';

describe('T-22: User Accounts, Settings, and Data Privacy Controls (FR-ACCT-01..04, AT-11)', () => {
  it('GET /api/v1/users/me retrieves user profile and preferences', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users/me', {
      method: 'GET',
    });

    const res = await getMe(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.user).toBeDefined();
    expect(data.user.name).toBeDefined();
    expect(data.user.preferences).toBeDefined();
    expect(data.user.preferences.theme).toBeDefined();
  });

  it('PUT /api/v1/users/me updates profile name and editor preferences', async () => {
    const updatedPayload = {
      name: 'Taylor Swift Coder',
      email: 'taylor@pairly.dev',
      preferences: {
        theme: 'dark',
        fontSize: 16,
        tabSize: 4,
        aiSuggestions: true,
      },
    };

    const req = new NextRequest('http://localhost:3000/api/v1/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload),
    });

    const res = await updateMe(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.name).toBe('Taylor Swift Coder');
    expect(data.user.email).toBe('taylor@pairly.dev');
    expect(data.user.preferences.fontSize).toBe(16);
    expect(data.user.preferences.tabSize).toBe(4);
  });

  it('AT-11: GET /api/v1/users/me/export generates valid GDPR data export JSON archive (FR-ACCT-03)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users/me/export', {
      method: 'GET',
    });

    const res = await exportMe(req);
    expect(res.status).toBe(200);

    const contentType = res.headers.get('content-type');
    expect(contentType).toContain('application/json');

    const contentDisposition = res.headers.get('content-disposition');
    expect(contentDisposition).toContain('attachment');
    expect(contentDisposition).toContain('.json');

    const rawJson = await res.json();
    expect(rawJson.exportMetadata).toBeDefined();
    expect(rawJson.exportMetadata.compliance).toContain('GDPR');
    expect(rawJson.profile).toBeDefined();
    expect(Array.isArray(rawJson.hostedRooms)).toBe(true);
    expect(Array.isArray(rawJson.workspaceSnapshots)).toBe(true);
  });

  it('DELETE /api/v1/users/me cascades deletion of account and hosted room records (FR-ACCT-04)', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/users/me', {
      method: 'DELETE',
      headers: { 'x-user-id': 'usr_temp_delete' },
    });

    const res = await deleteMe(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('deleted');
  });
});
