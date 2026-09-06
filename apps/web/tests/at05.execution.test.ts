import { describe, it, expect } from 'vitest';
import {
  PistonRunnerClient,
  detectLanguageFromFilename,
  getLanguageDefinition,
  LANGUAGE_REGISTRY,
  DEFAULT_EXECUTION_LIMITS,
} from '@pairly/execution';
import { canExecute, type RoomRole } from '@pairly/contracts';

describe('T-12: Sandboxed Execution Service & Piston Client (AT-05)', () => {
  const runner = new PistonRunnerClient();

  it('supports 20+ programming languages with registry mapping (FR-EXEC-01)', () => {
    const supportedKeys = Object.keys(LANGUAGE_REGISTRY);
    expect(supportedKeys.length).toBeGreaterThanOrEqual(20);

    // Verify key languages are registered with proper extensions
    expect(detectLanguageFromFilename('main.py')).toBe('python');
    expect(detectLanguageFromFilename('index.ts')).toBe('typescript');
    expect(detectLanguageFromFilename('index.js')).toBe('javascript');
    expect(detectLanguageFromFilename('main.go')).toBe('go');
    expect(detectLanguageFromFilename('main.rs')).toBe('rust');
    expect(detectLanguageFromFilename('main.cpp')).toBe('cpp');
    expect(detectLanguageFromFilename('main.c')).toBe('c');
    expect(detectLanguageFromFilename('Main.java')).toBe('java');
    expect(detectLanguageFromFilename('Program.cs')).toBe('csharp');
    expect(detectLanguageFromFilename('main.rb')).toBe('ruby');
    expect(detectLanguageFromFilename('index.php')).toBe('php');
    expect(detectLanguageFromFilename('main.swift')).toBe('swift');
    expect(detectLanguageFromFilename('main.kt')).toBe('kotlin');
    expect(detectLanguageFromFilename('script.sh')).toBe('bash');
    expect(detectLanguageFromFilename('query.sql')).toBe('sql');

    const pyDef = getLanguageDefinition('python');
    expect(pyDef?.pistonLanguage).toBe('python');
    expect(pyDef?.compiled).toBe(false);

    const rsDef = getLanguageDefinition('rust');
    expect(rsDef?.pistonLanguage).toBe('rust');
    expect(rsDef?.compiled).toBe(true);
  });

  it('executes Python script and captures standard output', async () => {
    const result = await runner.execute({
      language: 'python',
      files: [{ name: 'main.py', content: 'print("Hello from Pairly Python")' }],
      limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false },
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello from Pairly Python');
  });

  it('executes JavaScript script and captures standard output', async () => {
    const result = await runner.execute({
      language: 'javascript',
      files: [{ name: 'index.js', content: 'console.log("Hello from Pairly JS")' }],
      limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false },
    });

    expect(result.status).toBe('COMPLETED');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello from Pairly JS');
  });

  it('executes compiled languages (Go, Rust, C++)', async () => {
    for (const lang of ['go', 'rust', 'cpp'] as const) {
      const def = LANGUAGE_REGISTRY[lang];
      const result = await runner.execute({
        language: lang,
        files: [{ name: def.defaultFilename, content: `// Pairly ${lang} code` }],
        limits: { timeoutMs: 5000, memoryLimitMb: 256, networkEnabled: false },
      });

      expect(['COMPLETED', 'RUNNING']).toContain(result.status);
      expect(result.runId).toBeDefined();
    }
  });

  it('terminates infinite loops within the 10-second limit (AT-05)', async () => {
    const result = await runner.execute({
      language: 'python',
      files: [{ name: 'infinite.py', content: 'while True:\n    pass' }],
      limits: { timeoutMs: 10000, memoryLimitMb: 256, networkEnabled: false },
    });

    expect(result.status).toBe('TIMEOUT');
    expect(result.exitCode).toBeNull();
    expect(result.stderr).toContain('exceeded');
  });

  it('terminates fork bombs exceeding process limit (AT-05)', async () => {
    const result = await runner.execute({
      language: 'python',
      files: [{ name: 'bomb.py', content: 'import os\nwhile True:\n    os.fork()' }],
      limits: { timeoutMs: 10000, memoryLimitMb: 256, networkEnabled: false },
    });

    expect(result.status).toBe('FAILED');
    expect(result.stderr).toContain('process limit');
  });

  it('enforces RBAC execution permissions for Viewer roles (SEC-01)', () => {
    const viewerRole: RoomRole = 'VIEWER';
    const editorRole: RoomRole = 'EDITOR';
    const hostRole: RoomRole = 'HOST';

    expect(canExecute(viewerRole)).toBe(false);
    expect(canExecute(editorRole)).toBe(true);
    expect(canExecute(hostRole)).toBe(true);
  });

  it('verifies default execution limits comply with SRS specifications', () => {
    expect(DEFAULT_EXECUTION_LIMITS.TIMEOUT_MS).toBe(10000);
    expect(DEFAULT_EXECUTION_LIMITS.MEMORY_LIMIT_MB).toBe(256);
    expect(DEFAULT_EXECUTION_LIMITS.NETWORK_ENABLED).toBe(false);
    expect(DEFAULT_EXECUTION_LIMITS.MAX_PROCESSES).toBe(64);
  });
});
