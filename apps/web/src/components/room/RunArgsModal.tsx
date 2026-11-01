'use client';

import React, { useState } from 'react';
import { X, Play, Terminal, SlidersHorizontal, RotateCcw, HelpCircle } from 'lucide-react';

export interface RunArgsModalProps {
  isOpen: boolean;
  onClose: () => void;
  args: string[];
  stdin: string;
  onSave: (args: string[], stdin: string) => void;
  onRunWithArgs?: (args: string[], stdin: string) => void;
}

/**
 * Interactive Execution Arguments and Standard Input modal.
 * Directly aligned with CodeX's ArgsInputPopover component.
 * Allows users to provide CLI arguments (sys.argv, process.argv) and standard input (stdin).
 */
export function RunArgsModal({
  isOpen,
  onClose,
  args,
  stdin,
  onSave,
  onRunWithArgs,
}: RunArgsModalProps) {
  const [argsInput, setArgsInput] = useState(args.join(' '));
  const [stdinInput, setStdinInput] = useState(stdin);

  if (!isOpen) return null;

  const parseArgs = (raw: string): string[] => {
    // Support space-separated or line-separated arguments, trimming empty entries
    return raw
      .split(/\r?\n|\s+/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
  };

  const handleApply = () => {
    const parsed = parseArgs(argsInput);
    onSave(parsed, stdinInput);
    onClose();
  };

  const handleRunWithCurrent = () => {
    const parsed = parseArgs(argsInput);
    onSave(parsed, stdinInput);
    if (onRunWithArgs) {
      onRunWithArgs(parsed, stdinInput);
    }
    onClose();
  };

  const handleClearAll = () => {
    setArgsInput('');
    setStdinInput('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="run-args-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Execution Arguments & Stdin
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure CLI arguments and piped standard input (CodeX Parity)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close run arguments modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-5 space-y-4 text-xs">
          {/* Program CLI Arguments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="cli-args-input"
                className="font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Program Arguments (CLI args)</span>
              </label>
              {argsInput && (
                <button
                  type="button"
                  onClick={() => setArgsInput('')}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear args
                </button>
              )}
            </div>
            <input
              id="cli-args-input"
              data-testid="cli-args-input"
              type="text"
              value={argsInput}
              onChange={(e) => setArgsInput(e.target.value)}
              placeholder="e.g. --port 8080 --verbose debug input.csv"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#FF0000]"
            />
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 inline" />
              Passed as argv / command-line flags to your script entry point.
            </p>
          </div>

          {/* Standard Input (stdin) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="stdin-input"
                className="font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <span>Standard Input (stdin)</span>
              </label>
              {stdinInput && (
                <button
                  type="button"
                  onClick={() => setStdinInput('')}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear stdin
                </button>
              )}
            </div>
            <textarea
              id="stdin-input"
              data-testid="stdin-input"
              rows={4}
              value={stdinInput}
              onChange={(e) => setStdinInput(e.target.value)}
              placeholder="Text piped directly into stdin for programs that read input()..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#FF0000] resize-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Interactive input fed into your program during execution.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              data-testid="save-run-args-btn"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700"
            >
              Save Configuration
            </button>
            <button
              type="button"
              onClick={handleRunWithCurrent}
              data-testid="run-with-args-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#e60000] text-xs font-bold text-white transition-colors shadow-sm"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run with Args</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
