import React from 'react';
import Link from 'next/link';
import { ArrowRight, Code2, ShieldCheck, Zap } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950 text-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold mx-auto mb-6 shadow-md shadow-emerald-500/20">
            <Code2 className="w-6 h-6 stroke-[2.5]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Ready to pair with your team?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Provision a collaborative room in seconds. No credit card, no account required,
            and no local dependencies to install.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/room/new"
              id="final-cta-start-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-bold text-sm shadow-md shadow-emerald-400/20 transition-all active:scale-95"
            >
              <span>Start an Instant Room</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all"
            >
              <span>Explore Features</span>
            </a>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant Guest Lifecycle</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Isolated Execution Sandbox</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
