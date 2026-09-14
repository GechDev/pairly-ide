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
export function RoomAccessForm({ initialRoomId = '' }: RoomAccessFormProps) {
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
      <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-7 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Join Collaboration Room</h2>
            <p className="text-xs text-slate-400">
              Room ID:{' '}
              <span className="font-mono font-bold text-emerald-400 text-sm">
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
              className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-slate-400" />
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
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
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={isJoining}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-400/20"
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Joining Room...</span>
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

  // 2. Default Home: Create Room + Join Room (CodeX dual section pattern)
  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-7 shadow-2xl text-left">
      {/* Create Room Section */}
      <section aria-labelledby="create-room-heading" className="space-y-3.5">
        <div className="flex items-center gap-2">
          <CirclePlus className="w-4 h-4 text-emerald-400" />
          <h2
            id="create-room-heading"
            className="text-sm font-bold tracking-tight text-white uppercase text-xs tracking-wider"
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
                placeholder="Enter your name (optional)"
                maxLength={32}
                disabled={isCreating || isJoining}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <button
              id="hero-start-room-btn"
              data-testid="start-room-btn"
              type="button"
              onClick={() => handleCreateRoom()}
              disabled={isCreating || isJoining}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-400/20 transition-all shrink-0 active:scale-95 disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
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
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider text-slate-500">
          <span className="bg-slate-900 px-3">or join existing room</span>
        </div>
      </div>

      {/* Join Existing Room Section (CodeX pattern) */}
      <section aria-labelledby="join-room-heading" className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-indigo-400" />
          <h2
            id="join-room-heading"
            className="text-sm font-bold tracking-tight text-white uppercase text-xs tracking-wider"
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
                placeholder="Room ID (XXXX-XXXX)"
                maxLength={9}
                required
                disabled={isCreating || isJoining}
                className="w-full font-mono bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase transition-all"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            data-testid="join-room-btn"
            disabled={isCreating || isJoining || !roomId.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/80 transition-all active:scale-95 disabled:opacity-40"
          >
            {isJoining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-indigo-400" />
                <span>Join Room</span>
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
