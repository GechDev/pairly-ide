'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Code2, Monitor, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface CodeSnippet {
  filename: string;
  language: string;
  badge: string;
  code: string[];
  output: string[];
  highlightLine?: number;
}

const SNIPPETS: Record<string, CodeSnippet> = {
  'index.ts': {
    filename: 'index.ts',
    language: 'TypeScript',
    badge: 'TS',
    code: [
      "import { createRoom, syncCRDT } from '@pairly/core';",
      '',
      '// Initialize real-time collaborative room',
      'const room = await createRoom({',
      '  code: "ALPHA-SYNC",',
      '  mode: "COLLABORATIVE",',
      '  persistence: "POSTGRES_CHECKPOINT"',
      '});',
      '',
      'room.on("peer:join", (peer) => {',
      '  console.log(`Connected: ${peer.displayName}`);',
      '});',
      '',
      'export default room;',
    ],
    output: [
      '$ bun run index.ts',
      '[PAIRLY] Coordinator established via WSS',
      '[PAIRLY] Yjs state vector initialized: 1.4 KB',
      '[PAIRLY] Connected: Sarah (HOST)',
      '[PAIRLY] Connected: David (EDITOR)',
      '✓ Execution complete in 38ms (exit code 0)',
    ],
    highlightLine: 3,
  },
  'matrix.py': {
    filename: 'matrix.py',
    language: 'Python',
    badge: 'PY',
    code: [
      'import numpy as np',
      '',
      'def pairwise_distances(matrix: np.ndarray):',
      '    """Compute Euclidean distances in sandbox."""',
      '    diffs = matrix[:, np.newaxis] - matrix[np.newaxis]',
      '    return np.sqrt(np.sum(diffs ** 2, axis=-1))',
      '',
      'samples = np.random.randn(50, 8)',
      'distances = pairwise_distances(samples)',
      'print(f"Matrix shape: {distances.shape}")',
    ],
    output: [
      '$ python3 matrix.py',
      'Loading NumPy v1.26.4...',
      'Matrix shape: (50, 50)',
      'Memory footprint: 14.8 MB / 256 MB limit',
      '✓ Execution complete in 84ms (exit code 0)',
    ],
    highlightLine: 2,
  },
  'counter.rs': {
    filename: 'counter.rs',
    language: 'Rust',
    badge: 'RS',
    code: [
      'use std::sync::atomic::{AtomicUsize, Ordering};',
      '',
      'static PEER_COUNT: AtomicUsize = AtomicUsize::new(2);',
      '',
      'fn main() {',
      '    let peers = PEER_COUNT.load(Ordering::SeqCst);',
      '    println!(',
      '        "Pairly: {} peers active.",',
      '        peers',
      '    );',
      '}',
    ],
    output: [
      '$ rustc counter.rs && ./counter',
      'Compiling with rustc 1.78.0...',
      'Pairly: 2 peers active.',
      'Binary: 312 KB • Memory: 4.1 MB',
      '✓ Execution complete in 122ms (exit code 0)',
    ],
    highlightLine: 5,
  },
};

type SnippetKey = 'index.ts' | 'matrix.py' | 'counter.rs';

/* Syntax colouring */
function colourLine(line: string): React.ReactNode {
  if (!line) return <>&nbsp;</>;

  // Comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('"""'))
    return <span className="text-[#5c5651] italic">{line}</span>;
  // Keywords
  if (/^(import|export|const|let|from|use|fn|pub|static|async|await|def|return)/.test(line.trim()))
    return <span className="text-[#c084fc]">{line}</span>;
  // String assignment or structural
  if (line.trim().startsWith('room.') || line.trim().startsWith('samples') || line.trim().startsWith('distances') || line.trim().startsWith('println'))
    return <span className="text-[#5b9cf6]">{line}</span>;

  return <span>{line}</span>;
}

