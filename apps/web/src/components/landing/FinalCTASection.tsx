'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const TRUST_ITEMS = [
  'Sub-50ms CRDT sync',
  'Sandboxed execution',
  'Zero installs',
  'Encrypted WebSockets',
  'Instant guest sessions',
  'Server-enforced RBAC',
];

export function FinalCTASection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-visible');
        }),
      { rootMargin: '0px 0px -60px 0px' },
    );
    const el = ref.current;
    if (el) el.querySelectorAll('.reveal').forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-[clamp(5rem,10vw,9rem)] bg-[#0a0a0b] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.06]" />

      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 100%, rgba(255,0,0,0.08) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
        {/* Headline */}
        <h2 className="reveal text-[clamp(2.5rem,7vw,6rem)] font-extrabold tracking-[-0.04em] leading-[0.95] text-[#f0ede8]">
          Ready to pair
          <br />
          with your team?
        </h2>

        <p className="reveal mt-7 text-[16px] text-[#a09a92] leading-[1.65] max-w-[42ch] mx-auto font-[380]">
          Provision a collaborative room in seconds. Invite partners via a single link. No account,
          no setup, no local dependencies.
        </p>

        {/* CTAs */}
        <div className="reveal mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/room/new"
            id="final-cta-start-btn"
            className="
              inline-flex items-center justify-center gap-2
              px-7 py-3.5 rounded-xl
              text-[15px] font-semibold text-white
              bg-[#FF0000] hover:bg-[#e60000]
              transition-all duration-150 btn-press
              shadow-accent-glow
            "
          >
            <span>Start an Instant Room</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/docs"
            className="
              inline-flex items-center justify-center gap-2
              px-6 py-3.5 rounded-xl
              text-[15px] font-semibold text-[#a09a92]
              border border-white/[0.1] hover:border-white/[0.18] hover:text-[#f0ede8]
              transition-all duration-150
            "
          >
            <span>Read the docs</span>
          </Link>
        </div>

        {/* Trust ticker */}
        <div className="reveal mt-14 overflow-hidden">
          <div className="ticker-track select-none">
            {[...TRUST_ITEMS, ...TRUST_ITEMS].map((item, idx) => (
              <span key={idx} className="inline-flex items-center gap-3 px-5">
                <span className="w-1 h-1 rounded-full bg-[#FF0000]/40" />
                <span className="text-[12px] font-mono text-[#5c5651] uppercase tracking-wider whitespace-nowrap">
                  {item}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
