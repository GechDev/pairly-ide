'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Sparkles, Terminal } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleStartRoom = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.joinUrl) {
        if (data.guest) {
          sessionStorage.setItem(`pairly_guest_${data.room.code}`, JSON.stringify(data.guest));
        }
        if (data.token) {
          sessionStorage.setItem(`pairly_token_${data.room.code}`, data.token);
        }
        router.push(data.joinUrl);
        return;
      }
      router.push('/room/pair-demo');
    } catch {
      router.push('/room/pair-demo');
    }
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 dark:bg-brand-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[250px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mb-8 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Real-time CRDT sync + Sandboxed Multi-Language Runner</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-[1.1]">
          Code together.{' '}
          <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Instantly.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Browser-based collaborative development with zero setup. Share a link,
          pair in real time, run code in 20+ languages in isolated sandboxes, and
          review AI proposals together.
        </p>

        {/* Primary Call to Action Button (FR-UX-01) */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="hero-start-room-btn"
            data-testid="start-room-btn"
            onClick={handleStartRoom}
            disabled={isCreating}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all duration-200 group disabled:opacity-75 disabled:pointer-events-none"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating workspace...</span>
              </>
            ) : (
              <>
                <span>Start a room</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            Explore features
          </a>
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
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
