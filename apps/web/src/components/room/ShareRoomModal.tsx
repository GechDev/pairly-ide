'use client';

import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Shield, Lock, Unlock, Users, Link2 } from 'lucide-react';

export interface ShareRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isHost?: boolean;
  isLocked?: boolean;
  onToggleLock?: (locked: boolean) => void;
}

/**
 * Share dialog allowing room host/participants to copy link, view QR code, and manage access.
 * Directly inspired by CodeX share-dialog component.
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
  const [showQr, setShowQr] = useState(false);
  const [defaultRole, setDefaultRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');

  if (!isOpen) return null;

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${roomCode}` : `https://pairly.dev/room/${roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Simple clean SVG QR code placeholder representation
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    joinUrl
  )}&bgcolor=0f172a&color=e2e8f0&qzone=1`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="share-room-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Share Collaboration Room</h2>
              <p className="text-xs text-slate-400">Invite peers to pair program, call, and review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Link Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-indigo-400" />
            Room Invite Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={joinUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              data-testid="copy-link-btn"
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-2 rounded-lg text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Room Short Code & QR Toggle */}
        <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Room Code
            </span>
            <span className="font-mono text-sm font-bold text-indigo-300">{roomCode}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              title="Copy Short Code"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Code'}</span>
            </button>
            <button
              onClick={() => setShowQr((prev) => !prev)}
              title="Show QR Code"
              className={`p-1.5 rounded-lg border transition-colors text-xs flex items-center gap-1 ${
                showQr
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR</span>
            </button>
          </div>
        </div>

        {/* QR Code Display Viewport */}
        {showQr && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800 animate-in zoom-in-95 duration-150">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSvgUrl}
              alt="Room Join QR Code"
              width={160}
              height={160}
              className="rounded-lg shadow-md"
            />
            <span className="text-[11px] text-slate-400 mt-2">Scan with mobile camera to join room</span>
          </div>
        )}

        {/* Host Access Controls */}
        {isHost && (
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Host Permission Controls
            </span>

            <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 text-xs">
              <div className="flex flex-col">
                <span className="font-medium text-slate-200">Room Lock</span>
                <span className="text-[11px] text-slate-400">
                  {isLocked ? 'New guests cannot enter' : 'Anyone with link can join'}
                </span>
              </div>
              {onToggleLock && (
                <button
                  onClick={() => onToggleLock(!isLocked)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                    isLocked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{isLocked ? 'Locked' : 'Unlocked'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-2 rounded-xl text-xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
