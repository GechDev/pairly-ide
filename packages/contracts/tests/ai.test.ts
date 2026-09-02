import { describe, expect, it } from 'vitest';
import {
  AiActionSchema,
  AiContextSchema,
  AiInvocationSchema,
  AiProposalSchema,
  AiStreamChunkSchema,
  EditorSelectionSchema,
  ReviewProposalSchema,
  validateAiInvocation,
  validateAiProposal,
  validateReviewProposal,
} from '../src/ai.js';

describe('AI Assistant Contracts & Validation', () => {
  describe('AI Actions (FR-AI-03, FR-AI-09)', () => {
    it('supports required core AI actions', () => {
      const actions = [
        'EXPLAIN',
        'FIND_BUGS',
        'REFACTOR',
        'GENERATE_TESTS',
        'DOCUMENT',
        'GENERATE_CODE',
        'EXPLAIN_AND_FIX',
      ];

      for (const action of actions) {
        expect(AiActionSchema.parse(action)).toBe(action);
      }
    });

    it('rejects unsupported actions', () => {
      expect(() => AiActionSchema.parse('DESTROY_CODE')).toThrow();
    });
  });

  describe('EditorSelectionSchema', () => {
    it('validates 1-indexed positive editor line and column coordinates', () => {
      const selection = {
        startLine: 10,
        startColumn: 1,
        endLine: 15,
        endColumn: 30,
        text: 'function test() {}',
      };
      expect(EditorSelectionSchema.safeParse(selection).success).toBe(true);
    });

    it('rejects zero or negative line numbers', () => {
      expect(
        EditorSelectionSchema.safeParse({
          startLine: 0,
          startColumn: 1,
          endLine: 1,
          endColumn: 1,
        }).success,
      ).toBe(false);
    });
  });

  describe('AiInvocationSchema & validateAiInvocation (FR-AI-07, NFR-PRIV-02)', () => {
    it('validates an AI invocation request with active file context', () => {
      const payload = {
        action: 'FIND_BUGS',
        prompt: 'Check for potential null pointer dereferences',
        context: {
          activeFile: {
            path: 'src/services/userService.ts',
            content: 'export class UserService {}',
            language: 'typescript',
          },
          additionalFiles: [
            {
              path: 'src/types.ts',
              content: 'export interface User {}',
            },
          ],
        },
      };

      const result = validateAiInvocation(payload);
      expect(result.success).toBe(true);
    });

    it('validates EXPLAIN_AND_FIX action with error context', () => {
      const payload = {
        action: 'EXPLAIN_AND_FIX',
        context: {
          activeFile: {
            path: 'main.py',
            content: 'print(1 / 0)',
            language: 'python',
          },
          terminalOutput: 'ZeroDivisionError: division by zero',
          errorContext: {
            message: 'ZeroDivisionError: division by zero',
            stackTrace: 'Traceback (most recent call last):\n  File "main.py", line 1, in <module>',
          },
        },
      };

      const result = validateAiInvocation(payload);
      expect(result.success).toBe(true);
    });

    it('rejects invocation without activeFile', () => {
      const payload = {
        action: 'EXPLAIN',
        context: {},
      };

      const result = validateAiInvocation(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('AiProposalSchema & validateAiProposal (FR-AI-04, FR-AI-08, AT-07, AT-08)', () => {
    it('validates an AI proposal with diff and base document version', () => {
      const proposal = {
        proposalId: 'prop_001',
        action: 'FIND_BUGS',
        filePath: 'src/app.ts',
        baseDocumentVersion: 42,
        explanation: 'Fixed unhandled promise rejection in async handler.',
        diff: '--- a/src/app.ts\n+++ b/src/app.ts\n@@ -1,2 +1,3 @@\n-run();\n+await run();',
        status: 'PENDING',
        createdAt: Date.now(),
      };

      const result = validateAiProposal(proposal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('PENDING');
        expect(result.data.baseDocumentVersion).toBe(42);
      }
    });

    it('accepts string version tags for baseDocumentVersion', () => {
      const proposal = {
        proposalId: 'prop_002',
        action: 'REFACTOR',
        filePath: 'main.rs',
        baseDocumentVersion: 'v1.4.0-hash123',
        explanation: 'Extracted helper method',
        diff: '@@ -10,3 +10,5 @@',
        createdAt: Date.now(),
      };

      const result = validateAiProposal(proposal);
      expect(result.success).toBe(true);
    });

    it('rejects proposal without required diff or explanation', () => {
      expect(
        validateAiProposal({
          proposalId: 'prop_003',
          action: 'REFACTOR',
          filePath: 'main.rs',
          baseDocumentVersion: 1,
          explanation: '',
          diff: '',
          createdAt: Date.now(),
        }).success,
      ).toBe(false);
    });
  });

  describe('ReviewProposalSchema & validateReviewProposal (AT-07, AT-08)', () => {
    it('validates accepting a proposal with document version check', () => {
      const result = validateReviewProposal({
        proposalId: 'prop_001',
        decision: 'ACCEPT',
        currentDocumentVersion: 42,
      });

      expect(result.success).toBe(true);
    });

    it('validates rejecting a proposal', () => {
      const result = validateReviewProposal({
        proposalId: 'prop_001',
        decision: 'REJECT',
      });

      expect(result.success).toBe(true);
    });

    it('rejects invalid review decision', () => {
      const result = validateReviewProposal({
        proposalId: 'prop_001',
        decision: 'MAYBE',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('AiStreamChunkSchema', () => {
    it('validates streaming chunks and completion with proposal', () => {
      const inFlightChunk = {
        requestId: 'req_1',
        chunk: 'Here is the bug explanation...',
        isDone: false,
      };
      expect(AiStreamChunkSchema.safeParse(inFlightChunk).success).toBe(true);

      const doneChunk = {
        requestId: 'req_1',
        chunk: '',
        isDone: true,
        proposal: {
          proposalId: 'prop_final',
          action: 'EXPLAIN_AND_FIX',
          filePath: 'test.py',
          baseDocumentVersion: 2,
          explanation: 'Fixed index error',
          diff: '@@ -1 +1 @@',
          createdAt: Date.now(),
        },
      };
      expect(AiStreamChunkSchema.safeParse(doneChunk).success).toBe(true);
    });
  });
});
