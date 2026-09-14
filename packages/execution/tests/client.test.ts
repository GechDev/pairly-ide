import { describe, expect, it } from 'vitest';
import { PistonRunnerClient } from '../src/client.js';
import {
  LANGUAGE_REGISTRY,
  detectLanguageFromFilename,
  getLanguageDefinition,
} from '../src/languages.js';
import { DEFAULT_EXECUTION_LIMITS } from '../src/limits.js';

describe('Sandboxed Execution Service (@pairly/execution)', () => {
  describe('Language Registry & Detection (FR-EXEC-01)', () => {
    it('supports at least 20 programming languages', () => {
      const languages = Object.keys(LANGUAGE_REGISTRY);
      expect(languages.length).toBeGreaterThanOrEqual(20);
    });

    it('detects language from file extensions', () => {
      expect(detectLanguageFromFilename('main.py')).toBe('python');
      expect(detectLanguageFromFilename('index.ts')).toBe('typescript');
      expect(detectLanguageFromFilename('app.js')).toBe('javascript');
      expect(detectLanguageFromFilename('main.go')).toBe('go');
      expect(detectLanguageFromFilename('main.rs')).toBe('rust');
      expect(detectLanguageFromFilename('main.cpp')).toBe('cpp');
      expect(detectLanguageFromFilename('Main.java')).toBe('java');
    });

    it('retrieves language definitions by id and alias', () => {
      const pyDef = getLanguageDefinition('python');
      expect(pyDef).toBeDefined();
      expect(pyDef?.pistonLanguage).toBe('python');

      const aliasDef = getLanguageDefinition('py');
      expect(aliasDef?.id).toBe('python');

      const jsDef = getLanguageDefinition('node');
      expect(jsDef?.id).toBe('javascript');
    });
  });

  describe('Execution Limits & Sandbox Security (FR-EXEC-04, FR-EXEC-05, SEC-05)', () => {
    it('enforces 10s maximum timeout and 256MB memory cap', () => {
      expect(DEFAULT_EXECUTION_LIMITS.TIMEOUT_MS).toBe(10000);
      expect(DEFAULT_EXECUTION_LIMITS.MEMORY_LIMIT_MB).toBe(256);
      expect(DEFAULT_EXECUTION_LIMITS.NETWORK_ENABLED).toBe(false);
    });
  });

  describe('PistonRunnerClient Execution & Security Guardrails', () => {
    const client = new PistonRunnerClient({
      endpoint: 'http://localhost:9999', // Non-existent port to exercise offline/fallback sandbox runner
    });

    it('fetches runtimes list with fallback to registry', async () => {
      const runtimes = await client.getRuntimes();
      expect(runtimes.length).toBeGreaterThanOrEqual(20);
      expect(runtimes.some((r) => r.language === 'python')).toBe(true);
    });

    it('executes simple Python code successfully', async () => {
      const result = await client.execute({
        language: 'python',
        files: [{ name: 'main.py', content: 'print("Hello from Pairly!")' }],
        limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false },
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Hello from Pairly!');
    });

    it('executes JavaScript code successfully', async () => {
      const result = await client.execute({
        language: 'javascript',
        files: [{ name: 'index.js', content: 'console.log("JavaScript test passed")' }],
        limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false },
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('JavaScript test passed');
    });

    it('handles interactive standard input (AT-04)', async () => {
      const result = await client.execute({
        language: 'python',
        files: [{ name: 'main.py', content: 'name = input("Name: ")\nprint(f"Hello, {name}!")' }],
        stdin: 'PairlyUser',
        limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false },
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.stdout).toContain('PairlyUser');
    });

    it('terminates infinite loop within 10s timeout (AT-05)', async () => {
      const result = await client.execute({
        language: 'python',
        files: [{ name: 'loop.py', content: 'while True: pass' }],
        limits: { timeoutMs: 1000, memoryLimitMb: 256, networkEnabled: false },
      });

      expect(result.status).toBe('TIMEOUT');
      expect(result.stderr).toContain('Process terminated');
    });

    it('terminates simulated fork bomb exceeding process limits (AT-05)', async () => {
      const result = await client.execute({
        language: 'python',
        files: [{ name: 'bomb.py', content: 'import os\nwhile True: os.fork()' }],
        limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false },
      });

      expect(result.status).toBe('FAILED');
      expect(result.exitCode).toBe(137);
      expect(result.stderr).toContain('exceeded maximum process limit');
    });
  });
});
