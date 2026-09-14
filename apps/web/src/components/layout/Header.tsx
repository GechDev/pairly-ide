'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Capabilities', href: '#features' },
  { label: 'Demo', href: '#demo' },
  { label: 'Architecture', href: '/docs#architecture' },
  { label: 'Docs', href: '/docs' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between">
        {/* Brand mark */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Pairly home">
          {/* Logo mark */}
          <div className="relative w-8 h-8 flex items-center justify-center border transition-all group-hover:border-[#FF0000]" style={{ backgroundColor: 'var(--canvas-2)', borderColor: 'var(--canvas-border)' }}>
            <Image
              src="/logo.png"
              alt="Pairly"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
          </div>
          <span
            className="font-bold text-[15px] tracking-[-0.02em] text-[var(--fg-primary)] group-hover:text-[#FF0000] transition-colors duration-200"
          >
            Pairly
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" role="navigation">
          {NAV_LINKS.map(({ label, href }) => (
            href.startsWith('#') ? (
              <a
                key={label}
                href={href}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-white/[0.04] transition-all duration-150"
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-white/[0.04] transition-all duration-150"
              >
                {label}
              </Link>
            )
          ))}
          <Link
            href="/settings"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-white/[0.04] transition-all duration-150"
          >
            Settings
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-xs font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>

          {/* Primary CTA */}
          <Link
            href="/room/new"
            id="header-start-room-btn"
            className="
              inline-flex items-center gap-1.5 px-4 py-[7px] rounded-lg
              text-xs font-semibold text-white
              bg-[var(--accent-teal)] hover:opacity-90
              transition-all duration-150
              shadow-[0_0_20px_rgba(255,0,0,0.25)]
            "
          >
            <span>Start a room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 rounded-md text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-white/[0.06] bg-[#0a0a0b]/95 backdrop-blur-xl px-5 pt-4 pb-6 space-y-1 animate-fade-in"
        >
          {NAV_LINKS.map(({ label, href }) => (
            href.startsWith('#') ? (
              <a
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-[#a09a92] hover:text-[#f0ede8] hover:bg-white/[0.04] transition-colors"
              >
                {label}
              </a>
            ) : (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-[#a09a92] hover:text-[#f0ede8] hover:bg-white/[0.04] transition-colors"
              >
                {label}
              </Link>
            )
          ))}

          <div className="pt-3 border-t border-white/[0.06] mt-3 flex items-center gap-3 text-xs text-[#5c5651]">
            <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#a09a92] transition-colors">Privacy</Link>
            <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#a09a92] transition-colors">Terms</Link>
            <a href="https://github.com/GechDev/pairly-ide" target="_blank" rel="noopener noreferrer" className="hover:text-[#a09a92] transition-colors">GitHub</a>
          </div>
        </div>
      )}
    </header>
  );
}
