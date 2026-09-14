'use client';

import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';
import { RoomAccessForm } from './RoomAccessForm';

export interface HeroSectionProps {
  initialRoomId?: string;
}

export function HeroSection({ initialRoomId }: HeroSectionProps) {

  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
      {/* Subtle Technical Grid Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mb-8 transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Real-time CRDT sync • Isolated Multi-Language Runner</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
          Code together.{' '}
          <span className="text-emerald-500 dark:text-emerald-400">
            Instantly.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Browser-based collaborative development with zero setup. Share a link,
          pair in real time, run code in 20+ languages in isolated sandboxes, and
          review AI proposals together.
        </p>

        {/* Room Access Form (CodeX Inspired: Create Room or Join by ID) */}
        <div className="mt-10">
          <RoomAccessForm initialRoomId={initialRoomId} />
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          No credit card or registration required • Instant guest workspace
        </p>

        {/* IDE Preview Mockup */}
        <div className="mt-16 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden max-w-5xl mx-auto text-left backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs font-mono text-slate-400">
                room/pairly-demo-workspace • main.ts
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                3 online
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
            {/* Editor buffer */}
            <div className="md:col-span-8 p-6 font-mono text-sm leading-relaxed text-slate-300 overflow-x-auto">
              <div className="flex gap-4">
                <span className="text-slate-600 select-none text-right w-6">1</span>
                <span><span className="text-purple-400">import</span> &#123; createRoom, runSandbox &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">'@pairly/contracts'</span>;</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none text-right w-6">2</span>
                <span className="text-slate-500">// Collaborative real-time session initialized</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none text-right w-6">3</span>
                <span><span className="text-blue-400">export async function</span> <span className="text-amber-300">collaborate</span>() &#123;</span>
              </div>
              <div className="flex gap-4 bg-brand-500/10 -mx-6 px-6 border-l-2 border-brand-500">
                <span className="text-slate-600 select-none text-right w-6">4</span>
                <span>  <span className="text-blue-400">const</span> room = <span className="text-purple-400">await</span> <span className="text-amber-300">createRoom</span>(&#123; mode: <span className="text-emerald-400">'COLLABORATIVE'</span> &#125;);</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none text-right w-6">5</span>
                <span>  <span className="text-purple-400">return</span> room.start();</span>
              </div>
              <div className="flex gap-4">
                <span className="text-slate-600 select-none text-right w-6">6</span>
                <span>&#125;</span>
              </div>
            </div>

            {/* Live Terminal & AI Preview */}
            <div className="md:col-span-4 p-5 flex flex-col justify-between bg-slate-950/40 text-xs font-mono">
              <div>
                <div className="flex items-center gap-2 text-slate-400 font-semibold mb-3">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Shared Terminal</span>
                </div>
                <div className="text-emerald-400">$ bun run main.ts</div>
                <div className="text-slate-400 mt-1">✓ Room coordinator connected</div>
                <div className="text-slate-400">✓ Isolated runner ready (10s cap)</div>
                <div className="text-cyan-400 mt-1">Session: https://pairly.dev/room/k7m9</div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-indigo-300">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-400 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Proposal (Diff)</span>
                </div>
                <span>Suggesting safe async timeout handler...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
