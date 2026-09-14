import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, FileText, Database, Server } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Pairly Collaborative IDE',
  description:
    'Pairly IDE privacy policy detailing data practices, ephemeral room retention, and GDPR compliance.',
};

export default function PrivacyPage() {
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

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-[var(--fg-muted)] hover:text-[var(--accent-teal)] mb-10 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span>Back to Pairly Overview</span>
        </Link>

        <div className="flex items-start gap-4 mb-10 pb-8 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div
            className="p-3 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(255, 0, 0, 0.08)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              color: 'var(--accent-teal)',
            }}
          >
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--fg-primary)]">
              Privacy Policy
            </h1>
            <p className="text-xs text-[var(--fg-muted)] font-mono mt-1.5">
              Last updated: October 2026 • Effective immediately across all environments
            </p>
          </div>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-[var(--fg-secondary)]">
          <section
            className="p-6 rounded-2xl space-y-3"
            style={{
              backgroundColor: 'var(--canvas-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h2 className="text-base font-bold text-[var(--fg-primary)] flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[var(--accent-teal)]" />
              1. Overview and Core Philosophy
            </h2>
            <p>
              Pairly IDE is built for engineers and pair-programming teams. We believe in privacy by
              architecture: data is collected solely to power your real-time collaborative workspace,
              execute code safely in isolated runners, and facilitate peer-to-peer communication.
              We do not sell your personal data, track you across third-party websites, or use your
              private code to train public machine learning models.
            </p>
          </section>

          <section
            className="p-6 rounded-2xl space-y-3"
            style={{
              backgroundColor: 'var(--canvas-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h2 className="text-base font-bold text-[var(--fg-primary)] flex items-center gap-2.5">
              <Database className="w-4 h-4 text-[var(--accent-cyan)]" />
              2. Data We Process
            </h2>
            <ul className="list-disc pl-5 space-y-2.5">
              <li>
                <strong className="text-[var(--fg-primary)]">Guest Sessions:</strong> When joining as a guest, we generate an ephemeral
                identity (temporary identifier, display name, and avatar seed) stored only in your
                browser session storage. No registration or credit card is required.
              </li>
              <li>
                <strong className="text-[var(--fg-primary)]">Document Contents &amp; CRDT Updates:</strong> Code typed in Pairly rooms is
                synchronized through Yjs binary state vectors and transmitted over encrypted
                WebSockets (WSS). Snapshots and room checkpoints are persisted in encrypted database
                storage to enable session resumption.
              </li>
              <li>
                <strong className="text-[var(--fg-primary)]">Execution I/O:</strong> When you run code, execution payloads are processed
                within an isolated, sandboxed environment (capped by CPU, memory, and a 10-second timeout).
                Standard output and error streams are routed directly to participants and are not logged
                permanently.
              </li>
              <li>
                <strong className="text-[var(--fg-primary)]">Voice and Media Streams:</strong> Peer audio is negotiated via WebRTC.
                Audio streams travel directly between peers whenever possible. Pairly does not record,
                transcribe, or store real-time voice communications.
              </li>
            </ul>
          </section>

          <section
            className="p-6 rounded-2xl space-y-3"
            style={{
              backgroundColor: 'var(--canvas-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h2 className="text-base font-bold text-[var(--fg-primary)] flex items-center gap-2.5">
              <Server className="w-4 h-4 text-[var(--accent-teal)]" />
              3. Data Retention and Lifecycle
            </h2>
            <p>
              Guest rooms that experience 7 consecutive days of inactivity are automatically purged
              along with all associated document checkpoints and file buffers. Registered account
              holders may explicitly delete rooms at any time from their workspace controls.
            </p>
          </section>

          <section
            className="p-6 rounded-2xl space-y-3"
            style={{
              backgroundColor: 'var(--canvas-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h2 className="text-base font-bold text-[var(--fg-primary)] flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-[var(--accent-cyan)]" />
              4. User Rights and GDPR / CCPA Compliance
            </h2>
            <p>
              Under global data protection regulations including GDPR and CCPA, you have full control
              over your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-[var(--fg-primary)]">Right to Export:</strong> Download a complete JSON archive of your account
                records and hosted workspaces at any time via{' '}
                <Link href="/settings" className="text-[var(--accent-teal)] underline underline-offset-4">
                  Account Settings
                </Link>.
              </li>
              <li>
                <strong className="text-[var(--fg-primary)]">Right to Erasure:</strong> Trigger immediate, irreversible account deletion
                which cascade-deletes all associated profile information and room records.
              </li>
              <li>
                <strong className="text-[var(--fg-primary)]">Data Inquiries:</strong> Contact our engineering team at{' '}
                <a href="mailto:privacy@pairly.dev" className="text-[var(--accent-teal)] underline underline-offset-4">
                  privacy@pairly.dev
                </a>{' '}
                for all privacy requests.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
