'use client';

import React, { useEffect, useRef } from 'react';

const TECH_ITEMS = [
  'Yjs CRDT',
  'Monaco Editor',
  'WebRTC P2P Audio',
  'Docker Containers',
  'Redis Pub/Sub',
  'Fastify WebSockets',
  'PostgreSQL',
  'TypeScript',
  'Python',
  'Rust',
  'Go',
  'C++',
  'Java',
  'xterm.js',
  'GitHub Export',
  'RBAC',
];

const TRUST_WORDS = [
  'Sub-50ms sync',
  'Zero setup',
  'Instant rooms',
  '20+ languages',
  'Sandbox isolation',
  'Encrypted transport',
  'Guest sessions',
  'Live cursors',
];

export function TechTicker() {
  return (
    <div className="py-8 border-y border-white/[0.06] bg-[#111114] overflow-hidden relative">
      {/* Fade edges */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #111114, transparent)' }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #111114, transparent)' }}
      />

      <div className="flex items-center gap-0">
        <div className="ticker-track flex items-center gap-0">
          {[...TECH_ITEMS, ...TECH_ITEMS].map((item, idx) => (
            <span key={idx} className="inline-flex items-center gap-4 px-4">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-[#5c5651] whitespace-nowrap">
                {item}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#FF0000]/30 shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
