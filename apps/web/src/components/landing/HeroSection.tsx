'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, CirclePlus, Hash } from 'lucide-react';
import { RoomModal } from './RoomModal';

export interface HeroSectionProps {
  initialRoomId?: string;
}

export function HeroSection({ initialRoomId }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(Boolean(initialRoomId));

  /* Global listener so other buttons can trigger the room modal */
  useEffect(() => {
    const handleOpenModal = () => setIsRoomModalOpen(true);
    window.addEventListener('pairly:open-room-modal', handleOpenModal);
    return () => window.removeEventListener('pairly:open-room-modal', handleOpenModal);
  }, []);

  /* Scroll-based parallax on decorative elements */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onScroll = () => {
      const scrollY = window.scrollY;
      const parallaxEl = hero.querySelector<HTMLElement>('.hero-parallax');
      if (parallaxEl) {
        parallaxEl.style.transform = `translateY(${scrollY * 0.18}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-[60px]"
      aria-label="Hero"
    >
      {/* ── Background architecture ── */}

      {/* Fine line grid */}
      <div
        aria-hidden="true"
        className="hero-parallax absolute inset-0 bg-line-grid bg-line-grid pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 40%, transparent 100%)',
        }}
      />

      {/* Radial glow – accent color */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% -5%, rgba(255,0,0,0.10) 0%, transparent 70%)`,
        }}
      />

      {/* Subtle side vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 100%, rgba(0,0,0,0.5) 0%, transparent 60%)`,
        }}
      />

      {/* Floating decorative code nodes — top right */}
      <div
        aria-hidden="true"
        className="absolute top-[18%] right-[6%] hidden xl:block opacity-[0.35] select-none animate-float"
        style={{ animationDelay: '0s', animationDuration: '5s' }}
      >
        <div className="font-mono text-[11px] text-[#5c5651] leading-5 text-right">
          <div>
            <span className="text-[#5b9cf6]">const</span> room ={' '}
            <span className="text-[#FF0000]">await</span> createRoom()
          </div>
          <div>
            <span className="text-[#5c5651]">// ALPHA-7X9P — 3 peers</span>
          </div>
          <div>
            <span className="text-[#5b9cf6]">room</span>.on(
            <span className="text-[#a09a92]">"peer:join"</span>, fn)
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full py-20 sm:py-28">
        {/* Main headline — Capsule-inspired kinetic scale */}
        <h1
          className="
            font-extrabold tracking-[-0.04em] leading-[0.95]
            text-[clamp(3.25rem,8vw,7.5rem)]
            text-[#f0ede8]
            max-w-[16ch]
            animate-fade-up
          "
          style={{ animationDelay: '80ms' }}
        >
          Code together,
          <br />
          <span className="relative inline-block text-[#FF0000]">instantly.</span>
        </h1>

        {/* Sub-headline */}
        <p
          className="
            mt-7 text-[#a09a92] leading-[1.65]
            text-[clamp(1rem,2vw,1.2rem)]
            max-w-[44ch]
            font-[380]
            animate-fade-up
          "
          style={{ animationDelay: '160ms' }}
        >
          Share one link. Edit together in real time with sub-50ms conflict-free sync, run code in
          20+ isolated sandboxes, and ship clean commits — no installs required.
        </p>

        {/* CTA Action Buttons */}
        <div
          className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up"
          style={{ animationDelay: '260ms' }}
        >
          <button
            type="button"
            id="hero-start-room-btn"
            data-testid="start-room-btn"
            onClick={() => setIsRoomModalOpen(true)}
            className="
              inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl
              text-sm font-bold
              hover:opacity-95
              transition-all duration-200
              shadow-[0_0_25px_rgba(255,0,0,0.35)]
              hover:shadow-[0_0_35px_rgba(255,0,0,0.55)]
              hover:-translate-y-0.5 cursor-pointer
            "
            style={{
              backgroundColor: '#FF0000',
              color: '#ffffff',
            }}
          >
            <CirclePlus className="w-4 h-4 text-white" />
            <span>Start a room</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <button
            type="button"
            id="hero-join-room-btn"
            onClick={() => setIsRoomModalOpen(true)}
            className="
              inline-flex items-center gap-2 px-6 py-3.5 rounded-xl
              text-sm font-semibold text-[var(--fg-secondary)]
              hover:text-[var(--fg-primary)]
              bg-[var(--canvas-subtle)] hover:bg-[var(--canvas-elevated)]
              border border-[var(--border-subtle)] hover:border-[var(--border-prominent)]
              transition-all duration-200 cursor-pointer
            "
          >
            <Hash className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span>Join with Room ID</span>
          </button>
        </div>

        {/* Room Access Modal */}
        <RoomModal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
          initialRoomId={initialRoomId}
        />

        {/* Trust signal strip */}
        <div
          className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 animate-fade-up"
          style={{ animationDelay: '340ms' }}
        >
          {[
            { value: '< 50ms', label: 'CRDT sync latency' },
            { value: '20+', label: 'Sandboxed languages' },
            { value: '0', label: 'Installs needed' },
          ].map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-2">
              <span className="font-mono text-[20px] font-bold tracking-tight text-[#f0ede8]">
                {value}
              </span>
              <span className="text-[11px] font-medium text-[#5c5651] uppercase tracking-wider">
                {label}
              </span>
            </div>
          ))}

          {/* Separator */}
          <div className="h-4 w-px bg-white/[0.1] mx-1" />

          {/* Docs link */}
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#5c5651] hover:text-[#a09a92] transition-colors"
          >
            <span>Read the docs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom fade into next section */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, #0a0a0b)',
        }}
      />
    </section>
  );
}
