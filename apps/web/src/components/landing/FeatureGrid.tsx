import React from 'react';
import {
  Code,
  Terminal,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Code,
    category: 'CRDT ENGINE',
    title: 'Multi-File Document Sync',
    description:
      'Concurrent document editing powered by Yjs. Typing propagates with sub-60ms latency, remote cursor markers, and automatic conflict-free convergence.',
    badge: '< 60ms latency',
  },
  {
    icon: Terminal,
    category: 'ISOLATED RUNNER',
    title: 'Sandboxed 20+ Language Execution',
    description:
      'Execute Python, TypeScript, Rust, Go, C++, and Java in isolated environments with strict memory caps, 10s timeouts, and zero local network leakage.',
    badge: '20+ Languages',
  },
  {
    icon: Sparkles,
    category: 'AI PAIRING',
    title: 'Reviewable AI Diff Proposals',
    description:
      'AI assistant proposes code modifications as reviewable diffs before applying changes, complete with stale base-version detection and transparent context.',
    badge: 'Safe Reviews',
  },
  {
    icon: Users,
    category: 'COLLABORATION',
    title: 'Instant Guest Room Lifecycle',
    description:
      'Start a collaboration session with one click. Invite peers via unguessable short links with temporary identities—no registration required.',
    badge: 'Zero Setup',
  },
  {
    icon: ShieldCheck,
    category: 'AUTHORIZATION',
    title: 'Enforced Server-Side RBAC',
    description:
      'Configure Host, Editor, Commenter, and Viewer permissions on the coordinator. Lock rooms and manage participants dynamically.',
    badge: 'Server Guarded',
  },
  {
    icon: Zap,
    category: 'TERMINAL I/O',
    title: 'Interactive Real-Time Terminal',
    description:
      'Stream stdout and stderr in real time to all room members via xterm.js with support for interactive standard input during execution.',
    badge: 'Live Stdin',
  },
];

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="py-24 bg-slate-50/50 dark:bg-slate-900/20 border-y border-slate-200 dark:border-slate-800/80"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-3">
            Platform Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Engineered for high-bandwidth pairing
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Eliminates setup friction while guaranteeing strict sandbox isolation,
            deterministic CRDT convergence, and server-enforced authorization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative p-7 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-emerald-400 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {feature.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
                    {feature.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
