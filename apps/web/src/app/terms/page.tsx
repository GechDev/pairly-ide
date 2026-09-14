import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileCheck, ArrowLeft, AlertCircle, ShieldAlert, Code2, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Pairly IDE terms of service covering acceptable use, sandboxed execution rules, and intellectual property.',
};

export default function TermsPage() {
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
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
              Last updated: October 2026 • Version 1.0
            </p>
          </div>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed">
          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-500" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing Pairly IDE, initializing a collaboration room, or running code within our
              sandboxes, you agree to comply with these Terms of Service. If you are entering into
              this agreement on behalf of an organization, you represent that you possess the authority
              to bind that organization.
            </p>
          </section>

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              2. Intellectual Property and Code Ownership
            </h2>
            <p>
              You and your collaboration peers retain full and exclusive ownership of all source code,
              scripts, configuration files, and assets created, edited, or uploaded inside Pairly IDE.
              Pairly asserts no intellectual property claims over your creations.
            </p>
          </section>

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-500" />
              3. Acceptable Use and Sandbox Security
            </h2>
            <p>
              Pairly provides isolated execution sandboxes for software development and educational pairing.
              You strictly agree NOT to use the execution runtime for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Cryptocurrency mining or distributed computation abuse.</li>
              <li>Compiling or launching malicious software, keyloggers, worms, or exploit payloads.</li>
              <li>Unauthorized port scanning, probing, or denial-of-service testing against remote hosts.</li>
              <li>Attempting to bypass sandbox isolation, escalate privileges, or break container containment.</li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Code execution is subject to runtime quotas: 10 seconds execution timeout, memory limits,
              and automatic termination upon quota exhaustion. Violations result in immediate session termination.
            </p>
          </section>

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-500" />
              4. Disclaimer and Limitation of Liability
            </h2>
            <p>
              Pairly IDE is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.
              While our CRDT architecture provides conflict-free local edits, we recommend exporting
              vital work to version control systems such as GitHub. Under no circumstances will Pairly
              be liable for lost revenue, data loss, or indirect damages arising from service interruption.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
