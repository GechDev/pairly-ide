'use client';

import React, { useEffect, useRef } from 'react';

/* ─── Scroll reveal hook ──────────────────────────────────────────── */
function useScrollReveal(rootMargin = '0px 0px -80px 0px') {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { rootMargin }
    );

    const targets = el.querySelectorAll('.reveal');
    targets.forEach((t) => observer.observe(t));

    return () => observer.disconnect();
  }, [rootMargin]);

  return ref;
}

/* ─── Feature data ────────────────────────────────────────────────── */
const BRAND_ACCENT = '#FF0000';

const features = [
  {
    number: '01',
    category: 'CRDT ENGINE',
    title: 'Conflict-free real-time sync',
    description:
      'Built on Yjs — every keystroke propagates as a binary delta vector. Remote cursors, selections, and file state converge deterministically in under 50ms with zero lost characters.',
    pill: '< 50ms latency',
    accent: BRAND_ACCENT,
  },
  {
    number: '02',
    category: 'ISOLATED RUNNER',
    title: 'Sandboxed multi-language execution',
    description:
      'Run Python, TypeScript, Rust, Go, C++, Java, and 14 more inside ephemeral container sandboxes. Every execution is memory-capped, time-bounded, and network-isolated.',
    pill: '20+ Languages',
    accent: BRAND_ACCENT,
  },
  {
    number: '03',
    category: 'AI PAIRING',
    title: 'Reviewable AI diff proposals',
    description:
      'The AI assistant surfaces code suggestions as unified diffs, not direct edits. Review, accept, or reject every change. Stale-base detection prevents silent overwrites.',
    pill: 'Safe & Reviewable',
    accent: BRAND_ACCENT,
  },
  {
    number: '04',
    category: 'COLLABORATION',
    title: 'Instant guest room lifecycle',
    description:
      'Start a session in one click. Generate an unguessable 8-character room code, share the link, and partners join as ephemeral guests — no registration, no friction.',
    pill: 'Zero Setup',
    accent: BRAND_ACCENT,
  },
  {
    number: '05',
    category: 'AUTHORIZATION',
    title: 'Server-enforced RBAC',
    description:
      'Host, Editor, Commenter, and Viewer roles enforced on the coordinator — not the client. Lock rooms, revoke access, and manage participants without reloading.',
    pill: 'Server Guarded',
    accent: BRAND_ACCENT,
  },
  {
    number: '06',
    category: 'TERMINAL I/O',
    title: 'Shared real-time terminal',
    description:
      'stdout and stderr stream live to every participant via xterm.js. Interactive stdin is supported, so all partners watch and participate in execution together.',
    pill: 'Live Stdin/Stdout',
    accent: BRAND_ACCENT,
  },
];

export function FeatureGrid() {
  const sectionRef = useScrollReveal();

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-[clamp(5rem,10vw,9rem)] bg-[#0a0a0b] relative"
    >
      {/* Section border top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.06]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">

        {/* Section header */}
        <div className="max-w-3xl mb-20">

          <h2 className="reveal text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold tracking-[-0.03em] leading-[1.05] text-[#f0ede8]">
            Engineered for high-bandwidth
            <br />
            <span className="text-[#a09a92] font-[380]">collaborative development.</span>
          </h2>
        </div>

        {/* Feature list — editorial numbered layout */}
        <div className="space-y-0">
          {features.map((feature, idx) => (
            <div
              key={feature.number}
              className="reveal group relative border-t border-white/[0.06] py-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12 items-start hover:bg-white/[0.015] transition-colors duration-300 -mx-5 sm:-mx-8 px-5 sm:px-8"
            >
              {/* Number */}
              <div className="md:col-span-1 flex items-start">
                <span
                  className="font-mono text-[14px] sm:text-[15px] font-bold tracking-wider"
                  style={{ color: feature.accent }}
                >
                  {feature.number}
                </span>
              </div>

              {/* Category + title */}
              <div className="md:col-span-4">
                <span className="label text-[#5c5651] block mb-2">{feature.category}</span>
                <h3 className="text-[17px] sm:text-[19px] font-bold tracking-[-0.02em] text-[#f0ede8] leading-[1.25]">
                  {feature.title}
                </h3>
              </div>

              {/* Description */}
              <div className="md:col-span-5">
                <p className="text-[15px] text-[#a09a92] leading-[1.65] font-[380]">
                  {feature.description}
                </p>
              </div>

              {/* Pill */}
              <div className="md:col-span-2 flex md:justify-end items-start">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-semibold border"
                  style={{
                    color: feature.accent,
                    borderColor: feature.accent + '28',
                    background: feature.accent + '0f',
                  }}
                >
                  {feature.pill}
                </span>
              </div>

              {/* Hover accent line */}
              <div
                className="absolute left-0 top-0 bottom-0 w-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: feature.accent + '50' }}
              />
            </div>
          ))}

          {/* Bottom border */}
          <div className="border-t border-white/[0.06]" />
        </div>
      </div>
    </section>
  );
}
