'use client';

import React from 'react';
import { Terminal, Users, Cpu, ShieldCheck, ArrowDown } from 'lucide-react';
import { RoomAccessForm } from './RoomAccessForm';

export interface HeroSectionProps {
  initialRoomId?: string;
}

export function HeroSection({ initialRoomId }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200 dark:border-slate-800/80">
      {/* Subtle Technical Grid Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-Time CRDT Sync • Isolated Sandboxes • Peer Audio</span>
        </div>

        {/* Distinctive Hero Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
          The real-time collaborative IDE for engineering teams
        </h1>

        {/* Concrete Description */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Zero local setup required. Share an unguessable link, pair in real time with sub-50ms
          conflict-free sync, execute code in 20+ isolated language sandboxes, and export clean commits to GitHub.
        </p>

        {/* Room Access Form */}
        <div className="mt-8">
          <RoomAccessForm initialRoomId={initialRoomId} />
        </div>

        {/* Concrete Architecture Metrics */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Sync SLA</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">&lt; 50ms</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Yjs state vector convergence</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Terminal className="w-4 h-4" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Languages</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">20+ Supported</div>
            <div className="text-[11px] text-slate-500 mt-0.5">TypeScript, Python, Rust, Go, C++</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Setup Friction</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">Zero Installs</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Instant guest workspace lifecycle</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">Security</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">Quarantined</div>
            <div className="text-[11px] text-slate-500 mt-0.5">10s timeout, memory caps, RBAC</div>
          </div>
        </div>

        {/* Scroll cue to Interactive Demo */}
        <div className="mt-8">
          <a
            href="#demo"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            <span>Explore the interactive product tour below</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
