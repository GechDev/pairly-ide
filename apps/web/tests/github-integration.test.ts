import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { defaultGitHubClient } from '../src/lib/githubClient';
import { GET } from '../src/app/api/v1/integrations/github/repos/route';
import { POST } from '../src/app/api/v1/integrations/github/import/route';
import { createWorkspaceManager } from '../src/components/workspace/workspaceState';

describe('T-21: GitHub OAuth & Repository Import (FR-INT-01..02)', () => {
  it('lists accessible repositories with name, visibility, and branch metadata', async () => {
    const repos = await defaultGitHubClient.listRepositories('mock-token');

    expect(repos).toBeDefined();
    expect(repos.length).toBeGreaterThan(0);

    const first = repos[0];
    expect(first?.id).toBeDefined();
    expect(first?.name).toBeDefined();
    expect(first?.fullName).toBeDefined();
    expect(typeof first?.isPrivate).toBe('boolean');
    expect(first?.defaultBranch).toBe('main');
  });

  it('filters repositories based on search queries', async () => {
    const pythonRepos = await defaultGitHubClient.listRepositories('mock-token', 'python');
    expect(pythonRepos.length).toBeGreaterThan(0);
    expect(pythonRepos.every((r) => r.name.includes('python') || r.description?.includes('Python'))).toBe(true);

    const nonExistent = await defaultGitHubClient.listRepositories('mock-token', 'non-existent-repo-xyz-999');
    expect(nonExistent.length).toBe(0);
  });

  it('fetches repository tree and decodes files for room injection (FR-INT-02)', async () => {
    const importRes = await defaultGitHubClient.importRepository(
      'pairly-team',
      'pairly-sample-app',
      'mock-token',
    );

    expect(importRes.repoName).toBe('pairly-sample-app');
    expect(importRes.filesImported).toBeGreaterThan(0);
    expect(importRes.files.some((f) => f.path === 'package.json')).toBe(true);
    expect(importRes.files.some((f) => f.path === 'src/index.ts')).toBe(true);
  });

  it('GET /api/v1/integrations/github/repos returns 200 with repository list', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/integrations/github/repos?query=sample', {
      method: 'GET',
      headers: { authorization: 'Bearer mock-token' },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.repos).toBeDefined();
    expect(data.count).toBeGreaterThan(0);
  });

  it('POST /api/v1/integrations/github/import injects repository files into workspace state', async () => {
    // 1. Call import API
    const req = new NextRequest('http://localhost:3000/api/v1/integrations/github/import', {
      method: 'POST',
      headers: { authorization: 'Bearer mock-token' },
      body: JSON.stringify({
        owner: 'pairly-team',
        repo: 'pairly-sample-app',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.files).toBeDefined();
    expect(data.files.length).toBeGreaterThan(0);

    // 2. Inject into workspace manager
    const workspace = createWorkspaceManager();
    for (const file of data.files) {
      workspace.createFile(file.path, file.isFolder, null, file.content);
    }

    const state = workspace.getState();
    const importedFileNames = state.items.map((i) => i.name);
    expect(importedFileNames).toContain('package.json');
    expect(importedFileNames).toContain('src/index.ts');
  });

  it('rejects POST /api/v1/integrations/github/import when repo name is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/integrations/github/import', {
      method: 'POST',
      body: JSON.stringify({ owner: 'pairly-team' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Repository name is required');
  });
});
