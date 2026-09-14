'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Code2,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface CodeSnippet {
  filename: string;
  language: string;
  code: string[];
  output: string[];
}

const SNIPPETS: Record<'index.ts' | 'matrix.py' | 'counter.rs', CodeSnippet> = {
  'index.ts': {
    filename: 'index.ts',
    language: 'TypeScript',
    code: [
      'import { createRoom, syncCRDT } from "@pairly/core";',
      '',
      '// Initialize real-time collaborative room session',
      'const room = await createRoom({',
      '  code: "ALPHA-SYNC",',
      '  mode: "COLLABORATIVE",',
      '  persistence: "POSTGRES_CHECKPOINT"',
      '});',
      '',
      'room.on("peer:join", (peer) => {',
      '  console.log(`[PAIRLY] Connected: ${peer.displayName} (${peer.role})`);',
      '});',
      '',
      'export default room;',
    ],
    output: [
      '$ bun run index.ts',
      '[PAIRLY] Coordinator established via WSS',
      '[PAIRLY] Yjs binary state vector initialized: 1.4 KB',
      '[PAIRLY] Connected: Sarah (HOST)',
      '[PAIRLY] Connected: David (EDITOR)',
      '✓ Execution complete in 38ms (exit code 0)',
    ],
  },
  'matrix.py': {
    filename: 'matrix.py',
    language: 'Python',
    code: [
      'import numpy as np',
      'import time',
      '',
      'def compute_pairwise_distances(matrix: np.ndarray) -> np.ndarray:',
      '    """Compute Euclidean distances in isolated sandbox runtime."""',
      '    diffs = matrix[:, np.newaxis, :] - matrix[np.newaxis, :, :]',
      '    return np.sqrt(np.sum(diffs ** 2, axis=-1))',
      '',
      'samples = np.random.randn(50, 8)',
      'dist_matrix = compute_pairwise_distances(samples)',
      'print(f"Calculated 50x50 distance matrix: shape={dist_matrix.shape}")',
    ],
    output: [
      '$ python3 matrix.py',
      'Loading NumPy v1.26.4...',
      'Calculated 50x50 distance matrix: shape=(50, 50)',
      'Memory footprint: 14.8 MB (limit: 256 MB)',
      '✓ Execution complete in 84ms (exit code 0)',
    ],
  },
  'counter.rs': {
    filename: 'counter.rs',
    language: 'Rust',
    code: [
      'use std::sync::atomic::{AtomicUsize, Ordering};',
      '',
      'static PEER_COUNT: AtomicUsize = AtomicUsize::new(2);',
      '',
      'fn main() {',
      '    let current = PEER_COUNT.load(Ordering::SeqCst);',
      '    println!("Pairly Rust Runner: {} concurrent peers connected.", current);',
      '}',
    ],
    output: [
      '$ rustc counter.rs && ./counter',
      'Compiling with rustc 1.78.0-nightly...',
      'Pairly Rust Runner: 2 concurrent peers connected.',
      'Binary size: 312 KB • Memory: 4.1 MB',
      '✓ Execution complete in 122ms (exit code 0)',
    ],
  },
};

