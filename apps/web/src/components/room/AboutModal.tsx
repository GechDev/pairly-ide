'use client';

import React from 'react';
import {
  Info,
  X,
  Keyboard,
  Cpu,
  Layers,
  Terminal,
  Play,
  Share2,
  Settings,
  Shield,
  Zap,
} from 'lucide-react';

export interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl + Enter', desc: 'Execute active file in isolated sandbox', icon: Play },
  { key: 'Ctrl + S', desc: 'Create persistent snapshot checkpoint', icon: Zap },
  { key: 'Ctrl + P', desc: 'Toggle live responsive web preview', icon: Layers },
  { key: 'Ctrl + `', desc: 'Toggle collaborative execution terminal', icon: Terminal },
  { key: 'Ctrl + ,', desc: 'Open IDE & editor settings', icon: Settings },
  { key: 'Ctrl + Shift + S', desc: 'Open room share and invite peer modal', icon: Share2 },
];

const ARCHITECTURE = [
  {
    title: 'CRDT Sync Engine',
    desc: 'Conflict-free replicated data types (Yjs) enabling sub-millisecond multi-cursor editing.',
    badge: 'Yjs + WebSocket',
  },
  {
    title: 'Remote Execution Runner',
    desc: 'Isolated, resource-capped container sandbox executing Python, TS, Rust, Go, C++.',
    badge: 'Piston Engine',
  },
  {
    title: 'WebRTC P2P AV Grid',
    desc: 'Low-latency mesh video/audio conferencing and real-time screen broadcast.',
    badge: 'LiveKit SFU',
  },
  {
    title: 'Collaborative State',
    desc: 'Presence tracking, spotlight following, chat, shared notepad, and checkpoint history.',
    badge: 'Redis + PostgreSQL',
  },
];

/**
 * About & Keyboard Shortcuts Modal.
 * Architectural alignment with CodeX about-dialog.
 */
export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      data-testid="about-modal"
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="about-dialog-title"
                className="text-base font-semibold text-slate-100 flex items-center gap-2"
              >
                About Pairly IDE
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  v0.1.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                High-performance real-time collaborative development environment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-slate-300">
          {/* Architecture Pillars */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Core Architecture
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ARCHITECTURE.map((arch) => (
                <div
                  key={arch.title}
                  className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-200">{arch.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {arch.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{arch.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-indigo-400" />
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHORTCUTS.map((sc) => {
                const Icon = sc.icon;
                return (
                  <div
                    key={sc.key}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-300">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sc.desc}</span>
                    </div>
                    <kbd className="px-2 py-0.5 font-mono text-[11px] font-medium bg-slate-800 border border-slate-700 text-slate-200 rounded">
                      {sc.key}
                    </kbd>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security & Isolation */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-emerald-300">Isolated & Secure Sandbox</span>
              <p className="text-emerald-400/80 leading-relaxed">
                Code execution is strictly containerized with strict memory, CPU, and network resource
                limits. All collaborative socket payloads enforce role-based access control (HOST, EDITOR, VIEWER).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Engineered for seamless pair programming & tech interviews</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700/60"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
