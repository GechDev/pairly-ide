import { NextRequest, NextResponse } from 'next/server';
import {
  validateAiInvocation,
  canEdit,
  type RoomRole,
} from '@pairly/contracts';
import { defaultAiGateway } from '@pairly/ai';

interface RouteContext {
  params: { code: string };
}

/**
 * POST /api/v1/rooms/[code]/ai
 * Dispatches AI invocations to the Pairly AI Gateway with
 * transparent context disclosure and server-side RBAC enforcement (FR-AI-01..03, 07).
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    // Role check from headers
    const roleHeader = (request.headers.get('x-user-role') || 'EDITOR') as RoomRole;
    if (!canEdit(roleHeader)) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Your role does not have permission to invoke AI assistance (SRS SEC-01)',
          code: 'UNAUTHORIZED_ACTION',
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = validateAiInvocation(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid AI invocation parameters',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Execute via AI Gateway
    const result = await defaultAiGateway.invoke(parsed.data);

    return NextResponse.json(
      {
        ...result,
        contextDisclosure: {
          activeFile: parsed.data.context.activeFile.path,
          hasSelection: !!parsed.data.context.activeFile.selection,
          additionalFilesCount: parsed.data.context.additionalFiles?.length || 0,
          hasTerminalOutput: !!parsed.data.context.terminalOutput,
          hasErrorContext: !!parsed.data.context.errorContext,
        },
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI Gateway invocation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
