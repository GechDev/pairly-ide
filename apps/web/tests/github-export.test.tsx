import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NextRequest } from 'next/server';
import { defaultGitHubClient } from '../src/lib/githubClient';
import { POST } from '../src/app/api/v1/integrations/github/commit/route';
import { GitHubExportModal } from '../src/components/workspace/GitHubExportModal';

describe('GitHub Commit & Export Integration', () => {
  it('defaultGitHubClient.commitFile generates commit sha and URL', async () => {
    const res = await defaultGitHubClient.commitFile(
      'pairly-team',
      'pairly-sample-app',
      'src/main.ts',
      'console.log("hello world");',
      'feat: add main script',
      'mock-token'
    );

    expect(res.success).toBe(true);
    expect(res.sha).toBeDefined();
    expect(res.commitUrl).toContain('https://github.com/pairly-team/pairly-sample-app/commit/');
  });

  it('POST /api/v1/integrations/github/commit returns 200 with commit details', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/integrations/github/commit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Bearer mock-token',
      },
      body: JSON.stringify({
        owner: 'pairly-team',
        repo: 'pairly-sample-app',
        path: 'src/index.ts',
        content: 'export const version = "1.0.0";',
        message: 'fix: update version',
        branch: 'main',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.commitUrl).toBeDefined();
    expect(data.sha).toBeDefined();
  });

  it('POST /api/v1/integrations/github/commit rejects invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/integrations/github/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('GitHubExportModal Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/integrations/github/repos')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 101, name: 'pairly-sample-app', fullName: 'pairly-team/pairly-sample-app', defaultBranch: 'main' },
          ],
        });
      }
      if (url.includes('/api/v1/integrations/github/commit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            commitUrl: 'https://github.com/pairly-team/pairly-sample-app/commit/abc1234',
            sha: 'abc1234',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));
  });

  it('renders modal with repository dropdown and commit fields', async () => {
    render(
      <GitHubExportModal
        isOpen={true}
        onClose={vi.fn()}
        activeFileName="App.tsx"
        activeFileContent="export default function App() { return <div>Pairly</div>; }"
      />
    );

    expect(screen.getByTestId('github-export-modal')).toBeDefined();
    expect(screen.getByText('Commit to GitHub Repository')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByTestId('repo-select')).toBeDefined();
    });

    // Check pre-filled inputs
    const filepathInput = screen.getByTestId('filepath-input') as HTMLInputElement;
    expect(filepathInput.value).toBe('App.tsx');

    const commitMsgInput = screen.getByTestId('commit-message-input') as HTMLTextAreaElement;
    expect(commitMsgInput.value).toContain('Update App.tsx via Pairly IDE');
  });

  it('commits changes and displays success view with commit link', async () => {
    render(
      <GitHubExportModal
        isOpen={true}
        onClose={vi.fn()}
        activeFileName="App.tsx"
        activeFileContent="console.log('test');"
      />
    );

    // Wait for repos to load
    await waitFor(() => {
      expect(screen.getByTestId('repo-select')).toBeDefined();
    });

    const submitBtn = screen.getByTestId('submit-commit-btn');
    fireEvent.click(submitBtn);

    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByText('Commit Successful!')).toBeDefined();
    });

    const viewLink = screen.getByTestId('view-commit-btn') as HTMLAnchorElement;
    expect(viewLink.href).toBe('https://github.com/pairly-team/pairly-sample-app/commit/abc1234');
  });
});
