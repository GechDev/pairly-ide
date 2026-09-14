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
  Terminal,
  Play,
  Share2,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation — Pairly IDE Architecture and Developer Guide',
  description:
    'Comprehensive developer guide for Pairly IDE covering CRDT sync, sandboxed code execution, role governance, and keyboard shortcuts.',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen text-[var(--fg-primary)]" style={{ backgroundColor: 'var(--canvas)' }}>
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255, 0, 0, 0.08), transparent 70%)',
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--accent-teal)] mb-10 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Pairly Overview</span>
        </Link>

        {/* Page Title */}
        <div className="flex items-start gap-4 mb-10 pb-8 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div
            className="p-3 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(255, 0, 0, 0.08)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              color: 'var(--accent-teal)',
            }}
          >
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--fg-primary)]">
              Pairly IDE Documentation
            </h1>
            <p className="text-sm text-[var(--fg-secondary)] mt-1.5 font-sans">
              Distributed synchronization architecture, Piston sandbox lifecycle, and peer protocol documentation.
            </p>
          </div>
        </div>

        {/* Quick Nav Anchor Pills */}
        <div className="flex flex-wrap gap-2 mb-12">
          {[
            { href: '#quickstart', label: '#quickstart' },
            { href: '#architecture', label: '#architecture' },
            { href: '#crdt', label: '#crdt-sync' },
            { href: '#sandbox', label: '#sandbox-runner' },
            { href: '#rbac', label: '#rbac-governance' },
            { href: '#shortcuts', label: '#keyboard-shortcuts' },
          ].map((pill) => (
            <a
              key={pill.href}
              href={pill.href}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all hover:border-[var(--accent-teal)]"
              style={{
                backgroundColor: 'var(--canvas-subtle)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--fg-secondary)',
              }}
            >
              {pill.label}
            </a>
          ))}
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {/* Quickstart */}
          <section id="quickstart" className="scroll-mt-24 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-[var(--fg-primary)]">
              <Play className="w-5 h-5 text-[var(--accent-teal)]" />
              1. Instant Quick Start
            </h2>
            <p className="text-sm leading-relaxed text-[var(--fg-secondary)]">
              Pairly IDE requires no local runtime installation, zero client extensions, and zero container setup. You can initiate a fully functional multi-user sandbox session in seconds:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div
                className="p-5 rounded-2xl transition-all"
                style={{
                  backgroundColor: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="text-[var(--accent-teal)] font-bold text-xs mb-2">01 / PROVISION</div>
                <div className="font-semibold text-sm text-[var(--fg-primary)] mb-1">Create Room</div>
                <div className="text-[var(--fg-muted)] font-sans leading-relaxed">
                  Click &ldquo;Start Coding Now&rdquo; to provision an unguessable nanoid room code with pre-configured templates.
                </div>
              </div>
              <div
                className="p-5 rounded-2xl transition-all"
                style={{
                  backgroundColor: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="text-[var(--accent-cyan)] font-bold text-xs mb-2">02 / INVITE</div>
                <div className="font-semibold text-sm text-[var(--fg-primary)] mb-1">Share Instant Link</div>
                <div className="text-[var(--fg-muted)] font-sans leading-relaxed">
                  Copy the room URL or QR code. Your pairing partner enters instantaneously with an ephemeral identity.
                </div>
              </div>
              <div
                className="p-5 rounded-2xl transition-all"
                style={{
                  backgroundColor: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div className="text-[var(--accent-teal)] font-bold text-xs mb-2">03 / COLLABORATE</div>
                <div className="font-semibold text-sm text-[var(--fg-primary)] mb-1">Pair &amp; Ship</div>
                <div className="text-[var(--fg-muted)] font-sans leading-relaxed">
                  Code together with sub-millisecond CRDT sync, execute in sandboxes, and export clean commits directly to GitHub.
                </div>
              </div>
            </div>
          </section>

          {/* Architecture */}
          <section id="architecture" className="scroll-mt-24 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-[var(--fg-primary)]">
              <Layers className="w-5 h-5 text-[var(--accent-cyan)]" />
              2. System Architecture
            </h2>
            <p className="text-sm leading-relaxed text-[var(--fg-secondary)]">
              Pairly IDE is designed around a high-performance distributed coordinator optimized for deterministic real-time state:
            </p>
            <div
              className="p-6 rounded-2xl font-mono text-xs space-y-3 overflow-x-auto"
              style={{
                backgroundColor: 'var(--canvas-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="text-[var(--accent-teal)] font-semibold">
                [Client Monaco / Web] &lt;---(Yjs WSS binary stream)&gt; [Fastify Realtime Coordinator]
              </div>
              <div className="pl-6 text-[var(--fg-secondary)] border-l" style={{ borderColor: 'var(--border-prominent)' }}>
                ├── <span className="text-[var(--fg-primary)] font-semibold">Redis Pub/Sub</span>: Cross-node message broadcasting and cursor awareness
              </div>
              <div className="pl-6 text-[var(--fg-secondary)] border-l" style={{ borderColor: 'var(--border-prominent)' }}>
                ├── <span className="text-[var(--fg-primary)] font-semibold">PostgreSQL</span>: Room metadata, user settings, and workspace checkpoints
              </div>
              <div className="pl-6 text-[var(--fg-secondary)] border-l" style={{ borderColor: 'var(--border-prominent)' }}>
                └── <span className="text-[var(--fg-primary)] font-semibold">Piston Sandbox API</span>: Multi-language containerized execution engine
              </div>
            </div>
          </section>

          {/* CRDT Sync */}
          <section id="crdt" className="scroll-mt-24 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-[var(--fg-primary)]">
              <Cpu className="w-5 h-5 text-[var(--accent-teal)]" />
              3. Conflict-Free CRDT Synchronization
            </h2>
            <p className="text-sm leading-relaxed text-[var(--fg-secondary)]">
              Concurrent edits are reconciled deterministically using Yjs state vectors. Every document in the virtual file tree maps to a distinct Y.Text structure. Even during high-frequency typing or transient network partitions, changes converge automatically with mathematical guarantees and zero lost keystrokes.
            </p>
          </section>

          {/* Sandbox Runner */}
          <section id="sandbox" className="scroll-mt-24 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-[var(--fg-primary)]">
              <Terminal className="w-5 h-5 text-[var(--accent-cyan)]" />
              4. Sandboxed Code Execution
            </h2>
            <p className="text-sm leading-relaxed text-[var(--fg-secondary)]">
              Code execution requests are dispatched to an isolated container runtime. The runner enforces strict operational constraints:
            </p>
            <div
              className="p-6 rounded-2xl space-y-3 text-sm text-[var(--fg-secondary)]"
              style={{
                backgroundColor: 'var(--canvas-subtle)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <ul className="space-y-2.5 list-disc pl-5">
                <li><strong className="text-[var(--fg-primary)]">Execution Timeout:</strong> 10-second hard ceiling per execution request with graceful SIGTERM termination.</li>
                <li><strong className="text-[var(--fg-primary)]">Memory Ceiling:</strong> Rigid cgroup memory limits per container preventing runaway memory consumption.</li>
                <li><strong className="text-[var(--fg-primary)]">Supported Languages:</strong> TypeScript, JavaScript, Python, Go, Rust, C++, Java, and Ruby.</li>
                <li><strong className="text-[var(--fg-primary)]">Interactive Terminal:</strong> Stdout and stderr stream directly back over WebSockets with live bidirectional stdin support.</li>
              </ul>
            </div>
          </section>

          {/* RBAC Governance */}
          <section id="rbac" className="scroll-mt-24 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-[var(--fg-primary)]">
              <ShieldCheck className="w-5 h-5 text-[var(--accent-teal)]" />
              5. Role-Based Access Governance
            </h2>
            <p className="text-sm leading-relaxed text-[var(--fg-secondary)]">
              Rooms enforce 4 discrete participant roles verified by the coordinator on every incoming message:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className="font-bold font-mono text-[var(--accent-teal)]">HOST</span>
                <p className="text-[var(--fg-secondary)] mt-1.5 font-sans leading-relaxed">
                  Full room authority: lock/unlock sessions, kick participants, grant permissions, mute microphones, and control checkpoint branching.
                </p>
              </div>
              <div
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className="font-bold font-mono text-[var(--accent-cyan)]">EDITOR</span>
                <p className="text-[var(--fg-secondary)] mt-1.5 font-sans leading-relaxed">
                  Read and write privileges to the document tree, execution permissions in the container sandbox, and whiteboard drawing.
                </p>
              </div>
              <div
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className="font-bold font-mono text-amber-400">COMMENTER</span>
                <p className="text-[var(--fg-secondary)] mt-1.5 font-sans leading-relaxed">
                  Can participate in chat, join peer voice channels, and view real-time cursor activity without editing permissions.
                </p>
              </div>
              <div
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: 'var(--canvas-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span className="font-bold font-mono text-[var(--fg-muted)]">VIEWER</span>
                <p className="text-[var(--fg-secondary)] mt-1.5 font-sans leading-relaxed">
                  Read-only presentation mode for live interviews, team broadcasts, and coding assessments.
                </p>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section id="shortcuts" className="scroll-mt-24 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2.5 text-[var(--fg-primary)]">
              <Command className="w-5 h-5 text-[var(--accent-teal)]" />
              6. Keyboard Shortcuts
            </h2>
            <div
              className="rounded-2xl overflow-hidden border text-xs"
              style={{
                borderColor: 'var(--border-subtle)',
                backgroundColor: 'var(--canvas-subtle)',
              }}
            >
              <table className="w-full text-left">
                <thead
                  className="font-mono text-[var(--fg-muted)] border-b"
                  style={{
                    backgroundColor: 'var(--canvas-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <tr>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Shortcut</th>
                    <th className="p-3.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono text-[var(--fg-secondary)]" style={{ borderColor: 'var(--border-subtle)' }}>
                  <tr>
                    <td className="p-3.5 font-semibold text-[var(--fg-primary)]">Command Palette</td>
                    <td className="p-3.5">
                      <kbd className="px-2 py-0.5 rounded text-[11px] bg-[var(--canvas-elevated)] border border-[var(--border-prominent)] text-[var(--fg-primary)]">
                        Ctrl / Cmd + K
                      </kbd>
                    </td>
                    <td className="p-3.5 font-sans">Open fuzzy searchable quick command palette.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[var(--fg-primary)]">Execute Code</td>
                    <td className="p-3.5">
                      <kbd className="px-2 py-0.5 rounded text-[11px] bg-[var(--canvas-elevated)] border border-[var(--border-prominent)] text-[var(--fg-primary)]">
                        Ctrl / Cmd + Enter
                      </kbd>
                    </td>
                    <td className="p-3.5 font-sans">Run active file in the sandboxed runtime.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[var(--fg-primary)]">Toggle Sidebar</td>
                    <td className="p-3.5">
                      <kbd className="px-2 py-0.5 rounded text-[11px] bg-[var(--canvas-elevated)] border border-[var(--border-prominent)] text-[var(--fg-primary)]">
                        Ctrl / Cmd + B
                      </kbd>
                    </td>
                    <td className="p-3.5 font-sans">Expand or collapse the file explorer and tools.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[var(--fg-primary)]">Toggle Terminal</td>
                    <td className="p-3.5">
                      <kbd className="px-2 py-0.5 rounded text-[11px] bg-[var(--canvas-elevated)] border border-[var(--border-prominent)] text-[var(--fg-primary)]">
                        Ctrl / Cmd + `
                      </kbd>
                    </td>
                    <td className="p-3.5 font-sans">Toggle shared execution terminal drawer.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[var(--fg-primary)]">Whiteboard Canvas</td>
                    <td className="p-3.5">
                      <kbd className="px-2 py-0.5 rounded text-[11px] bg-[var(--canvas-elevated)] border border-[var(--border-prominent)] text-[var(--fg-primary)]">
                        Toolbar Button
                      </kbd>
                    </td>
                    <td className="p-3.5 font-sans">Open collaborative vector whiteboard modal.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[var(--fg-primary)]">GitHub Export</td>
                    <td className="p-3.5">
                      <kbd className="px-2 py-0.5 rounded text-[11px] bg-[var(--canvas-elevated)] border border-[var(--border-prominent)] text-[var(--fg-primary)]">
                        Toolbar / Cmd+K
                      </kbd>
                    </td>
                    <td className="p-3.5 font-sans">Push current workspace files directly to GitHub.</td>
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
