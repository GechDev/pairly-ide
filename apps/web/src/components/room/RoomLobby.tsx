'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Users,
  Code2,
  Zap,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Play,
  Globe,
  FileText,
  MessageSquare,
  Sparkles,
  Terminal,
  Share2,
} from 'lucide-react';
import type { ParticipantIdentity } from '@pairly/contracts';

interface RoomLobbyProps {
  roomCode: string;
  participant: ParticipantIdentity;
  activeParticipants: ParticipantIdentity[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  pingLatency: number | null;
  onEnterEditor: () => void;
  onShare: () => void;
}

function GeometryGrid() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="lobby-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lobby-grid)" />
    </svg>
  );
}

function FeatureChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-white/[0.07] bg-white/[0.01] hover:border-white/[0.12] transition-all duration-200 cursor-default">
      <Icon className="w-3.5 h-3.5 shrink-0 text-[#FF0000] opacity-70" />
      <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#5c5651]">{label}</span>
    </div>
  );
}

export function RoomLobby({ roomCode, participant, activeParticipants, connectionStatus, pingLatency, onEnterEditor, onShare }: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const copyLink = () => {
    const url = `${window.location.origin}/room/${roomCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCount = activeParticipants.length;
  const transBase = 'opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)';
  const vis = (delay = 0) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'none' : 'translateY(18px)',
    transition: `${transBase} ${delay}ms`,
  });

  const getName = (p: ParticipantIdentity) => p.displayName || '?';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans fixed inset-0 select-none" style={{ backgroundColor: '#0a0a0b' }}>
      <GeometryGrid />
      <div aria-hidden="true" className="absolute pointer-events-none" style={{ top: '0', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '350px', background: 'radial-gradient(ellipse at 50% -10%, rgba(255,0,0,0.055) 0%, transparent 65%)' }} />

      <header className="relative z-10 h-11 px-5 sm:px-8 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Pairly home">
            <div className="w-6 h-6 flex items-center justify-center border transition-colors group-hover:border-[#FF0000]/50" style={{ backgroundColor: '#111114', borderColor: 'rgba(255,255,255,0.08)' }}>
              <Image src="/logo.png" alt="Pairly" width={16} height={16} className="object-contain" priority />
            </div>
            <span className="font-bold text-[13px] tracking-[-0.02em] text-[#f0ede8] hidden sm:inline">Pairly</span>
          </Link>
          <span className="text-white/10 text-xs">/</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#a09a92] font-semibold tracking-widest uppercase">{roomCode}</span>
            <button type="button" onClick={copyLink} title="Copy invite link" className="p-1 text-[#5c5651] hover:text-[#a09a92] transition-colors">
              {copied ? <Check className="w-3 h-3 text-[#FF0000]" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {connectionStatus === 'connected' ? <Wifi className="w-3.5 h-3.5 text-[#FF0000]" /> : <WifiOff className="w-3.5 h-3.5 text-[#5c5651]" />}
            {pingLatency !== null && connectionStatus === 'connected' && <span className="text-[10px] font-mono text-[#5c5651]">{pingLatency}ms</span>}
          </div>
          <div className="flex -space-x-1.5">
            {activeParticipants.slice(0, 5).map((p) => (
              <div key={p.id} className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-white uppercase" style={{ backgroundColor: p.color, border: '1.5px solid #0a0a0b' }}>
                {getName(p)[0]}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16 sm:py-24">

          <div className="mb-14" style={vis(0)}>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: connectionStatus === 'connected' ? '#FF0000' : '#5c5651', boxShadow: connectionStatus === 'connected' ? '0 0 6px rgba(255,0,0,0.6)' : 'none' }} />
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#5c5651] font-semibold">
                {connectionStatus === 'connected' ? `${totalCount} ${totalCount === 1 ? 'developer' : 'developers'} · Live` : connectionStatus === 'connecting' ? 'Connecting...' : 'Reconnecting...'}
              </span>
            </div>
            <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.04em] leading-[1.0] text-[#f0ede8] mb-4">
              Room <span className="font-mono text-[#FF0000]">{roomCode}</span>
            </h1>
            <p className="text-[15px] text-[#5c5651] leading-[1.7] max-w-[44ch]">
              A private, real-time collaborative coding workspace. Open the editor to start writing code together.
            </p>
          </div>

          {activeParticipants.length > 0 && (
            <div className="mb-10 border border-white/[0.06] p-5" style={vis(80)}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#5c5651] font-semibold">Active session</span>
                <span className="text-[11px] font-mono text-[#5c5651]">{totalCount} online</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeParticipants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-2.5 py-1.5 border" style={{ borderColor: `${p.color}18`, backgroundColor: `${p.color}06` }}>
                    <span className="w-[18px] h-[18px] flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0" style={{ backgroundColor: p.color }}>{getName(p)[0]}</span>
                    <span className="text-[12px] font-medium text-[#a09a92]">{getName(p)}</span>
                    {p.id === participant.id && <span className="text-[10px] font-mono text-[#5c5651]">· you</span>}
                    <span className="text-[9px] font-mono uppercase tracking-wider px-1 py-0.5 ml-1" style={{ color: p.color, backgroundColor: `${p.color}10`, border: `1px solid ${p.color}20` }}>{p.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-16" style={vis(160)}>
            <button type="button" id="enter-editor-btn" onClick={onEnterEditor} className="group inline-flex items-center gap-2.5 px-6 py-3 bg-[#FF0000] hover:bg-[#e60000] text-white font-bold text-[13px] tracking-tight transition-all duration-150 active:scale-[0.98]" style={{ boxShadow: '0 0 28px rgba(255,0,0,0.18)' }}>
              <Code2 className="w-4 h-4" />
              <span>Open Editor</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
            <button type="button" id="lobby-share-btn" onClick={onShare} className="inline-flex items-center gap-2 px-5 py-3 border border-white/[0.1] hover:border-white/[0.18] text-[#a09a92] hover:text-[#f0ede8] text-[13px] font-medium transition-all duration-150">
              <Share2 className="w-3.5 h-3.5" />
              <span>Invite</span>
            </button>
            <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 px-4 py-3 text-[#5c5651] hover:text-[#a09a92] text-[13px] font-medium transition-colors duration-150">
              {copied ? <Check className="w-3.5 h-3.5 text-[#FF0000]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy link'}</span>
            </button>
          </div>

          <div style={vis(240)}>
            <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#5c5651] font-semibold mb-3">Workspace tools</div>
            <div className="flex flex-wrap gap-2">
              <FeatureChip icon={Code2} label="Editor" />
              <FeatureChip icon={Terminal} label="Terminal" />
              <FeatureChip icon={Globe} label="Preview" />
              <FeatureChip icon={MessageSquare} label="Chat" />
              <FeatureChip icon={FileText} label="Notes" />
              <FeatureChip icon={Sparkles} label="AI Agent" />
              <FeatureChip icon={Play} label="Runner" />
              <FeatureChip icon={Users} label="People" />
              <FeatureChip icon={Zap} label="Whiteboard" />
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-white/[0.05]">
            <p className="text-[11px] text-[#5c5651] font-mono">
              Pairly · Real-time collaborative IDE · <span className="text-[#FF0000]/50">{connectionStatus === 'connected' ? `Connected · ${pingLatency !== null ? pingLatency : '-'}ms` : connectionStatus}</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}