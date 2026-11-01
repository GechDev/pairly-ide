import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileCheck, ArrowLeft, AlertCircle, ShieldAlert, Code2, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service — Pairly Collaborative IDE',
  description:
    'Pairly IDE terms of service covering acceptable use, sandboxed execution rules, and intellectual property.',
};

export default function TermsPage() {
  return (
    <div
      className="min-h-screen text-[var(--fg-primary)]"
      style={{ backgroundColor: 'var(--canvas)' }}
    >
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

        <div
          className="flex items-start gap-4 mb-10 pb-8 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="p-3 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(255, 0, 0, 0.08)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              color: 'var(--accent-teal)',
            }}
          >
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--fg-primary)]">
              Terms of Service
            </h1>
            <p className="text-xs text-[var(--fg-muted)] font-mono mt-1.5">
              Last updated: October 2026 • Version 1.0 (Enterprise &amp; Community Edition)
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
              <Scale className="w-4 h-4 text-[var(--accent-teal)]" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing Pairly IDE, initializing a collaboration room, or running code within our
              sandboxes, you agree to comply with these Terms of Service. If you are entering into
              this agreement on behalf of an organization, you represent that you possess the
              authority to bind that organization.
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
              <Code2 className="w-4 h-4 text-[var(--accent-cyan)]" />
              2. Intellectual Property and Code Ownership
            </h2>
            <p>
              You and your collaboration peers retain full and exclusive ownership of all source
              code, scripts, configuration files, and assets created, edited, or uploaded inside
              Pairly IDE. Pairly asserts no intellectual property claims over your creations.
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
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              3. Acceptable Use and Sandbox Security
            </h2>
            <p>
              Pairly provides isolated execution sandboxes for software development and educational
              pairing. You strictly agree NOT to use the execution runtime for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cryptocurrency mining or distributed computation abuse.</li>
              <li>
                Compiling or launching malicious software, keyloggers, worms, or exploit payloads.
              </li>
              <li>
                Unauthorized port scanning, probing, or denial-of-service testing against remote
                hosts.
              </li>
              <li>
                Attempting to bypass sandbox isolation, escalate privileges, or break container
                containment.
              </li>
            </ul>
            <p className="text-xs text-[var(--fg-muted)] mt-2">
              Code execution is subject to runtime quotas: 10 seconds execution timeout, memory
              limits, and automatic termination upon quota exhaustion. Violations result in
              immediate session termination.
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
              <AlertCircle className="w-4 h-4 text-[var(--accent-teal)]" />
              4. Disclaimer and Limitation of Liability
            </h2>
            <p>
              Pairly IDE is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.
              While our CRDT architecture provides conflict-free local edits, we recommend exporting
              vital work to version control systems such as GitHub. Under no circumstances will
              Pairly be liable for lost revenue, data loss, or indirect damages arising from service
              interruption.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
