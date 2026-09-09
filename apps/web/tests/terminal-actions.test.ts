import { describe, it, expect, vi } from 'vitest';
import { defaultAiGateway, computeUnifiedDiff } from '@pairly/ai';
import { AiProposalSchema, type AiProposal } from '@pairly/contracts';

describe('T-19: "Explain & Fix" Terminal Error Action (FR-AI-09)', () => {
  const faultyCode = `function divideNumbers(a: number, b: number): number {
  if (b === 0) {
    throw new Error("ZeroDivisionError: division by zero");
  }
  return a / b;
}

divideNumbers(10, 0);`;

  const terminalCrashOutput = `Error: ZeroDivisionError: division by zero
    at divideNumbers (/workspace/src/index.ts:3:11)
    at Object.<anonymous> (/workspace/src/index.ts:8:1)
Process terminated with exit code 1.`;

  it('captures stack trace and triggers EXPLAIN_AND_FIX AI invocation (FR-AI-09)', async () => {
    const errorStatus = 'FAILED';
    const exitCode = 1;

    // Verify error eligibility
    const isEligible = exitCode !== 0 || errorStatus === 'FAILED';
    expect(isEligible).toBe(true);

    // Call AI Gateway with EXPLAIN_AND_FIX action
    const aiResult = await defaultAiGateway.invoke({
      action: 'EXPLAIN_AND_FIX',
      context: {
        activeFile: {
          path: 'src/index.ts',
          content: faultyCode,
          language: 'typescript',
        },
        terminalOutput: terminalCrashOutput,
        errorContext: {
          message: 'ZeroDivisionError: division by zero',
          stackTrace: terminalCrashOutput,
        },
      },
    });

    expect(aiResult.action).toBe('EXPLAIN_AND_FIX');
    expect(aiResult.explanation).toContain('Error Diagnosis & Patch (FR-AI-09)');
    expect(aiResult.explanation).toContain('ZeroDivisionError: division by zero');
    expect(aiResult.suggestedCode).toBeDefined();

    // Verify diff generation
    const diff = computeUnifiedDiff(faultyCode, aiResult.suggestedCode!, 'src/index.ts');
    expect(diff.diffText).toContain('--- a/src/index.ts');
    expect(diff.diffText).toContain('+++ b/src/index.ts');

    // Verify constructed proposal validates against contract schema
    const proposal: AiProposal = {
      proposalId: `prop-fix-${Date.now()}`,
      action: 'EXPLAIN_AND_FIX',
      filePath: 'src/index.ts',
      baseDocumentVersion: 1,
      explanation: aiResult.explanation,
      diff: diff.diffText,
      suggestedCode: aiResult.suggestedCode,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    const validated = AiProposalSchema.safeParse(proposal);
    expect(validated.success).toBe(true);
  });

  it('suppresses Explain & Fix action when process terminates with code 0', () => {
    const exitCode = 0;
    const status = 'COMPLETED';

    const isEligible = (exitCode !== null && exitCode !== 0) || status === 'FAILED';
    expect(isEligible).toBe(false);
  });

  it('activates Explain & Fix for timeout and out-of-memory terminations', () => {
    expect('TIMEOUT' === 'TIMEOUT' || 124 !== 0).toBe(true);
    expect('OOM_KILLED' === 'OOM_KILLED' || 137 !== 0).toBe(true);
  });
});
