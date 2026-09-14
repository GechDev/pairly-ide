import React from 'react';
import Link from 'next/link';
import { Code2, Github, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-12 pb-12 border-b border-slate-200 dark:border-slate-800/80">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <Code2 className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                Pairly IDE
              </span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              Real-time collaborative developer workspace engineered for high-bandwidth pairing.
              Sub-50ms conflict-free CRDT sync, multi-language sandboxes, and host governance.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Coordinator: Operational</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="#features" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Capabilities
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Interactive Demo
                </a>
              </li>
              <li>
                <Link href="/room/new" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Start Instant Room
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Architecture Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Engineering
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/docs#crdt" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Yjs CRDT Engine
                </Link>
              </li>
              <li>
                <Link href="/docs#sandbox" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Isolated Runner Specs
                </Link>
              </li>
              <li>
                <Link href="/docs#rbac" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Role-Based Access
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/GechDev/pairly-ide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Trust & Legal
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link href="/privacy" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                  Data & GDPR Settings
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© 2026 Pairly IDE. Built for collaborative engineering teams.</p>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Encrypted WebSockets & Sandboxed Execution</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
