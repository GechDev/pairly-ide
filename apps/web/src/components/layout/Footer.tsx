import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Github } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Capabilities', href: '#features' },
    { label: 'Interactive Demo', href: '#demo' },
    { label: 'Start a Room', href: '/room/new' },
    { label: 'Documentation', href: '/docs' },
  ],
  Engineering: [
    { label: 'Yjs CRDT Engine', href: '/docs#crdt' },
    { label: 'Sandbox Specs', href: '/docs#sandbox' },
    { label: 'Role-Based Access', href: '/docs#rbac' },
    { label: 'Architecture', href: '/docs#architecture' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Data & GDPR', href: '/settings' },
  ],
};

export function Footer() {
  return (
    <footer className="relative border-t" style={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--border-subtle)' }}>
      {/* Top accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] h-px bg-[#FF0000] opacity-30" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-12">
        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-16 pb-14 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Brand */}
          <div className="md:col-span-2 space-y-5">
            <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="Pairly home">
              <div className="relative w-8 h-8 flex items-center justify-center border transition-all group-hover:border-[#FF0000]" style={{ backgroundColor: 'var(--canvas-2)', borderColor: 'var(--canvas-border)' }}>
                <Image
                  src="/logo.png"
                  alt="Pairly"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-[15px] tracking-[-0.02em] text-[var(--fg-primary)]">Pairly</span>
            </Link>

            <p className="text-xs text-[var(--fg-muted)] leading-relaxed max-w-[34ch]">
              High-performance collaborative development workspace. Sub-50ms conflict-free CRDT sync, multi-language container sandboxes, and server-enforced access control.
            </p>

            {/* Status indicator */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ backgroundColor: 'var(--canvas-subtle)', borderColor: 'var(--border-subtle)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-teal)] animate-pulse" />
              <span className="font-mono text-[11px] text-[var(--fg-secondary)]">Distributed Coordinator: Operational</span>
            </div>

            {/* GitHub */}
            <div>
              <a
                href="https://github.com/GechDev/pairly-ide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[var(--fg-muted)] hover:text-[var(--accent-teal)] transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span className="font-mono">pairly-ide / open-source</span>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section} className="space-y-4">
              <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--fg-primary)]">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('#') ? (
                      <a
                        href={href}
                        className="text-xs text-[var(--fg-secondary)] hover:text-[var(--accent-teal)] transition-colors"
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-xs text-[var(--fg-secondary)] hover:text-[var(--accent-teal)] transition-colors"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--fg-muted)]">
          <p>© 2026 Pairly. Designed for modern pair-programming teams.</p>
          <p className="font-mono text-[11px]">Encrypted WebSockets · Sandboxed Isolation · Zero Setup</p>
        </div>
      </div>
    </footer>
  );
}