export function InteractiveProductDemo() {
  const [activeTab, setActiveTab] = useState<SnippetKey>('index.ts');
  const [activeView, setActiveView] = useState<'terminal' | 'preview'>('terminal');
  const [isRunning, setIsRunning] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(true);

  const sectionRef = useRef<HTMLElement>(null);

  const snippet = SNIPPETS[activeTab];

  const handleRun = () => {
    setIsRunning(true);
    setHasExecuted(false);
    setTimeout(() => {
      setIsRunning(false);
      setHasExecuted(true);
      setActiveView('terminal');
    }, 600);
  };

  /* Reveal animation */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-visible');
        });
      },
      { rootMargin: '0px 0px -100px 0px' }
    );
    const el = sectionRef.current;
    if (el) {
      el.querySelectorAll('.reveal').forEach((r) => observer.observe(r));
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="py-[clamp(5rem,10vw,9rem)] bg-[#111114] relative"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.06]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Header */}
        <div className="max-w-3xl mb-14">

          <h2 className="reveal text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold tracking-[-0.03em] leading-[1.05] text-[#f0ede8]">
            See Pairly in action.
          </h2>
          <p className="reveal mt-4 text-[15px] text-[#a09a92] leading-[1.65] max-w-[52ch] font-[380]">
            Switch files, trigger sandbox execution, and watch remote cursor
            tracking — all inside the actual interface.
          </p>
        </div>

        {/* IDE Window */}
        <div className="reveal rounded-2xl border border-white/[0.08] bg-[#0a0a0b] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.7)] max-w-5xl">

          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#111114] border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5 mr-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="font-mono text-[11px] text-[#5c5651] hidden sm:block">
                pairly-workspace / room: UK74-ZTWC
              </span>
            </div>

            {/* Peer indicator */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                <div className="w-[22px] h-[22px] rounded-full bg-[#FF0000] text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-[#0a0a0b]">S</div>
                <div className="w-[22px] h-[22px] rounded-full bg-[#5b9cf6] text-white flex items-center justify-center text-[9px] font-bold ring-2 ring-[#0a0a0b]">D</div>
              </div>
              <span className="font-mono text-[11px] text-[#FF0000] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-pulse-dot" />
                2 peers
              </span>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex items-center justify-between bg-[#111114]/80 border-b border-white/[0.06] px-2 overflow-x-auto">
            <div className="flex items-center gap-1 py-1.5">
              {(Object.keys(SNIPPETS) as SnippetKey[]).map((key) => {
                const isActive = activeTab === key;
                const s = SNIPPETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setActiveTab(key); setHasExecuted(true); }}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-mono transition-all duration-150
                      ${isActive
                        ? 'bg-[#18181c] text-[#f0ede8] border border-white/[0.1]'
                        : 'text-[#5c5651] hover:text-[#a09a92] hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    <Code2 className={`w-3 h-3 ${isActive ? 'text-[#FF0000]' : 'text-[#5c5651]'}`} />
                    {key}
                  </button>
                );
              })}
            </div>

            {/* Run button */}
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="
                flex items-center gap-1.5 mx-2 px-3 py-1.5 rounded-md
                bg-[#FF0000] hover:bg-[#e60000] text-white
                text-[12px] font-bold font-mono
                transition-all duration-150 btn-press
                disabled:opacity-50 shrink-0
              "
            >
              {isRunning ? (
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>{isRunning ? 'Running…' : 'Run Code'}</span>
            </button>
          </div>

          {/* Editor body */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">

            {/* Code pane */}
            <div className="lg:col-span-7 bg-[#0a0a0b] overflow-x-auto">
              <div className="p-5 font-mono text-[13px] leading-[1.7] text-[#a09a92] min-h-[280px]">
                {snippet.code.map((line, idx) => {
                  const isHighlight = idx === snippet.highlightLine;
                  return (
                    <div
                      key={idx}
                      className={`flex gap-4 -mx-5 px-5 ${isHighlight ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'} transition-colors`}
                    >
                      <span className="text-[#5c5651] select-none w-6 shrink-0 text-right text-[11px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="break-all">
                        {isHighlight ? (
                          <span className="relative">
                            {colourLine(line)}
                            {/* Remote cursor */}
                            <span className="inline-block relative ml-0.5">
                              <span className="w-0.5 h-[14px] bg-[#5b9cf6] inline-block align-middle animate-cursor-blink" />
                              <span className="absolute -top-5 left-0 text-[9px] font-mono bg-[#5b9cf6] text-white px-1 py-0.5 rounded-sm whitespace-nowrap shadow-sm">
                                David
                              </span>
                            </span>
                          </span>
                        ) : colourLine(line)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Output pane */}
            <div className="lg:col-span-5 flex flex-col bg-[#0c0c0e]">

              {/* Pane switcher */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#111114]/50">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveView('terminal')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono transition-colors ${
                      activeView === 'terminal'
                        ? 'bg-[#18181c] text-[#FF0000] border border-white/[0.08]'
                        : 'text-[#5c5651] hover:text-[#a09a92]'
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    Terminal
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('preview')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono transition-colors ${
                      activeView === 'preview'
                        ? 'bg-[#18181c] text-[#FF0000] border border-white/[0.08]'
                        : 'text-[#5c5651] hover:text-[#a09a92]'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    Preview
                  </button>
                </div>
                <span className="text-[10px] font-mono text-[#5c5651] uppercase tracking-wider">
                  {snippet.language}
                </span>
              </div>

              {/* Terminal content */}
              {activeView === 'terminal' ? (
                <div className="p-4 font-mono text-[12px] leading-[1.8] flex-1 min-h-[200px] overflow-y-auto">
                  {isRunning ? (
                    <div className="flex items-center gap-2 text-[#FF0000]">
                      <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin shrink-0" />
                      <span>Transmitting to isolated runner…</span>
                    </div>
                  ) : hasExecuted ? (
                    snippet.output.map((line, i) => (
                      <div
                        key={i}
                        className={
                          line.startsWith('$') ? 'text-[#5b9cf6]' :
                          line.startsWith('✓') ? 'text-[#FF0000] border-t border-white/[0.05] mt-2 pt-2' :
                          'text-[#a09a92]'
                        }
                      >
                        {line}
                      </div>
                    ))
                  ) : (
                    <div className="text-[#5c5651]">Press &quot;Run&quot; to execute in isolated sandbox.</div>
                  )}
                </div>
              ) : (
                <div className="p-5 flex flex-col items-center justify-center text-center flex-1 min-h-[200px]">
                  <div className="rounded-xl border border-white/[0.08] bg-[#111114] p-4 max-w-[260px] w-full text-left shadow-card">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.06] text-[10px] font-mono text-[#5c5651]">
                      <span>Live Client Render</span>
                      <span className="text-[#FF0000]">320×240</span>
                    </div>
                    <div className="text-[12px] space-y-2">
                      <div className="font-bold text-[#f0ede8]">Active Session</div>
                      <p className="text-[11px] text-[#5c5651] leading-relaxed">
                        Room state synchronized. DOM updates instantly upon any peer's keystrokes.
                      </p>
                      <div className="pt-2">
                        <Link
                          href="/room/new"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FF0000] text-white text-[11px] font-bold hover:bg-[#e60000] transition-colors"
                        >
                          Open Workspace
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
