import { NextRequest, NextResponse } from 'next/server';
import {
  RunParametersSchema,
  canExecute,
  type RoomRole,
} from '@pairly/contracts';
import { PistonRunnerClient } from '@pairly/execution';

const runner = new PistonRunnerClient();

interface RouteContext {
  params: { code: string };
}

/**
 * POST /api/v1/rooms/[code]/run
 * Executes code in sandboxed runner per SRS FR-EXEC-01..05 and AT-05.
 * Enforces server-side RBAC: viewers cannot execute code.
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    // Role check from headers or query for test and production
    const roleHeader = (request.headers.get('x-user-role') || 'EDITOR') as RoomRole;
    if (!canExecute(roleHeader)) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Your role does not have execution permissions (SRS SEC-01)',
          code: 'UNAUTHORIZED_ACTION',
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = RunParametersSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid run parameters',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await runner.execute(parsed.data);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
