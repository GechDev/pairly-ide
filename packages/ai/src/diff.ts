/**
 * Unified Diff Computation and Stale Version Rebase Engine
 * Per SRS FR-AI-04, FR-AI-08, AT-07, and AT-08.
 */

export interface DiffLine {
  type: 'add' | 'delete' | 'unchanged' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface UnifiedDiffResult {
  diffText: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

/**
 * Standard Longest Common Subsequence (LCS) line diff algorithm.
 */
export function computeUnifiedDiff(
  oldText: string,
  newText: string,
  filePath: string = 'file',
): UnifiedDiffResult {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];

  // Compute LCS matrix using flat Uint32Array for high performance & safe access
  const m = oldLines.length;
  const n = newLines.length;
  const stride = n + 1;
  const dp = new Uint32Array((m + 1) * (n + 1));

  const getDp = (r: number, c: number): number => dp[r * stride + c] ?? 0;
  const setDp = (r: number, c: number, val: number): void => {
    dp[r * stride + c] = val;
  };

  for (let i = 1; i <= m; i++) {
    const oldLine = oldLines[i - 1];
    for (let j = 1; j <= n; j++) {
      const newLine = newLines[j - 1];
      if (oldLine === newLine) {
        setDp(i, j, getDp(i - 1, j - 1) + 1);
      } else {
        setDp(i, j, Math.max(getDp(i - 1, j), getDp(i, j - 1)));
      }
    }
  }

  // Backtrack to get edit script
  const edits: { type: 'add' | 'delete' | 'unchanged'; oldLine?: string; newLine?: string }[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    const oldLine = i > 0 ? oldLines[i - 1] : undefined;
    const newLine = j > 0 ? newLines[j - 1] : undefined;

    if (i > 0 && j > 0 && oldLine === newLine) {
      edits.unshift({ type: 'unchanged', oldLine, newLine });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || getDp(i, j - 1) >= getDp(i - 1, j))) {
      edits.unshift({ type: 'add', newLine });
      j--;
    } else if (i > 0 && (j === 0 || getDp(i, j - 1) < getDp(i - 1, j))) {
      edits.unshift({ type: 'delete', oldLine });
      i--;
    }
  }

  // Build diff lines with line numbers
  let oldNum = 1;
  let newNum = 1;
  let additions = 0;
  let deletions = 0;
  const diffLines: DiffLine[] = [];

  for (const edit of edits) {
    if (edit.type === 'unchanged') {
      diffLines.push({
        type: 'unchanged',
        content: ` ${edit.oldLine}`,
        oldLineNumber: oldNum++,
        newLineNumber: newNum++,
      });
    } else if (edit.type === 'delete') {
      deletions++;
      diffLines.push({
        type: 'delete',
        content: `-${edit.oldLine}`,
        oldLineNumber: oldNum++,
      });
    } else if (edit.type === 'add') {
      additions++;
      diffLines.push({
        type: 'add',
        content: `+${edit.newLine}`,
        newLineNumber: newNum++,
      });
    }
  }

  const header = `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${m} +1,${n} @@`;
  const rawDiff = [header, ...diffLines.map((l) => l.content)].join('\n');

  const hunk: DiffHunk = {
    header: `@@ -1,${m} +1,${n} @@`,
    lines: diffLines,
  };

  return {
    diffText: rawDiff,
    hunks: [hunk],
    additions,
    deletions,
  };
}

/**
 * Detect if base version has drifted (FR-AI-08).
 */
export function isProposalStale(
  baseVersion: number | string,
  currentVersion: number | string,
): boolean {
  return String(baseVersion) !== String(currentVersion);
}

export interface RebaseResult {
  success: boolean;
  rebasedContent: string;
  hasConflict: boolean;
  conflictDetails?: string;
}

/**
 * 3-Way Rebase of AI Proposal against Concurrent Edits (AT-08, FR-AI-08).
 */
export function rebaseProposal(
  baseContent: string,
  currentContent: string,
  suggestedContent: string,
): RebaseResult {
  // If no concurrent edits occurred, cleanly return suggested
  if (baseContent === currentContent) {
    return {
      success: true,
      rebasedContent: suggestedContent,
      hasConflict: false,
    };
  }

  // If user concurrently made the exact same edits as AI
  if (currentContent === suggestedContent) {
    return {
      success: true,
      rebasedContent: currentContent,
      hasConflict: false,
    };
  }

  const baseLines = baseContent.split('\n');
  const currLines = currentContent.split('\n');
  const aiLines = suggestedContent.split('\n');

  // Simple clean merge heuristic:
  // If concurrent user change is on different lines than AI proposal change
  const userChangedBase = baseLines.length !== currLines.length || baseLines.some((l, idx) => l !== currLines[idx]);
  const aiChangedBase = baseLines.length !== aiLines.length || baseLines.some((l, idx) => l !== aiLines[idx]);

  if (userChangedBase && aiChangedBase) {
    // Check if the file was modified in conflicting ways
    return {
      success: false,
      rebasedContent: currentContent,
      hasConflict: true,
      conflictDetails: 'Concurrent edits detected between proposal generation and review. Manual review required.',
    };
  }

  return {
    success: true,
    rebasedContent: suggestedContent,
    hasConflict: false,
  };
}
