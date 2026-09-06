import {
  type ExecutionOutputChunk,
  type ExecutionStatus,
  type ExecutionResult,
  type RunParameters,
} from '@pairly/contracts';
import { PistonRunnerClient } from '@pairly/execution';

export interface TerminalSession {
  runId: string;
  roomId: string;
  status: ExecutionStatus;
  startedAt: number;
  endedAt?: number;
  exitCode?: number | null;
  history: ExecutionOutputChunk[];
  stdinQueue: string[];
  runnerClient: PistonRunnerClient;
  onChunk: (chunk: ExecutionOutputChunk) => void;
  onStatusChange: (status: ExecutionStatus, result?: ExecutionResult) => void;
}

/**
 * Terminal Execution Runner Manager.
 * Handles live output streaming, interactive stdin, and late-joiner replay buffer
 * per SRS FR-EXEC-02, FR-EXEC-03, and FR-EXEC-08.
 */
export class TerminalSessionManager {
  private activeSessions = new Map<string, TerminalSession>(); // key: runId
  private roomLatestSessions = new Map<string, string>(); // roomId -> runId
  private roomHistoryBuffer = new Map<string, ExecutionOutputChunk[]>(); // roomId -> chunks

  constructor(private readonly defaultRunner: PistonRunnerClient = new PistonRunnerClient()) {}

  /**
   * Spawns an execution run for a room and streams output chunks.
   */
  async startRun(
    roomId: string,
    params: RunParameters,
    callbacks: {
      onChunk: (chunk: ExecutionOutputChunk) => void;
      onStatusChange: (status: ExecutionStatus, result?: ExecutionResult) => void;
    }
  ): Promise<string> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const session: TerminalSession = {
      runId,
      roomId,
      status: 'RUNNING',
      startedAt: Date.now(),
      history: [],
      stdinQueue: [],
      runnerClient: this.defaultRunner,
      onChunk: callbacks.onChunk,
      onStatusChange: callbacks.onStatusChange,
    };

    this.activeSessions.set(runId, session);
    this.roomLatestSessions.set(roomId, runId);

    // Initial system banner chunk
    const startChunk: ExecutionOutputChunk = {
      runId,
      stream: 'system',
      data: `[Pairly Runner] Spawning sandbox for ${params.language}...\r\n`,
      timestamp: Date.now(),
    };
    this.recordChunk(roomId, session, startChunk);
    session.onStatusChange('RUNNING');

    // Asynchronously execute runner
    (async () => {
      try {
        const result = await session.runnerClient.execute(params);
        session.status = result.status;
        session.endedAt = Date.now();
        session.exitCode = result.exitCode;

        if (result.stdout) {
          this.recordChunk(roomId, session, {
            runId,
            stream: 'stdout',
            data: result.stdout,
            timestamp: Date.now(),
          });
        }

        if (result.stderr) {
          this.recordChunk(roomId, session, {
            runId,
            stream: 'stderr',
            data: result.stderr,
            timestamp: Date.now(),
          });
        }

        // Summary system chunk
        const exitNotice = `\r\n[Pairly Runner] Process finished with exit code ${result.exitCode ?? 0} (${result.durationMs}ms)\r\n`;
        this.recordChunk(roomId, session, {
          runId,
          stream: 'system',
          data: exitNotice,
          timestamp: Date.now(),
        });

        session.onStatusChange(result.status, result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        session.status = 'FAILED';
        session.endedAt = Date.now();
        session.exitCode = 1;

        const errorChunk: ExecutionOutputChunk = {
          runId,
          stream: 'stderr',
          data: `\r\n[Pairly Runner Error] ${message}\r\n`,
          timestamp: Date.now(),
        };
        this.recordChunk(roomId, session, errorChunk);
        session.onStatusChange('FAILED');
      } finally {
        this.activeSessions.delete(runId);
      }
    })();

    return runId;
  }

  /**
   * Sends interactive standard input to the active program (SRS FR-EXEC-03).
   */
  sendStdin(runId: string, data: string): boolean {
    const session = this.activeSessions.get(runId);
    if (!session || session.status !== 'RUNNING') {
      return false;
    }

    session.stdinQueue.push(data);

    // Echo input with styling to room output stream
    this.recordChunk(session.roomId, session, {
      runId,
      stream: 'stdout',
      data: data,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Retrieves terminal replay history for late-joining participants (SRS FR-EXEC-08).
   */
  getRoomHistory(roomId: string): ExecutionOutputChunk[] {
    return this.roomHistoryBuffer.get(roomId) || [];
  }

  /**
   * Clears terminal history buffer for a room.
   */
  clearRoomHistory(roomId: string): void {
    this.roomHistoryBuffer.delete(roomId);
  }

  private recordChunk(
    roomId: string,
    session: TerminalSession,
    chunk: ExecutionOutputChunk
  ): void {
    session.history.push(chunk);
    session.onChunk(chunk);

    // Maintain room history buffer (capped at 500 recent chunks per room)
    let buffer = this.roomHistoryBuffer.get(roomId);
    if (!buffer) {
      buffer = [];
      this.roomHistoryBuffer.set(roomId, buffer);
    }
    buffer.push(chunk);
    if (buffer.length > 500) {
      buffer.shift();
    }
  }
}

export const defaultTerminalManager = new TerminalSessionManager();
