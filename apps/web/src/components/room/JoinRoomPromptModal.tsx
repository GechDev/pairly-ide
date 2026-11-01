'use client';

import React, { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';

export interface JoinRoomPromptModalProps {
  isOpen: boolean;
  roomCode: string;
  onJoin: (displayName: string) => void;
}

export function JoinRoomPromptModal({
  isOpen,
  roomCode: _roomCode,
  onJoin,
}: JoinRoomPromptModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a display name to join the room');
      return;
    }
    setError(null);
    onJoin(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      data-testid="join-room-prompt-modal"
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-center space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-prompt-title"
      >
        <div className="text-center">
          <h2 id="join-prompt-title" className="text-xl font-bold text-slate-100 tracking-tight">
            Enter Your Name to Join
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              autoFocus
              type="text"
              data-testid="guest-name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Your display name (e.g. Alice)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] transition-all font-medium"
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium text-left">{error}</p>}

          <button
            type="submit"
            data-testid="submit-join-room-btn"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FF0000] hover:bg-[#e60000] text-white text-sm font-bold rounded-xl shadow-md shadow-red-500/20 active:scale-[0.99] transition-all"
          >
            <span>Enter Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-[11px] text-slate-500">
          No sign-in or account needed • Instant collaborative pair programming
        </p>
      </div>
    </div>
  );
}
