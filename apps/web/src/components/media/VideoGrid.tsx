'use client';

import React from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, User } from 'lucide-react';
import type { ParticipantMediaState } from './useLiveKit';

export interface VideoGridProps {
  localName: string;
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  remoteParticipants: ParticipantMediaState[];
  className?: string;
}

export function VideoGrid({
  localName,
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  remoteParticipants,
  className = '',
}: VideoGridProps) {
  const totalCount = 1 + remoteParticipants.length;

  return (
    <div
      data-testid="video-grid"
      className={`grid gap-2.5 p-3 overflow-y-auto ${
        totalCount <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 lg:grid-cols-3'
      } ${className}`}
    >
      {/* Local Participant Tile */}
      <div
        data-testid="local-video-tile"
        className="relative flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/90 aspect-video overflow-hidden shadow-lg group"
      >
        {isCameraOff ? (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700 text-sm">
              {localName.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-[11px] mt-2 text-slate-400 font-medium">Camera Disabled</span>
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <User className="h-7 w-7" />
              </div>
              <span className="text-xs text-indigo-300 mt-2 font-mono">Live Video Stream</span>
            </div>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
          <span className="font-semibold text-slate-200 text-[11px] truncate">{localName} (You)</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isScreenSharing && (
              <span className="rounded bg-indigo-500/20 px-1 py-0.5 text-[10px] text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                Screen
              </span>
            )}
            {isMicMuted ? (
              <MicOff className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </div>
        </div>
      </div>

      {/* Remote Participant Tiles */}
      {remoteParticipants.map((peer) => (
        <div
          key={peer.identity}
          data-testid={`peer-video-tile-${peer.identity}`}
          className={`relative flex flex-col items-center justify-center rounded-xl border bg-slate-900/90 aspect-video overflow-hidden shadow-lg ${
            peer.isSpeaking ? 'border-emerald-500/60 ring-2 ring-emerald-500/20' : 'border-slate-800'
          }`}
        >
          {!peer.isVideoActive ? (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700 text-sm">
                {peer.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[11px] mt-2 text-slate-400 font-medium">Camera Disabled</span>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/40 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                  <User className="h-7 w-7" />
                </div>
                <span className="text-xs text-purple-300 mt-2 font-mono">Live Video Stream</span>
              </div>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <span className="font-semibold text-slate-200 text-[11px] truncate">{peer.name}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {peer.isAudioActive ? (
                <Mic className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <MicOff className="h-3.5 w-3.5 text-rose-400" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
