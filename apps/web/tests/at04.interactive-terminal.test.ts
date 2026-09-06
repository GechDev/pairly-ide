import { describe, it, expect, vi } from 'vitest';
import { TerminalSessionManager } from '../../realtime/src/pty/runner';
import type { ExecutionOutputChunk, ExecutionStatus } from '@pairly/contracts';

describe('T-13: Shared Real-Time Terminal & Interactive Stdin (AT-04)', () => {
  it('streams output in real-time and supports interactive stdin (FR-EXEC-02..03, AT-04)', async () => {
    const manager = new TerminalSessionManager();
    const roomId = 'room-at04-interactive-test';
    const receivedChunks: ExecutionOutputChunk[] = [];
    let latestStatus: ExecutionStatus = 'QUEUED';

    // Interactive Python program: input("Name: ") -> print(f"Hello, {name}!")
    const interactiveProgram = {
      language: 'python' as const,
      files: [
        {
          name: 'greet.py',
          content: 'name = input("Name: ")\nprint(f"Hello, {name}!")',
          encoding: 'utf-8' as const,
        },
      ],
      stdin: 'Alice\n',
      limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false as const },
    };

    const runId = await manager.startRun(roomId, interactiveProgram, {
      onChunk: (chunk) => {
        receivedChunks.push(chunk);
      },
      onStatusChange: (status) => {
        latestStatus = status;
      },
    });

    expect(runId).toBeDefined();

    // Send interactive standard input chunk
    const stdinSent = manager.sendStdin(runId, 'Alice\n');
    expect(stdinSent).toBe(true);

    // Wait for asynchronous execution to complete
    for (let i = 0; i < 30; i++) {
      if (latestStatus === 'COMPLETED' || latestStatus === 'FAILED') break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    expect(latestStatus).toBe('COMPLETED');
    expect(receivedChunks.length).toBeGreaterThanOrEqual(2);

    const fullOutput = receivedChunks.map((c) => c.data).join('');
    // Verify greeting output per AT-04 acceptance criteria
    expect(fullOutput).toContain('Name: ');
    expect(fullOutput).toContain('Hello, Alice!');
  });

  it('retains recent terminal history for late-joining participants (FR-EXEC-08)', async () => {
    const manager = new TerminalSessionManager();
    const roomId = 'room-at04-late-joiner';

    await manager.startRun(
      roomId,
      {
        language: 'javascript' as const,
        files: [
          {
            name: 'index.js',
            content: 'console.log("Logged before Bob joined");',
            encoding: 'utf-8' as const,
          },
        ],
        limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false as const },
      },
      {
        onChunk: vi.fn(),
        onStatusChange: vi.fn(),
      }
    );

    for (let i = 0; i < 30; i++) {
      if (
        manager
          .getRoomHistory(roomId)
          .some((c) => c.data.includes('Logged before Bob joined'))
      ) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    // Bob joins later: manager provides recorded room history
    const history = manager.getRoomHistory(roomId);
    expect(history.length).toBeGreaterThan(0);
    const combinedHistory = history.map((c) => c.data).join('');
    expect(combinedHistory).toContain('Logged before Bob joined');

    // Clearing history empties buffer
    manager.clearRoomHistory(roomId);
    expect(manager.getRoomHistory(roomId).length).toBe(0);
  });
});
