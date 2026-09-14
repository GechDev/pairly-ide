import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, FileText, Database, Server } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Pairly IDE privacy policy detailing data practices, ephemeral room retention, and GDPR compliance.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 mb-8 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              Last updated: October 2026 • Effective immediately
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
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

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              2. Data We Process
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Guest Sessions:</strong> When joining as a guest, we generate an ephemeral
                identity (temporary identifier, display name, and avatar seed) stored only in your
                browser session storage. No registration or credit card is required.
              </li>
              <li>
                <strong>Document Contents & CRDT Updates:</strong> Code typed in Pairly rooms is
                synchronized through Yjs binary state vectors and transmitted over encrypted
                WebSockets (WSS). Snapshots and room checkpoints are persisted in encrypted database
                storage to enable session resumption.
              </li>
              <li>
                <strong>Execution I/O:</strong> When you run code, execution payloads are processed
                within an isolated, sandboxed environment (capped by CPU, memory, and a 10-second timeout).
                Standard output and error streams are routed directly to participants and are not logged
                permanently.
              </li>
              <li>
                <strong>Voice and Media Streams:</strong> Peer audio is negotiated via WebRTC.
                Audio streams travel directly between peers whenever possible. Pairly does not record,
                transcribe, or store real-time voice communications.
              </li>
            </ul>
          </section>

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              3. Data Retention and Lifecycle
            </h2>
            <p>
              Guest rooms that experience 7 consecutive days of inactivity are automatically purged
              along with all associated document checkpoints and file buffers. Registered account
              holders may explicitly delete rooms at any time from their workspace controls.
            </p>
          </section>

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              4. User Rights and GDPR / CCPA Compliance
            </h2>
            <p>
              Under global data protection regulations including GDPR and CCPA, you have full control
              over your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Right to Export:</strong> Download a complete JSON archive of your account
                records and hosted workspaces at any time via{' '}
                <Link href="/settings" className="text-emerald-500 underline">
                  Account Settings
                </Link>.
              </li>
              <li>
                <strong>Right to Erasure:</strong> Trigger immediate, irreversible account deletion
                which cascade-deletes all associated profile information and room records.
              </li>
              <li>
                <strong>Data Inquiries:</strong> Contact our team at{' '}
                <a href="mailto:privacy@pairly.dev" className="text-emerald-500 underline">
                  privacy@pairly.dev
                </a>{' '}
                for privacy requests.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