export function InteractiveProductDemo() {
  const [activeTab, setActiveTab] = useState<'index.ts' | 'matrix.py' | 'counter.rs'>('index.ts');
  const [activeBottomView, setActiveBottomView] = useState<'terminal' | 'preview'>('terminal');
  const [isRunning, setIsRunning] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(true);

  const currentSnippet = SNIPPETS[activeTab];

  const handleRun = () => {
    setIsRunning(true);
    setHasExecuted(false);
    setTimeout(() => {
      setIsRunning(false);
      setHasExecuted(true);
      setActiveBottomView('terminal');
    }, 450);
  };

  return (
    <section id="demo" className="py-20 bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-3">
            Interactive Product Tour
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            See Pairly in action
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Experience the actual interface: switch files, trigger sandbox execution, and preview
            collaborative remote cursor tracking.
          </p>
        </div>

        {/* IDE Window Container */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden max-w-5xl mx-auto">
          {/* Window Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="font-mono text-slate-400 hidden sm:inline-block">
                pairly-workspace / room: UK74-ZTWC
              </span>
            </div>

            {/* Simulated Peers Badge */}
            <div className="flex items-center gap-2">
              <div className="flex items-center -space-x-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[10px] ring-2 ring-slate-900">
                  S
                </div>
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-[10px] ring-2 ring-slate-900">
                  D
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                2 peers active
              </span>
            </div>
          </div>

          {/* File Tabs Bar */}
          <div className="flex items-center justify-between px-2 bg-slate-900/60 border-b border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-1 py-1">
              {(['index.ts', 'matrix.py', 'counter.rs'] as const).map((fileName) => {
                const isActive = activeTab === fileName;
                return (
                  <button
                    key={fileName}
                    type="button"
                    onClick={() => setActiveTab(fileName)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700/80 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{fileName}</span>
                  </button>
                );
              })}
            </div>

            {/* Run Button in Demo */}
            <div className="flex items-center gap-2 py-1">
              <button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            {/* Code lines */}
            <div className="lg:col-span-7 p-4 sm:p-5 font-mono text-xs sm:text-sm leading-relaxed text-slate-300 bg-slate-950/70 overflow-x-auto min-h-[260px]">
              {currentSnippet.code.map((line, idx) => (
                <div key={idx} className="flex gap-4 hover:bg-slate-900/40 -mx-4 sm:-mx-5 px-4 sm:px-5">
                  <span className="text-slate-600 select-none text-right w-6 shrink-0 text-xs">
                    {idx + 1}
                  </span>
                  <span className="break-all">
                    {line.includes('createRoom') || line.includes('compute_pairwise_distances') ? (
                      <span className="relative">
                        <span className="text-emerald-400">{line}</span>
                        {/* Simulated Remote Cursor */}
                        <span className="inline-block relative ml-0.5">
                          <span className="w-0.5 h-4 bg-indigo-400 inline-block align-middle animate-pulse" />
                          <span className="absolute -top-4 left-0 text-[9px] font-mono bg-indigo-600 text-white px-1 rounded-sm uppercase tracking-wider whitespace-nowrap shadow-sm">
                            David
                          </span>
                        </span>
                      </span>
                    ) : line.startsWith('import ') || line.startsWith('export ') || line.startsWith('def ') || line.startsWith('use ') ? (
                      <span className="text-purple-400">{line}</span>
                    ) : line.startsWith('//') || line.startsWith('"""') ? (
                      <span className="text-slate-500 italic">{line}</span>
                    ) : (
                      line
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Execution / Preview Pane */}
            <div className="lg:col-span-5 flex flex-col bg-slate-900/40">
              {/* Output Tab switcher */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/50 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveBottomView('terminal')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                      activeBottomView === 'terminal'
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Shared Terminal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveBottomView('preview')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                      activeBottomView === 'preview'
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>
                </div>

                <span className="text-[10px] text-slate-500 uppercase">
                  {currentSnippet.language}
                </span>
              </div>

              {/* Terminal View Content */}
              {activeBottomView === 'terminal' ? (
                <div className="p-4 font-mono text-xs text-slate-300 space-y-1.5 flex-1 overflow-y-auto min-h-[220px]">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-emerald-400 animate-pulse">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Transmitting payload to isolated runner sandbox...</span>
                    </div>
                  ) : hasExecuted ? (
                    currentSnippet.output.map((out, i) => (
                      <div
                        key={i}
                        className={
                          out.startsWith('$')
                            ? 'text-cyan-400 font-semibold'
                            : out.startsWith('✓')
                            ? 'text-emerald-400 font-semibold pt-1 border-t border-slate-800/80'
                            : 'text-slate-400'
                        }
                      >
                        {out}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600">Press &quot;Run Code&quot; to execute in isolated sandbox.</div>
                  )}
                </div>
              ) : (
                /* Live Preview Simulation */
                <div className="p-4 flex-1 flex flex-col justify-center items-center text-center bg-slate-950/60 min-h-[220px]">
                  <div className="p-4 rounded-xl border border-slate-800 bg-slate-900 max-w-xs w-full shadow-lg">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                      <span>Live Client Render</span>
                      <span className="text-emerald-400">320x240</span>
                    </div>
                    <div className="text-left text-xs space-y-2">
                      <div className="font-bold text-white">Active Collaboration Session</div>
                      <p className="text-[11px] text-slate-400">
                        Room state synchronized. Real-time DOM output updates instantly upon typing.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/room/new"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
                        >
                          <span>Open Live Workspace</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
