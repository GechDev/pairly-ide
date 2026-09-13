'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Globe, Wifi, WifiOff, FileCode } from 'lucide-react';

export interface StatusBarProps {
  activeFileName?: string;
  cursorLine?: number;
  cursorColumn?: number;
  language?: string;
  isConnected?: boolean;
  latencyMs?: number;
  isPreviewOpen?: boolean;
  isTerminalOpen?: boolean;
  onTogglePreview?: () => void;
  onToggleTerminal?: () => void;
  className?: string;
}

/**
 * Bottom IDE status bar displaying cursor coordinates, language, and connection latency.
 * Directly inspired by CodeX status-bar and latency-test components.
 */
export function StatusBar({
  activeFileName = 'No file open',
  cursorLine = 1,
  cursorColumn = 1,
  language = 'TypeScript',
  isConnected = true,
  latencyMs = 28,
  isPreviewOpen = false,
  isTerminalOpen = true,
  onTogglePreview,
  onToggleTerminal,
  className = '',
}: StatusBarProps) {
  const [currentLatency, setCurrentLatency] = useState(latencyMs);

  // Subtle real-time jitter simulation around average latency
  useEffect(() => {
    if (!isConnected) return;
    const interval = setInterval(() => {
      const jitter = Math.floor(Math.random() * 8) - 4;
      setCurrentLatency(Math.max(12, latencyMs + jitter));
    }, 4000);
    return () => clearInterval(interval);
  }, [isConnected, latencyMs]);

  // Ping color badge
  const latencyColor = !isConnected
    ? 'text-rose-400'
    : currentLatency < 80
    ? 'text-emerald-400'
    : currentLatency < 200
    ? 'text-amber-400'
    : 'text-rose-400';

  return (
    <footer
      data-testid="ide-status-bar"
      className={`h-6 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-20 ${className}`}
    >
      {/* Left: Active file and quick panel toggles */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium truncate max-w-[200px]">
          <FileCode className="w-3 h-3 text-indigo-400" />
          <span className="truncate">{activeFileName}</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        {onToggleTerminal && (
          <button
            onClick={onToggleTerminal}
            title="Toggle Terminal Panel"
            className={`flex items-center gap-1 hover:text-slate-200 transition-colors ${
              isTerminalOpen ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Terminal</span>
          </button>
        )}

        {onTogglePreview && (
          <button
            onClick={onTogglePreview}
            title="Toggle Live Web Preview"
            className={`flex items-center gap-1 hover:text-slate-200 transition-colors ${
              isPreviewOpen ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Preview</span>
          </button>
        )}
      </div>

      {/* Right: Line/Col, Encoding, Language, Latency */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span>Ln {cursorLine}, Col {cursorColumn}</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        <span>Spaces: 2</span>

        <div className="h-3 w-[1px] bg-slate-800" />

        <span>UTF-8</span>

        <div className="h-3 w-[1px] bg-slate-800" />

        <span className="font-medium text-slate-300 capitalize">{language}</span>

        <div className="h-3 w-[1px] bg-slate-800" />

        {/* Real-time Connection & Latency Indicator */}
        <div
          data-testid="latency-indicator"
          title={isConnected ? `Realtime Sync: ${currentLatency}ms latency` : 'Disconnected'}
          className={`flex items-center gap-1 font-mono ${latencyColor}`}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              <span>{currentLatency}ms</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-rose-400" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
