'use client';

import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  Shield,
  Lock,
  Unlock,
  Users,
  Link2,
  Hash,
} from 'lucide-react';

export interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isHost?: boolean;
  isLocked?: boolean;
  onToggleLock?: (locked: boolean) => void;
}

/**
 * Share dialog component for sharing collaborative coding room links and QR code.
 * Direct architectural alignment with CodeX share-dialog component.
 */
export function ShareRoomModal({
  isOpen,
  onClose,
  roomCode,
  isHost = false,
  isLocked = false,
  onToggleLock,
}: ShareRoomModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const joinUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/room/${roomCode}`
      : `https://pairly.dev/room/${roomCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy join link:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="share-room-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 sm:p-7 flex flex-col gap-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                Share Collaboration Room
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Anyone with this Room ID or Invite Link can collaborate in this room. Only share with people you trust.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two columns on desktop (CodeX pattern) */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          {/* Left Column: High-Res QR Code (CodeX qr-code) */}
          <div
            data-testid="qr-code"
            id="qr-code-container"
            className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800/80 shrink-0 shadow-inner"
          >
            <div className="bg-white p-3 rounded-xl shadow-md">
              <QRCodeCanvas
                value={joinUrl}
                size={168}
                marginSize={1}
                level="M"
                title={`QR code to join room ${roomCode}`}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-3 font-medium text-center">
              Scan with camera to join
            </span>
          </div>

          {/* Right Column: Room Code & Link Copy Sections */}
          <div className="flex flex-1 flex-col space-y-4 w-full">
            {/* Room ID Section */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="room-id"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Room ID</span>
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5">
                <code
                  id="room-id"
                  data-testid="room-id-text"
                  className="flex-1 font-mono text-base sm:text-lg font-bold text-indigo-300 tracking-wide select-all"
                >
                  {roomCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  data-testid="room-id-copy-button"
                  id="room-id-copy-btn"
                  aria-label={copiedCode ? 'Room ID copied' : 'Copy Room ID'}
                  title="Copy Room ID"
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Invite Link Section (CodeX pattern) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="invite-link"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Invite Link</span>
              </label>
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2">
                <code
                  id="invite-link"
                  data-testid="invite-link-text"
                  className="flex-1 bg-transparent border-none text-xs font-mono text-slate-300 select-all truncate"
                >
                  {joinUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  data-testid="copy-link-btn"
                  id="invite-link-copy-button"
                  aria-label={copiedLink ? 'Invite link copied' : 'Copy invite link'}
                  title="Copy invite link"
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Host Access Controls */}
            {isHost && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">Room Lock</span>
                      <span className="text-[11px] text-slate-400">
                        {isLocked ? 'New guests cannot enter' : 'Anyone with link can join'}
                      </span>
                    </div>
                  </div>
                  {onToggleLock && (
                    <button
                      type="button"
                      onClick={() => onToggleLock(!isLocked)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        isLocked
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Locked</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlocked</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
