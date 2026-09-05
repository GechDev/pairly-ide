'use client';

import React from 'react';
import {
  Eye,
  EyeOff,
  Radio,
  FileCode,
  Crown,
} from 'lucide-react';
import type { ParticipantIdentity } from '@pairly/contracts';

export interface ParticipantPresenceInfo {
  participant: ParticipantIdentity;
  activeFileId?: string | null;
  activeFileName?: string | null;
  status?: 'active' | 'idle' | 'away';
}

export interface PresenceBarProps {
  currentParticipant: ParticipantIdentity | null;
  participants: ParticipantPresenceInfo[];
  followedParticipantId: string | null;
  spotlightedParticipantId: string | null;
  onFollow: (participantId: string) => void;
  onUnfollow: () => void;
  onToggleSpotlight?: (participantId: string | null) => void;
}

export function PresenceBar({
  currentParticipant,
  participants,
  followedParticipantId,
  spotlightedParticipantId,
  onFollow,
  onUnfollow,
  onToggleSpotlight,
}: PresenceBarProps) {
  const isHost = currentParticipant?.role === 'HOST';

  const followedParticipant = participants.find(
    (p) => p.participant.id === followedParticipantId
  );
  const spotlightedParticipant = participants.find(
    (p) => p.participant.id === spotlightedParticipantId
  );

  return (
    <div
      id="presence-awareness-bar"
      data-testid="presence-bar"
      className="flex items-center gap-3"
    >
      {/* Active Spotlight Global Banner */}
      {spotlightedParticipant && (
        <div
          id="spotlight-active-badge"
          data-testid="spotlight-badge"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium animate-pulse"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Spotlight: {spotlightedParticipant.participant.displayName}</span>
          {isHost && onToggleSpotlight && (
            <button
              onClick={() => onToggleSpotlight(null)}
              className="ml-1 px-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-[10px] text-amber-200"
            >
              Release
            </button>
          )}
        </div>
      )}

      {/* Follow Mode Status Indicator */}
      {followedParticipant && !spotlightedParticipant && (
        <div
          id="follow-mode-badge"
          data-testid="follow-mode-indicator"
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Following {followedParticipant.participant.displayName}</span>
          <button
            onClick={onUnfollow}
            title="Stop following"
            className="ml-1 p-0.5 rounded hover:bg-emerald-500/20 text-emerald-300"
          >
            <EyeOff className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Participant Avatar Stack with Popover / Quick Controls */}
      <div className="flex items-center -space-x-1.5 overflow-visible">
        {participants.map(({ participant, activeFileName }) => {
          const isSelf = participant.id === currentParticipant?.id;
          const isFollowed = followedParticipantId === participant.id;
          const isSpotlighted = spotlightedParticipantId === participant.id;

          return (
            <div
              key={participant.id}
              className="relative group select-none"
            >
              {/* Avatar Bubble */}
              <div
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white shadow transition-transform group-hover:scale-110 cursor-pointer ${
                  isSpotlighted
                    ? 'border-amber-400 ring-2 ring-amber-400/50'
                    : isFollowed
                    ? 'border-emerald-400 ring-2 ring-emerald-400/50'
                    : 'border-slate-900'
                }`}
                style={{ backgroundColor: participant.color }}
                onClick={() => {
                  if (!isSelf) {
                    if (isFollowed) onUnfollow();
                    else onFollow(participant.id);
                  }
                }}
              >
                {participant.displayName.charAt(0)}
              </div>

              {/* Flyout Card on Hover */}
              <div className="absolute right-0 top-9 hidden group-hover:flex flex-col gap-1 p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 shadow-xl z-50 min-w-[190px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-slate-100 truncate">
                    {participant.displayName}
                  </span>
                  {participant.role === 'HOST' ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Crown className="w-2.5 h-2.5" /> HOST
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      ({participant.role})
                    </span>
                  )}
                </div>

                {/* Active File indicator */}
                {activeFileName && (
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <FileCode className="w-3 h-3 text-brand-400 shrink-0" />
                    <span className="truncate">{activeFileName}</span>
                  </div>
                )}

                {/* Actions */}
                {!isSelf && (
                  <div className="mt-1 pt-1.5 border-t border-slate-800 flex items-center gap-1.5">
                    <button
                      onClick={() => (isFollowed ? onUnfollow() : onFollow(participant.id))}
                      className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                        isFollowed
                          ? 'bg-rose-950/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isFollowed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isFollowed ? 'Unfollow' : 'Follow'}</span>
                    </button>

                    {isHost && onToggleSpotlight && (
                      <button
                        onClick={() =>
                          onToggleSpotlight(isSpotlighted ? null : participant.id)
                        }
                        title="Broadcast spotlight to all room members"
                        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                          isSpotlighted
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                        }`}
                      >
                        <Radio className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
