import {
  Server,
  Cpu,
  ShieldCheck,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';

export function ArchitectureSection() {
  return (
    <section id="architecture" className="py-24 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-3">
            System Architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Designed for deterministic collaboration
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Pairly combines state-vector CRDT mathematics with isolated backend container runners,
            providing instantaneous typing feedback alongside safe code execution.
          </p>
        </div>

        {/* 3 Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Tier 1: Client Edge */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Layer 01 • Client
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Yjs CRDT & Monaco Core
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Edits apply instantly to local Y.Doc structures before serializing into binary delta vectors.
              Remote cursors and selection ranges render with zero jitter.
            </p>
            <ul className="text-xs font-mono text-slate-500 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <li>• Monaco Editor integration</li>
              <li>• Smart bracket auto-close & indent</li>
              <li>• Low-latency vector updates</li>
            </ul>
          </div>

          {/* Tier 2: Realtime Coordinator */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Layer 02 • Coordinator
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Fastify & Redis Pub/Sub
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              High-throughput WebSocket gateway handling room lifecycles, role permissions, and Redis
              channel multiplexing across distributed coordinator instances.
            </p>
            <ul className="text-xs font-mono text-slate-500 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <li>• Host, Editor, Commenter RBAC</li>
              <li>• PostgreSQL snapshot checkpointing</li>
              <li>• Sub-50ms message broadcast</li>
            </ul>
          </div>

          {/* Tier 3: Isolated Sandboxes */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                Layer 03 • Runtime
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Container Sandboxing
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              User code runs in quarantined ephemeral containers with strict kernel memory caps,
              10-second timeouts, and isolated virtual interfaces.
            </p>
            <ul className="text-xs font-mono text-slate-500 space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <li>• 20+ execution languages</li>
              <li>• Interactive stdin/stdout streaming</li>
              <li>• Zero host network leakage</li>
            </ul>
          </div>
        </div>

        {/* Deep Dive Link Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Looking for technical specifications and protocol specs?
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Read our in-depth documentation on CRDT vectors, WebSocket frames, and sandbox containment.
              </div>
            </div>
          </div>
          <Link
            href="/docs#architecture"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            <span>Read Architecture Docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
