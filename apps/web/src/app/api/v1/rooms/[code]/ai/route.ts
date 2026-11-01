import { NextRequest, NextResponse } from 'next/server';
import { validateAiInvocation, canWrite, type RoomRole } from '@pairly/contracts';
import { defaultAiGateway, type AiProviderType } from '@pairly/ai';

interface RouteContext {
  params: { code: string };
}

/**
 * POST /api/v1/rooms/[code]/ai
 * Dispatches AI invocations to the Pairly AI Gateway with
 * transparent context disclosure, live streaming (SSE), BYOK support,
 * and server-side RBAC enforcement (FR-AI-01..03, 06, 07, T-29).
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { code } = params;
    if (!code) {
      return NextResponse.json({ error: 'Room code is required' }, { status: 400 });
    }

    // Role check from headers
    const roleHeader = (request.headers.get('x-user-role') || 'EDITOR') as RoomRole;
    if (!canWrite(roleHeader)) {
      return NextResponse.json(
        {
          error:
            'Unauthorized: Your role does not have permission to invoke AI assistance (SRS SEC-01)',
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

    // Optional BYOK (Bring Your Own Key) & provider overrides from headers
    const byokKey = request.headers.get('x-ai-api-key') || undefined;
    const byokProvider = (request.headers.get('x-ai-provider') as AiProviderType) || undefined;
    const isStream =
      request.nextUrl.searchParams.get('stream') === 'true' ||
      request.headers.get('accept') === 'text/event-stream';

    // 1. Live Server-Sent Events (SSE) Streaming
    if (isStream) {
      const responseStream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          try {
            for await (const chunk of defaultAiGateway.stream(parsed.data, {
              apiKey: byokKey,
              provider: byokProvider,
            })) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new Response(responseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // 2. Standard JSON Completion
    const result = await defaultAiGateway.invoke(parsed.data, {
      apiKey: byokKey,
      provider: byokProvider,
    });

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
