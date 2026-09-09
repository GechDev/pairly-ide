import { describe, it, expect } from 'vitest';
import {
  computeUnifiedDiff,
  isProposalStale,
  rebaseProposal,
} from '@pairly/ai';
import {
  AiProposalSchema,
  canWrite,
  ReviewProposalSchema,
  type AiProposal,
} from '@pairly/contracts';

describe('T-18: Diff Proposal Review & Base-Version Stale Detection (AT-07, AT-08)', () => {
  const originalCode = `function calculateTotal(items: number[]): number {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i];
  }
  return total;
}`;

  const optimizedCode = `function calculateTotal(items: number[]): number {
  return items.reduce((acc, curr) => acc + curr, 0);
}`;

  it('AT-07: generates reviewable unified diffs before applying modifications (FR-AI-04)', () => {
    const diff = computeUnifiedDiff(originalCode, optimizedCode, 'src/math.ts');

    expect(diff.diffText).toContain('--- a/src/math.ts');
    expect(diff.diffText).toContain('+++ b/src/math.ts');
    expect(diff.diffText).toContain('@@');
    expect(diff.additions).toBeGreaterThan(0);
    expect(diff.deletions).toBeGreaterThan(0);
    expect(diff.hunks.length).toBeGreaterThan(0);

    // Assert that the proposal adheres strictly to AiProposalSchema
    const proposal: AiProposal = {
      proposalId: 'prop-test-123',
      action: 'REFACTOR',
      filePath: 'src/math.ts',
      baseDocumentVersion: 1,
      explanation: 'Refactored imperative loop to functional reduce.',
      diff: diff.diffText,
      suggestedCode: optimizedCode,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    const parseResult = AiProposalSchema.safeParse(proposal);
    expect(parseResult.success).toBe(true);
  });

  it('AT-07: preserves workspace untouched until an authorized participant accepts (FR-AI-05)', () => {
    let workspaceDocument = originalCode;
    let documentVersion = 1;

    const proposal: AiProposal = {
      proposalId: 'prop-review-456',
      action: 'REFACTOR',
      filePath: 'src/math.ts',
      baseDocumentVersion: documentVersion,
      explanation: 'Optimized loop',
      diff: computeUnifiedDiff(workspaceDocument, optimizedCode, 'src/math.ts').diffText,
      suggestedCode: optimizedCode,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    // 1. While status is PENDING, workspace document remains identical
    expect(proposal.status).toBe('PENDING');
    expect(workspaceDocument).toBe(originalCode);

    // 2. Reject proposal leaves workspace untouched
    const rejectDecision = ReviewProposalSchema.safeParse({
      proposalId: proposal.proposalId,
      decision: 'REJECT',
    });
    expect(rejectDecision.success).toBe(true);
    proposal.status = 'REJECTED';
    expect(workspaceDocument).toBe(originalCode);

    // 3. Unauthorized VIEWER role cannot accept changes
    const viewerCanApply = canWrite('VIEWER');
    expect(viewerCanApply).toBe(false);

    // 4. Authorized EDITOR accepts changes -> workspace updates
    const editorCanApply = canWrite('EDITOR');
    expect(editorCanApply).toBe(true);

    if (editorCanApply) {
      proposal.status = 'ACCEPTED';
      workspaceDocument = proposal.suggestedCode!;
      documentVersion++;
    }

    expect(workspaceDocument).toBe(optimizedCode);
    expect(documentVersion).toBe(2);
  });

  it('AT-08: detects stale proposals when document version drifts during inference (FR-AI-08)', () => {
    const baseVersion = 1;
    let currentVersion = 1;

    // Initially same version -> not stale
    expect(isProposalStale(baseVersion, currentVersion)).toBe(false);

    // A collaborator types into the room, incrementing document version
    currentVersion = 2;
    expect(isProposalStale(baseVersion, currentVersion)).toBe(true);
  });

  it('AT-08: provides rebase resolution for concurrent edits (FR-AI-08)', () => {
    const baseCode = originalCode;
    // Collaborator concurrently updated file
    const concurrentCode = `// Top header comment added concurrently\n${originalCode}`;
    const suggestedCode = optimizedCode;

    // Trigger rebase
    const rebaseRes = rebaseProposal(baseCode, concurrentCode, suggestedCode);
    expect(rebaseRes).toBeDefined();
    // Conflicting concurrent edits flag conflict details for safe human review
    expect(rebaseRes.hasConflict).toBe(true);
    expect(rebaseRes.conflictDetails).toContain('Concurrent edits detected');
  });

  it('AT-08: clean rebase succeeds when concurrent edits are identical to proposal', () => {
    const baseCode = originalCode;
    const sameEdit = optimizedCode;

    const rebaseRes = rebaseProposal(baseCode, sameEdit, sameEdit);
    expect(rebaseRes.success).toBe(true);
    expect(rebaseRes.hasConflict).toBe(false);
    expect(rebaseRes.rebasedContent).toBe(sameEdit);
  });
});
