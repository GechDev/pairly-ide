import { NextRequest, NextResponse } from 'next/server';
import { defaultGitHubClient } from '../../../../../../lib/githubClient';

/**
 * POST /api/v1/integrations/github/import
 * Imports repository tree and files into active Pairly room workspace (FR-INT-02).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { owner, repo, branch = 'main' } = body;

    if (!repo) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : undefined;

    const result = await defaultGitHubClient.importRepository(
      owner || 'pairly-team',
      repo,
      token,
      branch,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import GitHub repository';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
