'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, Code2 } from 'lucide-react';
import { RoomAccessForm } from './RoomAccessForm';

export interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
}

export function RoomModal({ isOpen, onClose, initialRoomId }: RoomModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Handle ESC key to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-modal-title"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl border animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: '#0e1117',
          borderColor: 'rgba(255, 255, 255, 0.14)',
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-[#FF0000] opacity-60" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 mb-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--canvas-2)',
                borderColor: 'var(--canvas-border)',
              }}
            >
              <Image
                src="/logo.png"
                alt="Pairly"
                width={22}
                height={22}
                className="object-contain"
              />
            </div>
            <div>
              <h3 id="room-modal-title" className="text-base font-bold text-[var(--fg-primary)]">
                Launch Collaborative Session
              </h3>
              <p className="text-xs text-[var(--fg-muted)]">
                Instant browser workspace with zero install required
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-white/[0.06] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Access Form */}
        <RoomAccessForm
          initialRoomId={initialRoomId}
          isModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
