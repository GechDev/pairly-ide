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
    title: 'Multi-File CRDT Synchronization',
    description:
      'Concurrent document editing powered by Yjs. Typing propagates with sub-60ms latency, remote cursor markers, and automatic conflict convergence.',
  },
  {
    icon: Terminal,
    title: 'Sandboxed 20+ Language Execution',
    description:
      'Run Python, TypeScript, Rust, Go, C++, Java, and more in isolated ephemeral environments with 10s timeouts, 256MB memory caps, and zero network leakage.',
  },
  {
    icon: Sparkles,
    title: 'Reviewable AI Pair Programmer',
    description:
      'AI assistant proposes code modifications as reviewable diffs before applying changes, complete with stale base-version detection and transparent context.',
  },
  {
    icon: Users,
    title: 'Instant Guest Access',
    description:
      'Start a collaboration session with one click. Invite peers via unguessable short links with temporary identities—no registration required.',
  },
  {
    icon: ShieldCheck,
    title: 'Enforced Role-Based Access Control',
    description:
      'Configure Host, Editor, Commenter, and Viewer permissions on the server. Lock rooms and manage participants dynamically.',
  },
  {
    icon: Zap,
    title: 'Interactive Real-Time Terminal',
    description:
      'Stream stdout and stderr in real-time to all room members via xterm.js with support for interactive standard input.',
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-20 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold tracking-widest text-brand-600 dark:text-brand-400 uppercase">
            Platform Capabilities
          </h2>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            Everything your pairing workflow needs in one room
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Engineered to remove setup friction while guaranteeing strict sandbox isolation and verified real-time synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
