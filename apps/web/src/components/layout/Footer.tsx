import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 dark:text-slate-400">
        <p>© 2026 Pairly. Real-time collaborative coding and AI pair programming platform.</p>
        <div className="flex items-center gap-6">
          <a href="#privacy" className="hover:text-brand-600 dark:hover:text-brand-400">
            Privacy Policy
          </a>
          <a href="#terms" className="hover:text-brand-600 dark:hover:text-brand-400">
            Terms of Service
          </a>
          <a href="https://github.com/GechDev/pairly-ide" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
