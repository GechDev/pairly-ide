'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MousePointer2 } from 'lucide-react';

export interface RemotePointer {
  id: string;
  name: string;
  color?: string;
  x: number; // percentage of viewport (0 - 100)
  y: number; // percentage of viewport (0 - 100)
  lastUpdate: number;
}

export interface RemotePointersProps {
  currentUserId?: string;
  pointers: Record<string, RemotePointer>;
  containerRef?: React.RefObject<HTMLElement>;
  onBroadcastPointer?: (x: number, y: number) => void;
}

const POINTER_IDLE_TIMEOUT_MS = 2500;
const THROTTLE_INTERVAL_MS = 33; // ~30 fps

/**
 * Remote pointer tracking component for visualizing other users' cursors.
 * Directly inspired by CodeX remote-pointers implementation.
 */
export function RemotePointers({
  currentUserId,
  pointers,
  containerRef,
  onBroadcastPointer,
}: RemotePointersProps) {
  const [activePointers, setActivePointers] = useState<RemotePointer[]>([]);
  const lastBroadcastRef = useRef<number>(0);

  // Sweep idle pointers
  useEffect(() => {
    const sweep = () => {
      const now = Date.now();
      const valid = Object.values(pointers).filter((p) => {
        if (p.id === currentUserId) return false;
        return now - p.lastUpdate < POINTER_IDLE_TIMEOUT_MS;
      });
      setActivePointers(valid);
    };

    sweep();
    const interval = setInterval(sweep, 1000);
    return () => clearInterval(interval);
  }, [pointers, currentUserId]);

  // Track local mouse movement and broadcast throttled coordinates
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!onBroadcastPointer) return;

      const now = Date.now();
      if (now - lastBroadcastRef.current < THROTTLE_INTERVAL_MS) {
        return;
      }
      lastBroadcastRef.current = now;

      const container = containerRef?.current || document.body;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

      onBroadcastPointer(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
    },
    [containerRef, onBroadcastPointer]
  );

  useEffect(() => {
    const target = containerRef?.current || window;
    target.addEventListener('mousemove', handleMouseMove as any);
    return () => {
      target.removeEventListener('mousemove', handleMouseMove as any);
    };
  }, [containerRef, handleMouseMove]);

  return (
    <div
      data-testid="remote-pointers-layer"
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
    >
      {activePointers.map((p) => {
        const bg = p.color || '#6366f1';
        return (
          <div
            key={p.id}
            data-testid={`remote-pointer-${p.id}`}
            className="absolute transition-all duration-75 ease-out flex items-center gap-1.5"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Colored SVG Pointer */}
            <MousePointer2
              className="w-4 h-4 drop-shadow-md"
              style={{ color: bg, fill: bg }}
            />
            {/* User Name Badge */}
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white whitespace-nowrap shadow-md"
              style={{ backgroundColor: bg }}
            >
              {p.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
