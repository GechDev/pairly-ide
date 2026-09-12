'use client';

import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  PhoneCall,
  Loader2,
  AlertTriangle,
  Settings2,
} from 'lucide-react';

export interface MediaBarProps {
  isConnected: boolean;
  isConnecting: boolean;
  isMicMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  error?: string | null;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpenSettings?: () => void;
  className?: string;
}

export function MediaBar({
  isConnected,
  isConnecting,
  isMicMuted,
  isCameraOff,
  isScreenSharing,
  error,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onConnect,
  onDisconnect,
  className = '',
}: MediaBarProps) {
  return (
    <div
      data-testid="media-bar"
      className={`flex items-center justify-between border-t border-slate-800 bg-slate-900/90 px-4 py-2 text-slate-200 select-none ${className}`}
    >
      {/* Left: Call Status and Error Indicator */}
      <div className="flex items-center gap-2 text-xs">
        {isConnected ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebRTC Connected</span>
          </div>
        ) : isConnecting ? (
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Connecting SFU...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-slate-600" />
            <span>Audio/Video Offline</span>
          </div>
        )}

        {error && (
          <div className="ml-2 flex items-center gap-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            <span className="truncate max-w-[200px]">{error}</span>
          </div>
        )}
      </div>

      {/* Right: Media Controls */}
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <button
            type="button"
            data-testid="join-call-btn"
            disabled={isConnecting}
            onClick={onConnect}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
          >
            {isConnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PhoneCall className="h-3.5 w-3.5" />
            )}
            <span>Join Call</span>
          </button>
        ) : (
          <>
            {/* Mic Toggle */}
            <button
              type="button"
              data-testid="toggle-mic-btn"
              onClick={onToggleMic}
              title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              className={`flex items-center justify-center rounded-lg p-2 text-xs transition-all ${
                isMicMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>

            {/* Camera Toggle */}
            <button
              type="button"
              data-testid="toggle-camera-btn"
              onClick={onToggleCamera}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
              className={`flex items-center justify-center rounded-lg p-2 text-xs transition-all ${
                isCameraOff
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              {isCameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </button>

            {/* Screen Share Toggle */}
            <button
              type="button"
              data-testid="toggle-screenshare-btn"
              onClick={onToggleScreenShare}
              title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
              className={`flex items-center justify-center rounded-lg p-2 text-xs transition-all ${
                isScreenSharing
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Monitor className="h-4 w-4" />
            </button>

            {/* Device Settings */}
            {onOpenSettings && (
              <button
                type="button"
                data-testid="device-settings-btn"
                onClick={onOpenSettings}
                title="Audio & Video Settings"
                className="flex items-center justify-center rounded-lg p-2 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            )}

            {/* Leave Call */}
            <button
              type="button"
              data-testid="leave-call-btn"
              onClick={onDisconnect}
              title="Leave Audio/Video Call"
              className="flex items-center gap-1 rounded-lg bg-rose-600/20 border border-rose-500/30 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-600 hover:text-white transition-all ml-1"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span>Leave</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
