import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ArrowLeft,
  Cpu,
  Layers,
  ShieldCheck,
  Command,
  GitBranch,
  Terminal,
  Play,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation: Architecture and Developer Guide',
  description:
    'Comprehensive developer guide for Pairly IDE covering CRDT sync, sandboxed code execution, role governance, and keyboard shortcuts.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Pairly IDE Documentation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              Architecture overview, technical specifications, and developer manual
            </p>
          </div>
        </div>

        {/* Quick Nav Anchor Pills */}
        <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
          <a
            href="#quickstart"
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors"
          >
            #quickstart
          </a>
          <a
            href="#architecture"
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors"
          >
            #architecture
          </a>
          <a
            href="#crdt"
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors"
          >
            #crdt-sync
          </a>
          <a
            href="#sandbox"
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors"
          >
            #sandbox-runner
          </a>
          <a
            href="#rbac"
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors"
          >
            #rbac-governance
          </a>
          <a
            href="#shortcuts"
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-colors"
          >
            #keyboard-shortcuts
          </a>
        </div>

        {/* Sections */}
        <div className="space-y-12">
          {/* Quickstart */}
          <section id="quickstart" className="scroll-mt-20 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-500" />
              1. Quick Start
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Pairly IDE requires no client-side setup or browser extensions. You can create an instant
              session in one click:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="text-emerald-500 font-bold mb-1">STEP 01</div>
                <div className="font-semibold text-slate-900 dark:text-white">Create Room</div>
                <div className="text-slate-500 mt-1">Click &quot;Start a room&quot; to provision an unguessable room code (e.g. ABCD-EFGH).</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="text-emerald-500 font-bold mb-1">STEP 02</div>
                <div className="font-semibold text-slate-900 dark:text-white">Share Link</div>
                <div className="text-slate-500 mt-1">Send the room link to your pairing partner. They join immediately with guest credentials.</div>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="text-emerald-500 font-bold mb-1">STEP 03</div>
                <div className="font-semibold text-slate-900 dark:text-white">Pair & Execute</div>
                <div className="text-slate-500 mt-1">Code together with remote cursors, run in sandboxes, and export clean commits to GitHub.</div>
              </div>
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="scroll-mt-20 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500" />
              2. System Architecture
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Pairly IDE is architected as a distributed collaborative system composed of three core services:
            </p>
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-3">
              <div className="text-slate-400">
                [Client Monaco / Web] &lt;---(Yjs WSS binary)&gt; [Fastify Realtime Coordinator]
              </div>
              <div className="pl-6 text-slate-400 border-l border-slate-700">
                ├── Redis Pub/Sub: Cross-node message broadcasting and presence awareness
              </div>
              <div className="pl-6 text-slate-400 border-l border-slate-700">
                ├── PostgreSQL: Room metadata, user settings, and workspace checkpoints
              </div>
              <div className="pl-6 text-slate-400 border-l border-slate-700">
                └── Piston Sandbox API: Multi-language containerized execution engine
              </div>
            </div>
          </section>

          {/* CRDT Sync */}
          <section id="crdt" className="scroll-mt-20 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-500" />
              3. Conflict-Free CRDT Synchronization
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Concurrent edits are reconciled deterministically using Yjs state vectors. Every document
              in the file tree corresponds to a distinct Y.Text structure. Even during high-frequency typing
              or transient network partitions, changes converge automatically with zero lost keystrokes.
            </p>
          </section>

          {/* Sandbox Runner */}
          <section id="sandbox" className="scroll-mt-20 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" />
              4. Sandboxed Code Execution
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Code execution requests are dispatched to an isolated container runtime. The runner enforces
              strict operational constraints:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1">
              <li><strong>Execution Timeout:</strong> 10 seconds hard timeout per execution request.</li>
              <li><strong>Memory Ceiling:</strong> Capped per container to prevent runaway memory usage.</li>
              <li><strong>Supported Languages:</strong> TypeScript, JavaScript, Python, Go, Rust, C++, Java, and Ruby.</li>
              <li><strong>Interactive Terminal:</strong> Stdout and stderr stream directly back over WebSockets with live stdin support.</li>
            </ul>
          </section>

          {/* RBAC Governance */}
          <section id="rbac" className="scroll-mt-20 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              5. Role-Based Access Governance
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Rooms support 4 discrete participant roles enforced on the coordinator:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-emerald-500">HOST</span>
                <p className="text-slate-500 mt-1">Full control: lock room, manage participant roles, mute peers, configure permissions.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-blue-400">EDITOR</span>
                <p className="text-slate-500 mt-1">Read and write access to files, execution privileges, and whiteboard drawing.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-amber-400">COMMENTER</span>
                <p className="text-slate-500 mt-1">Can participate in chat, audio channels, and view real-time cursor activity.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-400">VIEWER</span>
                <p className="text-slate-500 mt-1">Read-only observation mode for presentations and coding assessments.</p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section id="shortcuts" className="scroll-mt-20 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Command className="w-5 h-5 text-emerald-500" />
              6. Keyboard Shortcuts
            </h2>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-mono text-slate-500">
                  <tr>
                    <th className="p-3">Action</th>
                    <th className="p-3">Shortcut</th>
                    <th className="p-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  <tr>
                    <td className="p-3 font-semibold">Command Palette</td>
                    <td className="p-3"><kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Ctrl/Cmd + K</kbd></td>
                    <td className="p-3 font-sans">Open fuzzy searchable quick command palette.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Execute Code</td>
                    <td className="p-3"><kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Ctrl/Cmd + Enter</kbd></td>
                    <td className="p-3 font-sans">Run active file in the sandboxed runtime.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Toggle Sidebar</td>
                    <td className="p-3"><kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Ctrl/Cmd + B</kbd></td>
                    <td className="p-3 font-sans">Expand or collapse the file explorer and tools.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Toggle Terminal</td>
                    <td className="p-3"><kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Ctrl/Cmd + `</kbd></td>
                    <td className="p-3 font-sans">Toggle shared execution terminal drawer.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">Whiteboard Canvas</td>
                    <td className="p-3"><kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Toolbar Button</kbd></td>
                    <td className="p-3 font-sans">Open collaborative vector whiteboard modal.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold">GitHub Export</td>
                    <td className="p-3"><kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">Toolbar / Cmd+K</kbd></td>
                    <td className="p-3 font-sans">Push current workspace files directly to GitHub.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
