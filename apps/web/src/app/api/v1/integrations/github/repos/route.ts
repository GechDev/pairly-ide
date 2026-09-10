import { NextRequest, NextResponse } from 'next/server';
import { defaultGitHubClient } from '../../../../../../lib/githubClient';

/**
 * GET /api/v1/integrations/github/repos
 * Lists repositories for authenticated user or demo explorer (FR-INT-01).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || undefined;

    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : undefined;

    const repos = await defaultGitHubClient.listRepositories(token, query);

    return NextResponse.json({ repos, count: repos.length }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list GitHub repositories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
