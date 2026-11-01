'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const BRAND_ACCENT = '#FF0000';

const TIERS = [
  {
    number: 'L1',
    label: 'CLIENT',
    title: 'Yjs CRDT & Monaco',
    color: BRAND_ACCENT,
    details: [
      'Monaco Editor integration',
      'Binary delta state vectors',
      'Remote cursor & selection rendering',
      'Offline-capable local Y.Doc',
    ],
    description:
      'Edits apply instantly to local Y.Doc structures before serializing into binary delta vectors. Remote cursors render at 60fps with zero jitter.',
  },
  {
    number: 'L2',
    label: 'COORDINATOR',
    title: 'Fastify & Redis Pub/Sub',
    color: BRAND_ACCENT,
    details: [
      'Host / Editor / Commenter RBAC',
      'PostgreSQL document checkpointing',
      'Sub-50ms broadcast to all peers',
      'Room lock & participant management',
    ],
    description:
      'High-throughput WebSocket gateway handling room lifecycles, role permissions, and Redis channel multiplexing across distributed instances.',
  },
  {
    number: 'L3',
    label: 'RUNTIME',
    title: 'Container Sandboxing',
    color: BRAND_ACCENT,
    details: [
      '20+ execution language runtimes',
      '10-second enforced timeout',
      'Hard memory cap per container',
      'Zero host network leakage',
    ],
    description:
      'User code runs in quarantined ephemeral containers with strict kernel-level memory caps, isolated virtual interfaces, and interactive stdin/stdout streaming.',
  },
];

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-visible');
        }),
      { rootMargin: '0px 0px -80px 0px' },
    );
    const el = ref.current;
    if (el) el.querySelectorAll('.reveal').forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function ArchitectureSection() {
  const ref = useScrollReveal();

  return (
    <section
      id="architecture"
      ref={ref}
      className="py-[clamp(5rem,10vw,9rem)] bg-[#0a0a0b] relative"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.06]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <h2 className="reveal text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold tracking-[-0.03em] leading-[1.05] text-[#f0ede8]">
            Deterministic collaboration,
            <br />
            <span className="text-[#a09a92] font-[380]">from client to container.</span>
          </h2>
          <p className="reveal mt-6 text-[15px] text-[#a09a92] leading-[1.65] max-w-[50ch] font-[380]">
            Pairly combines state-vector CRDT mathematics with isolated backend runtimes — instant
            typing feedback alongside safe code execution.
          </p>
        </div>

        {/* Architecture tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {TIERS.map((tier, idx) => (
            <div
              key={tier.number}
              className="reveal group relative p-7 rounded-xl border border-white/[0.07] bg-[#111114] hover:border-white/[0.12] hover:bg-[#18181c] transition-all duration-300 card-lift"
              style={{ transitionDelay: `${idx * 60}ms` }}
            >
              {/* Accent bar */}
              <div
                className="absolute top-0 left-7 right-7 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: '#FF0000' }}
              />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <span
                  className="font-mono text-[13px] font-bold tracking-[0.12em] uppercase"
                  style={{ color: tier.color }}
                >
                  {tier.number} <span className="opacity-40 font-normal">·</span> {tier.label}
                </span>
                {/* Subtle connector line */}
                {idx < 2 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-3.5 h-3.5 text-[#5c5651]" />
                  </div>
                )}
              </div>

              <h3 className="text-[17px] font-bold tracking-[-0.02em] text-[#f0ede8] mb-3">
                {tier.title}
              </h3>
              <p className="text-[13px] text-[#5c5651] leading-[1.6] mb-5">{tier.description}</p>

              {/* Detail list */}
              <ul className="space-y-2">
                {tier.details.map((d) => (
                  <li
                    key={d}
                    className="flex items-center gap-2 text-[12px] font-mono text-[#a09a92]"
                  >
                    <span
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ background: tier.color }}
                    />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Docs CTA banner */}
        <div className="reveal p-6 sm:p-8 rounded-xl border border-white/[0.07] bg-[#111114] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div
              className="p-2.5 rounded-lg border shrink-0"
              style={{
                borderColor: 'rgba(255,0,0,0.2)',
                background: 'rgba(255,0,0,0.08)',
                color: '#FF0000',
              }}
            >
              <svg
                viewBox="0 0 20 20"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 6h12M4 10h12M4 14h7" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[#f0ede8] mb-1">
                Looking for technical deep-dives?
              </div>
              <div className="text-[13px] text-[#5c5651]">
                Read our specs on CRDT vectors, WebSocket message frames, and sandbox containment.
              </div>
            </div>
          </div>
          <Link
            href="/docs#architecture"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#f0ede8] text-[#0a0a0b] text-[13px] font-semibold hover:bg-white transition-colors duration-150 shrink-0"
          >
            <span>Architecture Docs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
