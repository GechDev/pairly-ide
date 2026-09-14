import { NextRequest, NextResponse } from 'next/server';
import { defaultGitHubClient } from '../../../../../../lib/githubClient';

/**
 * POST /api/v1/integrations/github/commit
 * Commits active file or workspace content to a GitHub repository (FR-INT-03, CodeX Inspired).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { owner = 'pairly-team', repo, path, content, message, branch = 'main' } = body;

    if (!repo) {
      return NextResponse.json({ error: 'Repository name is required' }, { status: 400 });
    }
    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'File content must be a string' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : undefined;

    const commitMessage = message?.trim() || `Update ${path} via Pairly IDE`;

    const result = await defaultGitHubClient.commitFile(
      owner,
      repo,
      path,
      content,
      commitMessage,
      token,
      branch,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to commit file to GitHub';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
