'use client';

import React from 'react';
import { Sparkles, AlertTriangle, Loader2 } from 'lucide-react';
import type { ExecutionStatus } from '@pairly/contracts';

export interface TerminalActionsProps {
  exitCode: number | null;
  status: ExecutionStatus | 'IDLE';
  terminalOutput: string;
  onExplainAndFix: () => void;
  isLoading?: boolean;
  className?: string;
}

export function TerminalActions({
  exitCode,
  status,
  terminalOutput,
  onExplainAndFix,
  isLoading = false,
  className = '',
}: TerminalActionsProps) {
  const isEligibleError =
    (exitCode !== null && exitCode !== 0) ||
    status === 'FAILED' ||
    status === 'TIMEOUT' ||
    status === 'OOM_KILLED';

  if (!isEligibleError) return null;

  return (
    <div
      data-testid="terminal-actions-bar"
      className={`flex items-center justify-between border-t border-rose-900/40 bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-950 px-3 py-1.5 text-xs ${className}`}
    >
      <div className="flex items-center gap-2 truncate">
        <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0 animate-pulse" />
        <span className="font-semibold text-rose-300">
          Execution terminated with error (exit {exitCode ?? 1})
        </span>
        <span className="hidden sm:inline text-slate-400 text-[11px] truncate">
          • Non-zero exit code detected. Use AI to inspect stack trace and generate patch.
        </span>
      </div>

      <button
        type="button"
        data-testid="explain-and-fix-btn"
        disabled={isLoading}
        onClick={onExplainAndFix}
        title="Analyze execution stack trace and propose reviewable diff patch (FR-AI-09)"
        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1 font-bold text-white shadow-md hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0 ml-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Diagnosing...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Explain and Fix</span>
          </>
        )}
      </button>
    </div>
  );
}
