'use client';

import React, { useState, useEffect, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CirclePlus,
  Loader2,
  LogIn,
  Hash,
  User,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface RoomAccessFormProps {
  initialRoomId?: string;
  isModal?: boolean;
  onClose?: () => void;
}

const DASH_PATTERN = /-/g;
const NON_ALPHANUMERIC_PATTERN = /[^A-Z0-9]/gi;

export const formatRoomCode = (value: string): string => {
  const cleaned = value.replace(NON_ALPHANUMERIC_PATTERN, '').toUpperCase();
  const truncated = cleaned.slice(0, 8);
  if (truncated.length > 4) {
    return `${truncated.slice(0, 4)}-${truncated.slice(4)}`;
  }
  return truncated;
};

/**
 * Collaborative Room Access Form:
 * Direct architectural alignment with CodeX room-access-form component.
 * Allows creating rooms with a custom name or joining existing rooms by Room ID.
 */
export function RoomAccessForm({
  initialRoomId = '',
  isModal = false,
  onClose,
}: RoomAccessFormProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(initialRoomId);
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [invitedName, setInvitedName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(formatRoomCode(initialRoomId));
    }
  }, [initialRoomId]);

  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    setError(null);

    const chosenName = createName.trim();
    if (chosenName) {
      sessionStorage.setItem('pairly_username', chosenName);
    }

    try {
      const res = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chosenName ? `${chosenName}'s Room` : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.joinUrl) {
        if (data.guest) {
          const guestIdentity = {
            ...data.guest,
            displayName: chosenName || data.guest.displayName,
          };
          sessionStorage.setItem(
            `pairly_guest_${data.room.code}`,
            JSON.stringify(guestIdentity)
          );
        }
        if (data.token) {
          sessionStorage.setItem(`pairly_token_${data.room.code}`, data.token);
        }
        router.push(data.joinUrl);
        return;
      }
      // Fallback
      router.push('/room/pair-demo');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      router.push('/room/pair-demo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (
    targetRoomCode: string,
    targetName: string,
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault();
    const cleanCode = targetRoomCode.replace(DASH_PATTERN, '').trim();
    if (!cleanCode) {
      setError('Please enter a valid Room ID (e.g. ABCD-EFGH)');
      return;
    }

    setIsJoining(true);
    setError(null);

    const chosenName = targetName.trim();
    if (chosenName) {
      sessionStorage.setItem('pairly_username', chosenName);
      // Pre-seed guest identity for the room
      const formattedCode = formatRoomCode(cleanCode);
      const guestObj = {
        id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        displayName: chosenName,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(chosenName)}`,
        color: '#6366f1',
        role: 'EDITOR' as const,
      };
      sessionStorage.setItem(
        `pairly_guest_${formattedCode}`,
        JSON.stringify(guestObj)
      );
    }

    const formattedCode = formatRoomCode(cleanCode);
    router.push(`/room/${formattedCode}`);
  };

  // 1. If invited with a specific Room ID (CodeX InvitedSection pattern)
  if (roomId) {
    return (
      <div className="w-full max-w-md mx-auto rounded-xl border border-white/[0.08] bg-[#111114] p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.7)] text-left animate-fade-in">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
          <div className="p-2 rounded-lg border border-[#FF0000]/20 bg-[#FF0000]/08 text-[#FF0000]">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[#f0ede8]">Join Collaboration Room</h2>
            <p className="text-[12px] text-[#5c5651]">
              Room ID:{' '}
              <span className="font-mono font-bold text-[#FF0000]">
                {roomId}
              </span>
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => handleJoinRoom(roomId, invitedName, e)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="invited-name"
              className="text-[12px] font-semibold text-[#a09a92] flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#5c5651]" />
              <span>Your Name</span>
            </label>
            <input
              id="invited-name"
              type="text"
              autoFocus
              value={invitedName}
              onChange={(e) => setInvitedName(e.target.value)}
              placeholder="e.g. Alex"
              maxLength={32}
              required
              disabled={isJoining}
              className="w-full bg-[#0a0a0b] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[14px] text-[#f0ede8] placeholder-[#5c5651] focus:outline-none focus:ring-2 focus:ring-[#FF0000]/40 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#e8533a]/10 border border-[#e8533a]/20 text-[#e8533a] text-[12px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setRoomId('');
                router.replace('/');
              }}
              disabled={isJoining}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-white/[0.08] bg-[#18181c] hover:bg-white/[0.06] text-[#a09a92] text-[13px] font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={isJoining}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF0000] hover:bg-[#e60000] text-white text-[13px] font-bold transition-all btn-press"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining…</span>
                </>
              ) : (
                <>
                  <span>Join Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. Default Home: Create Room + Join Room
  const containerClasses = isModal
    ? 'w-full text-left space-y-6'
    : 'w-full max-w-xl mx-auto rounded-2xl border p-6 sm:p-7 text-left shadow-2xl';

  const containerStyle = isModal
    ? {}
    : {
        backgroundColor: 'var(--canvas-subtle)',
        borderColor: 'var(--border-prominent)',
      };

  return (
    <div className={containerClasses} style={containerStyle}>
      {/* Create Room Section */}
      <section aria-labelledby="create-room-heading" className="space-y-3.5">
        <div className="flex items-center gap-2">
          <CirclePlus className="w-4 h-4 text-[var(--accent-teal)]" />
          <h2
            id="create-room-heading"
            className="text-[11px] font-semibold text-[var(--accent-teal)] uppercase tracking-[0.1em] font-mono"
          >
            Create a New Room
          </h2>
        </div>

        <form onSubmit={handleCreateRoom} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative w-full flex-1">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Your name (optional)"
                maxLength={32}
                disabled={isCreating || isJoining}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg-primary)] placeholder-[var(--fg-muted)] transition-all focus:outline-none"
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--border-prominent)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-teal)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-prominent)')}
              />
            </div>
            <button
              id="hero-start-room-btn"
              data-testid="start-room-btn"
              type="button"
              onClick={() => handleCreateRoom()}
              disabled={isCreating || isJoining}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 disabled:opacity-50"
              style={{
                backgroundColor: '#FF0000',
                color: '#ffffff',
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating…</span>
                </>
              ) : (
                <>
                  <span>Start a room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: 'var(--border-subtle)' }} />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-mono font-semibold tracking-[0.1em] text-[var(--fg-muted)]">
          <span className="px-3" style={{ backgroundColor: 'var(--canvas-subtle)' }}>
            or join existing
          </span>
        </div>
      </div>

      {/* Join Existing Room Section */}
      <section aria-labelledby="join-room-heading" className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-[var(--accent-cyan)]" />
          <h2
            id="join-room-heading"
            className="text-[11px] font-semibold text-[var(--accent-cyan)] uppercase tracking-[0.1em] font-mono"
          >
            Join with Room ID
          </h2>
        </div>

        <form
          onSubmit={(e) => handleJoinRoom(roomId, joinName, e)}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={roomId}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setRoomId(formatRoomCode(e.target.value))
                }
                placeholder="XXXX-XXXX"
                maxLength={9}
                required
                disabled={isCreating || isJoining}
                className="w-full font-mono rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg-primary)] placeholder-[var(--fg-muted)] uppercase tracking-widest transition-all focus:outline-none"
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--border-prominent)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-cyan)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-prominent)')}
              />
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name"
                maxLength={32}
                disabled={isCreating || isJoining}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg-primary)] placeholder-[var(--fg-muted)] transition-all focus:outline-none"
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--border-prominent)',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--accent-cyan)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border-prominent)')}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            data-testid="join-room-btn"
            disabled={isCreating || isJoining || !roomId.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--canvas-elevated)',
              border: '1px solid var(--border-prominent)',
              color: 'var(--fg-primary)',
            }}
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting…</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-[var(--accent-cyan)]" />
                <span>Join Room</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
