'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../theme/ThemeToggle';
import { Code2, ArrowRight, Menu, X, BookOpen, Layers, PlayCircle, ShieldCheck } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Brand */}
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
            v1.0 Preview
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <a
            href="#features"
            className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            Capabilities
          </a>
          <a
            href="#demo"
            className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            Interactive Demo
          </a>
          <Link
            href="/docs#architecture"
            className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            Architecture
          </Link>
          <Link
            href="/docs"
            className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
          >
            Docs
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <ThemeToggle />

          <Link
            href="/room/new"
            id="header-start-room-btn"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <span>Start a room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-500" />
              <span>Capabilities</span>
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
            >
              <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Demo</span>
            </a>
            <Link
              href="/docs#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Architecture</span>
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
              <span>Docs</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:underline"
            >
              Terms
            </Link>
            <a
              href="https://github.com/GechDev/pairly-ide"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
