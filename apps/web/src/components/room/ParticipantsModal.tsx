'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Eye,
  MessageSquare,
  Mic,
  MicOff,
  UserX,
  Lock,
  Unlock,
  X,
  FileCode,
} from 'lucide-react';
import type { ParticipantIdentity, RoomRole } from '@pairly/contracts';

export interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  currentParticipant: ParticipantIdentity | null;
  participants: ParticipantIdentity[];
  participantPresenceMap?: Record<string, { fileId?: string | null; fileName?: string | null }>;
  isRoomLocked?: boolean;
  mutedParticipantIds?: string[];
  onChangeRole: (targetParticipantId: string, newRole: RoomRole) => void;
  onKickParticipant: (targetParticipantId: string, reason?: string) => void;
  onToggleMuteParticipant: (targetParticipantId: string, isMuted: boolean) => void;
  onToggleRoomLock: (isLocked: boolean) => void;
}

const ROLE_CONFIG: Record<
  RoomRole,
  { label: string; colorClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  HOST: { label: 'Host', colorClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: ShieldCheck },
  EDITOR: { label: 'Editor', colorClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: UserCheck },
  COMMENTER: { label: 'Commenter', colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: MessageSquare },
  VIEWER: { label: 'Viewer', colorClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40', icon: Eye },
};

export function ParticipantsModal({
  isOpen,
  onClose,
  roomCode,
  currentParticipant,
  participants,
  participantPresenceMap = {},
  isRoomLocked = false,
  mutedParticipantIds = [],
  onChangeRole,
  onKickParticipant,
  onToggleMuteParticipant,
  onToggleRoomLock,
}: ParticipantsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const isHost = currentParticipant?.role === 'HOST';

  if (!isOpen) return null;

  // Deduplicate participants by ID
  const uniqueParticipants = Array.from(
    new Map(participants.map((p) => [p.id, p])).values()
  );

  // Sort so Host is first, then current user, then alphabetical
  const sortedParticipants = [...uniqueParticipants].sort((a, b) => {
    if (a.role === 'HOST') return -1;
    if (b.role === 'HOST') return 1;
    if (a.id === currentParticipant?.id) return -1;
    if (b.id === currentParticipant?.id) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  const filtered = sortedParticipants.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  });

  return (
    <div
      data-testid="participants-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <header className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Room Participants ({uniqueParticipants.length})
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {roomCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isHost ? 'Manage permissions and moderate room members' : 'Active peers currently in the workspace'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isHost && (
              <button
                type="button"
                data-testid="toggle-room-lock-btn"
                onClick={() => onToggleRoomLock(!isRoomLocked)}
                title={isRoomLocked ? 'Unlock room (allow edits)' : 'Lock room (host-only edits)'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                  isRoomLocked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {isRoomLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Locked</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Unlocked</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200">
            <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              data-testid="participants-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter participants by name or role..."
              className="w-full bg-transparent border-0 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Participant List */}
        <div data-testid="participants-list" className="max-h-96 overflow-y-auto p-3 space-y-2 select-none">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 italic">
              No participants found matching &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filtered.map((p) => {
              const isMe = p.id === currentParticipant?.id;
              const isTargetHost = p.role === 'HOST';
              const isMuted = mutedParticipantIds.includes(p.id);
              const activeFile = participantPresenceMap[p.id]?.fileName;
              const roleMeta = ROLE_CONFIG[p.role] || ROLE_CONFIG.VIEWER;
              const RoleIcon = roleMeta.icon;

              return (
                <div
                  key={p.id}
                  data-testid={`participant-row-${p.id}`}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white border border-slate-700 shrink-0 shadow-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.displayName.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-100 truncate">
                          {p.displayName}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            You
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleMeta.colorClass}`}
                        >
                          <RoleIcon className="w-2.5 h-2.5" />
                          <span>{roleMeta.label}</span>
                        </span>
                      </div>

                      {activeFile && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                          <FileCode className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">Editing {activeFile}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Moderation Controls for Host */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Role changer dropdown (only for Host moderating non-hosts) */}
                    {isHost && !isMe && !isTargetHost && (
                      <select
                        data-testid={`role-select-${p.id}`}
                        value={p.role}
                        onChange={(e) => onChangeRole(p.id, e.target.value as RoomRole)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-brand-500 font-sans"
                      >
                        <option value="EDITOR">Editor</option>
                        <option value="COMMENTER">Commenter</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    )}

                    {/* Mute button (only for Host moderating non-hosts) */}
                    {isHost && !isMe && (
                      <button
                        type="button"
                        data-testid={`mute-btn-${p.id}`}
                        onClick={() => onToggleMuteParticipant(p.id, !isMuted)}
                        title={isMuted ? 'Unmute participant audio' : 'Mute participant audio'}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isMuted
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                        }`}
                      >
                        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Kick button (only for Host moderating non-hosts) */}
                    {isHost && !isMe && !isTargetHost && (
                      <button
                        type="button"
                        data-testid={`kick-btn-${p.id}`}
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${p.displayName} from this room?`)) {
                            onKickParticipant(p.id);
                          }
                        }}
                        title={`Remove ${p.displayName} from room`}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>{uniqueParticipants.length} connected</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
