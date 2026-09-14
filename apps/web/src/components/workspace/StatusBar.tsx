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
  onSelectLanguage?: (language: string) => void;
  onOpenDiagnostics?: () => void;
  className?: string;
}

export const POPULAR_LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'C++',
  'C',
  'Java',
  'C#',
  'Ruby',
  'PHP',
  'HTML',
  'CSS',
  'JSON',
  'Markdown',
  'YAML',
  'SQL',
  'Bash',
  'Dockerfile',
];

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
  onSelectLanguage,
  onOpenDiagnostics,
  className = '',
}: StatusBarProps) {
  const [currentLatency, setCurrentLatency] = useState(latencyMs);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Sync internal latency with incoming prop
  useEffect(() => {
    setCurrentLatency(latencyMs);
  }, [latencyMs]);

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
      className={`relative h-6 bg-slate-950 border-t border-slate-800/80 px-3 flex items-center justify-between text-[11px] text-slate-400 select-none z-20 ${className}`}
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
              isTerminalOpen ? 'text-indigo-400 font-medium' : 'text-slate-500'
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
              isPreviewOpen ? 'text-indigo-400 font-medium' : 'text-slate-500'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Preview</span>
          </button>
        )}
      </div>

      {/* Right: Line/Col, Encoding, Language, Latency */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 font-mono text-slate-300">
          <span>Ln {cursorLine}, Col {cursorColumn}</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        <span>Spaces: 2</span>

        <div className="h-3 w-[1px] bg-slate-800" />

        <span>UTF-8</span>

        <div className="h-3 w-[1px] bg-slate-800" />

        {/* Language Selection Popover */}
        <div className="relative">
          <button
            type="button"
            data-testid="status-bar-language"
            onClick={() => setIsLangMenuOpen((prev) => !prev)}
            title="Select Language Mode"
            className="font-medium text-slate-300 hover:text-brand-300 transition-colors capitalize hover:bg-slate-900 px-1 py-0.5 rounded cursor-pointer"
          >
            {language}
          </button>

          {isLangMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsLangMenuOpen(false)}
              />
              <div
                data-testid="language-select-dropdown"
                className="absolute right-0 bottom-7 z-40 w-44 max-h-60 overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl py-1 text-slate-200"
              >
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800">
                  Select Language
                </div>
                {POPULAR_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      onSelectLanguage?.(lang);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-800 transition-colors flex items-center justify-between ${
                      lang.toLowerCase() === language.toLowerCase()
                        ? 'text-brand-400 font-semibold bg-brand-500/10'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>{lang}</span>
                    {lang.toLowerCase() === language.toLowerCase() && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="h-3 w-[1px] bg-slate-800" />

        {/* Real-time Connection & Latency Indicator */}
        <button
          type="button"
          data-testid="latency-indicator"
          onClick={onOpenDiagnostics}
          title={
            isConnected
              ? `Realtime Sync: ${currentLatency}ms latency • Click for Network Diagnostics`
              : 'Disconnected • Click for Network Diagnostics'
          }
          className={`flex items-center gap-1 font-mono hover:bg-slate-900 px-1 py-0.5 rounded transition-colors cursor-pointer ${latencyColor}`}
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
        </button>
      </div>
    </footer>
  );
}
