import { describe, expect, it } from 'vitest';
import {
  CancelExecutionSchema,
  ExecutionLimitsSchema,
  ExecutionOutputChunkSchema,
  ExecutionResultSchema,
  RunParametersSchema,
  SendStdinSchema,
  SUPPORTED_LANGUAGES,
  SupportedLanguageSchema,
  validateCancelExecution,
  validateExecutionResult,
  validateRunParameters,
  validateSendStdin,
} from '../src/execution.js';

describe('Execution Contracts & Validation', () => {
  describe('Supported Languages (FR-EXEC-01)', () => {
    it('supports at least 20 languages at launch', () => {
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThanOrEqual(20);
    });

    it('validates common supported programming languages', () => {
      const languagesToTest = [
        'javascript',
        'typescript',
        'python',
        'go',
        'rust',
        'cpp',
        'c',
        'java',
        'csharp',
        'ruby',
        'php',
        'sql',
      ];

      for (const lang of languagesToTest) {
        expect(SupportedLanguageSchema.parse(lang)).toBe(lang);
      }
    });

    it('rejects unsupported language', () => {
      expect(() => SupportedLanguageSchema.parse('brainfuck')).toThrow();
      expect(() => SupportedLanguageSchema.parse('')).toThrow();
    });
  });

  describe('Execution Limits & Sandbox Security (FR-EXEC-04, FR-EXEC-05, SEC-05)', () => {
    it('applies default limits within safe parameters (10s, 256MB, network disabled)', () => {
      const defaults = ExecutionLimitsSchema.parse({});
      expect(defaults.timeoutMs).toBe(10000);
      expect(defaults.memoryLimitMb).toBe(256);
      expect(defaults.networkEnabled).toBe(false);
    });

    it('rejects timeout exceeding 10,000ms', () => {
      expect(ExecutionLimitsSchema.safeParse({ timeoutMs: 10001 }).success).toBe(false);
      expect(ExecutionLimitsSchema.safeParse({ timeoutMs: 499 }).success).toBe(false);
      expect(ExecutionLimitsSchema.safeParse({ timeoutMs: 5000 }).success).toBe(true);
    });

    it('rejects memory limit exceeding 256MB', () => {
      expect(ExecutionLimitsSchema.safeParse({ memoryLimitMb: 257 }).success).toBe(false);
      expect(ExecutionLimitsSchema.safeParse({ memoryLimitMb: 8 }).success).toBe(false);
      expect(ExecutionLimitsSchema.safeParse({ memoryLimitMb: 128 }).success).toBe(true);
    });

    it('strictly forbids enabling network access by default', () => {
      const result = ExecutionLimitsSchema.safeParse({ networkEnabled: true });
      expect(result.success).toBe(false);
    });
  });

  describe('RunParametersSchema & validateRunParameters', () => {
    it('validates a standard Python script run request', () => {
      const payload = {
        language: 'python',
        files: [
          {
            name: 'main.py',
            content: 'print("Hello from Pairly sandbox")',
          },
        ],
        entrypoint: 'main.py',
        stdin: 'test input',
      };

      const result = validateRunParameters(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limits.timeoutMs).toBe(10000);
        expect(result.data.limits.networkEnabled).toBe(false);
      }
    });

    it('rejects run parameters without files', () => {
      const result = validateRunParameters({
        language: 'javascript',
        files: [],
      });
      expect(result.success).toBe(false);
    });

    it('rejects file content exceeding size limit (5MB)', () => {
      const result = validateRunParameters({
        language: 'javascript',
        files: [
          {
            name: 'large.js',
            content: 'x'.repeat(1024 * 1024 * 5 + 1),
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('rejects stdin payload exceeding 64KB', () => {
      const result = validateRunParameters({
        language: 'python',
        files: [{ name: 'main.py', content: 'input()' }],
        stdin: 'x'.repeat(65537),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Execution Output and Result Schemas', () => {
    it('validates streaming output chunks', () => {
      const chunk = {
        runId: 'run_123',
        stream: 'stdout',
        data: 'Calculation complete\n',
        timestamp: Date.now(),
      };
      expect(ExecutionOutputChunkSchema.safeParse(chunk).success).toBe(true);
    });

    it('validates final execution result', () => {
      const resultPayload = {
        runId: 'run_123',
        status: 'COMPLETED',
        exitCode: 0,
        stdout: 'Hello World',
        stderr: '',
        durationMs: 142,
        memoryUsedBytes: 15420000,
      };

      const result = validateExecutionResult(resultPayload);
      expect(result.success).toBe(true);
    });

    it('validates timeout execution result', () => {
      const resultPayload = {
        runId: 'run_124',
        status: 'TIMEOUT',
        exitCode: null,
        stdout: '',
        stderr: 'Execution timed out after 10000ms',
        durationMs: 10001,
        error: 'Execution timed out',
      };

      const result = validateExecutionResult(resultPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Interactive Stdin & Cancellation', () => {
    it('validates stdin chunk submission', () => {
      const result = validateSendStdin({
        runId: 'run_123',
        data: 'user response\n',
      });
      expect(result.success).toBe(true);
    });

    it('validates execution cancellation', () => {
      const result = validateCancelExecution({
        runId: 'run_123',
        reason: 'User stopped execution',
      });
      expect(result.success).toBe(true);
    });
  });
});
