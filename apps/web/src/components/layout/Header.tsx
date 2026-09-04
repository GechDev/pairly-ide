'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../theme/ThemeToggle';
import { Code2, ArrowRight } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-400 transition-colors">
              <Code2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Pairly
            </span>
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            v0.1 • Preview
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <a
            href="#features"
            className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            Capabilities
          </a>
          <a
            href="https://github.com/GechDev/pairly-ide"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            Architecture
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/room/new"
            id="header-start-room-btn"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Start a room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
