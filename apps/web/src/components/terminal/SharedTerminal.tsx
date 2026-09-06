'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { ExecutionOutputChunk, ExecutionStatus } from '@pairly/contracts';

export interface SharedTerminalProps {
  chunks: ExecutionOutputChunk[];
  status: ExecutionStatus | 'IDLE';
  exitCode: number | null;
  durationMs?: number;
  onSendStdin?: (data: string) => void;
  onClear?: () => void;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SharedTerminal({
  chunks,
  status,
  exitCode,
  durationMs,
  onSendStdin,
  onClear,
  onClose,
  isExpanded = true,
  onToggleExpand,
}: SharedTerminalProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems'>('terminal');
  const [stdinValue, setStdinValue] = useState('');
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Auto-scroll to bottom when new chunks arrive, unless user has scrolled up
  useEffect(() => {
    if (!userScrolledUp && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chunks, userScrolledUp]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setUserScrolledUp(!isAtBottom);
  };

  const handleStdinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdinValue.trim() || status !== 'RUNNING') return;

    if (onSendStdin) {
      onSendStdin(stdinValue + '\n');
    }
    setStdinValue('');
  };

  const handleCopy = async () => {
    const fullText = chunks.map((c) => c.data).join('');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div
      data-testid="shared-terminal"
      className="flex flex-col border-t border-slate-800 bg-slate-950 font-sans text-slate-200 select-none transition-all duration-200"
      style={{ height: isExpanded ? '260px' : '36px' }}
    >
      {/* Terminal Header Bar */}
      <div className="h-9 px-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
        {/* Left: Tab Switchers */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('output')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'output'
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Output</span>
          </button>

          <button
            onClick={() => setActiveTab('problems')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeTab === 'problems'
                ? 'bg-slate-800 text-brand-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Problems</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              0
            </span>
          </button>
        </div>

        {/* Center: Execution Status Badge */}
        <div className="hidden sm:flex items-center gap-2">
          {status === 'RUNNING' && (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Running...</span>
            </div>
          )}

          {status === 'COMPLETED' && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              <span>Finished (exit {exitCode ?? 0})</span>
            </div>
          )}

          {(status === 'FAILED' || status === 'TIMEOUT' || status === 'OOM_KILLED') && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-3 h-3" />
              <span>{status} (exit {exitCode ?? 1})</span>
            </div>
          )}

          {durationMs !== undefined && durationMs > 0 && (
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{durationMs}ms</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {onClear && (
            <button
              onClick={onClear}
              title="Clear terminal output"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy terminal output"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={isExpanded ? 'Collapse panel' : 'Expand panel'}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Close terminal"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Terminal Body */}
      {isExpanded && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          {/* Scrollable output container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed space-y-0.5 select-text"
          >
            {chunks.length === 0 ? (
              <div className="text-slate-600 select-none py-2">
                Press &quot;Run&quot; in the header toolbar to execute code in sandboxed runtime...
              </div>
            ) : (
              chunks.map((chunk, index) => {
                let streamClass = 'text-slate-300';
                if (chunk.stream === 'stderr') streamClass = 'text-rose-400 font-medium';
                if (chunk.stream === 'system') streamClass = 'text-brand-400/90 font-semibold';

                return (
                  <span
                    key={`${chunk.timestamp}-${index}`}
                    className={`whitespace-pre-wrap break-all ${streamClass}`}
                  >
                    {chunk.data}
                  </span>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>

          {/* Interactive Stdin Bar (FR-EXEC-03) */}
          <form
            onSubmit={handleStdinSubmit}
            className="h-8 px-3 border-t border-slate-900 bg-slate-950 flex items-center gap-2"
          >
            <span className="text-brand-500 font-mono text-xs font-bold select-none">❯</span>
            <input
              type="text"
              value={stdinValue}
              onChange={(e) => setStdinValue(e.target.value)}
              disabled={status !== 'RUNNING'}
              placeholder={
                status === 'RUNNING'
                  ? 'Interactive stdin: type input and press Enter...'
                  : 'Program is not running'
              }
              className="flex-1 bg-transparent font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-40"
            />
            {status === 'RUNNING' && (
              <button
                type="submit"
                disabled={!stdinValue.trim()}
                className="p-1 rounded text-brand-400 hover:text-brand-300 disabled:opacity-30 transition-colors"
                title="Send stdin"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
