'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, X, AlertTriangle } from 'lucide-react';

export interface LeaveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isHost?: boolean;
  onTerminateRoom?: () => void;
}

const DEFAULT_TITLE = 'Are you sure you want to leave this room?';
const DEFAULT_DESCRIPTION =
  'You can rejoin this room using the same Room ID. If all participants leave, the room will be kept for 5 minutes before being deleted. Use Terminate Room to delete it immediately.';

/**
 * Leave Room Confirmation Dialog.
 * Direct architectural alignment with CodeX leave-dialog component.
 */
export function LeaveRoomModal({
  isOpen,
  onClose,
  roomCode,
  isHost = false,
  onTerminateRoom,
}: LeaveRoomModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLeave = () => {
    sessionStorage.removeItem(`pairly_guest_${roomCode}`);
    sessionStorage.removeItem(`pairly_token_${roomCode}`);
    router.push('/');
  };

  const handleTerminate = () => {
    if (onTerminateRoom) {
      onTerminateRoom();
    }
    sessionStorage.removeItem(`pairly_guest_${roomCode}`);
    sessionStorage.removeItem(`pairly_token_${roomCode}`);
    sessionStorage.setItem('pairly_room_ended', 'terminated');
    router.push('/');
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      data-testid="leave-room-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 text-slate-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {DEFAULT_TITLE}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {DEFAULT_DESCRIPTION}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons (CodeX parity) */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-800/80">
          {isHost ? (
            <button
              type="button"
              onClick={handleTerminate}
              data-testid="terminate-room-btn"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Terminate Room</span>
            </button>
          ) : (
            <div />
          )}

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLeave}
              data-testid="confirm-leave-btn"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
