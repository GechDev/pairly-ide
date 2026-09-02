'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../theme/ThemeToggle';
import { Code2, ArrowRight } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Pairly
            </span>
          </Link>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
            Preview Beta
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a
            href="#features"
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            Features
          </a>
          <a
            href="#architecture"
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            Architecture
          </a>
          <a
            href="#security"
            className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            Security
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/room/new"
            id="header-start-room-btn"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow transition-all"
          >
            <span>Start a room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
