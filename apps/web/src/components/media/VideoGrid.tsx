'use client';

import React from 'react';
import { Mic, MicOff, Monitor, Volume2 } from 'lucide-react';
import type { ParticipantMediaState } from './useLiveKit';
import { TrackVideo } from './TrackVideo';

export interface VideoGridProps {
  localName: string;
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  audioVolume?: number;
  localVideoTrack?: MediaStreamTrack | null;
  localScreenTrack?: MediaStreamTrack | null;
  remoteParticipants: ParticipantMediaState[];
  className?: string;
}

export function VideoGrid({
  localName,
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  audioVolume = 0,
  localVideoTrack,
  localScreenTrack,
  remoteParticipants,
  className = '',
}: VideoGridProps) {
  const isSpeaking = !isMicMuted && audioVolume > 15;
  const hasLocalScreen = isScreenSharing && Boolean(localScreenTrack);

  return (
    <div
      data-testid="video-grid"
      className={`flex flex-col gap-3 p-3 overflow-y-auto ${className}`}
    >
      {/* Prominent Screen Share Viewport if active */}
      {hasLocalScreen && (
        <div
          data-testid="screen-share-viewport"
          className="relative w-full rounded-xl border border-indigo-500/40 bg-slate-950 aspect-video overflow-hidden shadow-2xl"
        >
          <TrackVideo track={localScreenTrack} mirrored={false} className="object-contain bg-black" />
          <div className="absolute top-2 left-2 flex items-center gap-2 bg-indigo-950/80 backdrop-blur-md border border-indigo-500/40 px-2.5 py-1 rounded-md text-xs font-medium text-indigo-200">
            <Monitor className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>You are sharing your screen</span>
          </div>
        </div>
      )}

      {/* Grid of Participant Video Tiles */}
      <div
        className={`grid gap-2.5 ${
          remoteParticipants.length === 0
            ? 'grid-cols-1'
            : remoteParticipants.length <= 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {/* Local Participant Tile */}
        <div
          data-testid="local-video-tile"
          className={`relative flex flex-col items-center justify-center rounded-xl border aspect-video overflow-hidden shadow-lg transition-all duration-300 ${
            isSpeaking
              ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-slate-900'
              : 'border-slate-800 bg-slate-900/90'
          }`}
        >
          {!isCameraOff && localVideoTrack ? (
            <TrackVideo
              track={localVideoTrack}
              mirrored={true}
              className="object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700 text-sm">
                {localName.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-[11px] mt-2 text-slate-400 font-medium">Camera Disabled</span>
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-semibold text-slate-200 text-[11px] truncate">{localName} (You)</span>
              {isSpeaking && (
                <span className="flex items-center text-[10px] text-emerald-400 font-mono">
                  <Volume2 className="w-3 h-3 mr-0.5 animate-pulse" />
                  {audioVolume}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isScreenSharing && (
                <span
                  title="Screen Sharing"
                  className="p-1 rounded bg-indigo-600/30 text-indigo-400 border border-indigo-500/30"
                >
                  <Monitor className="h-3 w-3" />
                </span>
              )}
              <span
                data-testid="local-mic-badge"
                title={isMicMuted ? 'Muted' : 'Microphone Active'}
                className={`p-1 rounded ${
                  isMicMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isMicMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </span>
            </div>
          </div>
        </div>

        {/* Remote Participant Tiles */}
        {remoteParticipants.map((peer) => (
          <div
            key={peer.identity}
            data-testid={`remote-tile-${peer.identity}`}
            className={`relative flex flex-col items-center justify-center rounded-xl border aspect-video overflow-hidden shadow-lg ${
              peer.isSpeaking
                ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-slate-900'
                : 'border-slate-800 bg-slate-900/90'
            }`}
          >
            {peer.isVideoActive && peer.videoTrack ? (
              <TrackVideo track={peer.videoTrack} mirrored={false} />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-sm shadow-md"
                  style={{ backgroundColor: peer.color || '#6366f1' }}
                >
                  {peer.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-[11px] mt-2 text-slate-400 font-medium">Camera Disabled</span>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg">
              <span className="font-semibold text-slate-200 text-[11px] truncate">{peer.name}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {peer.isScreenSharing && (
                  <span
                    title="Screen Sharing"
                    className="p-1 rounded bg-indigo-600/30 text-indigo-400 border border-indigo-500/30"
                  >
                    <Monitor className="h-3 w-3" />
                  </span>
                )}
                <span
                  title={peer.isAudioActive ? 'Microphone Active' : 'Muted'}
                  className={`p-1 rounded ${
                    !peer.isAudioActive
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {!peer.isAudioActive ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
