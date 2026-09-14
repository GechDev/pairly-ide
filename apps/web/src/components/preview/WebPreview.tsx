'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  RotateCcw,
  Smartphone,
  Tablet,
  Monitor,
  Terminal,
  AlertTriangle,
  Globe,
  Loader2,
  Copy,
  Check,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import type { WorkspaceItem } from '../workspace/workspaceState';
import { bundleWorkspaceForPreview } from './bundler';

export interface WebPreviewProps {
  items: WorkspaceItem[];
  onClose?: () => void;
}

export interface ConsoleLogMessage {
  level: 'log' | 'error' | 'warn';
  text: string;
  timestamp: number;
}

export function WebPreview({ items }: WebPreviewProps) {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLandscape, setIsLandscape] = useState(false);
  const [enableTailwind, setEnableTailwind] = useState(false);
  const [key, setKey] = useState(0);
  const [bundledHtml, setBundledHtml] = useState('');
  const [bundleDuration, setBundleDuration] = useState(0);
  const [entrypoint, setEntrypoint] = useState('index.html');
  const [isCompiling, setIsCompiling] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [logs, setLogs] = useState<ConsoleLogMessage[]>([]);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const popoutWindowRef = useRef<Window | null>(null);

  // Re-bundle when workspace items or tailwind option change (debounced < 300ms per FR-PREV-02)
  useEffect(() => {
    setIsCompiling(true);
    const timer = setTimeout(() => {
      const result = bundleWorkspaceForPreview(items, { enableTailwind });
      setBundledHtml(result.html);
      setBundleDuration(result.durationMs);
      setEntrypoint(result.entrypoint);
      setIsCompiling(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [items, enableTailwind]);

  // Sync updates to popout detached window if open
  useEffect(() => {
    if (popoutWindowRef.current && !popoutWindowRef.current.closed) {
      try {
        popoutWindowRef.current.document.open();
        popoutWindowRef.current.document.write(bundledHtml);
        popoutWindowRef.current.document.close();
      } catch {}
    }
  }, [bundledHtml]);

  // Listen for message events from preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'PREVIEW_CONSOLE') {
        setLogs((prev) => [
          ...prev,
          {
            level: event.data.level || 'log',
            text: event.data.text || '',
            timestamp: Date.now(),
          },
        ]);
      } else if (event.data.type === 'PREVIEW_ERROR') {
        setLogs((prev) => [
          ...prev,
          {
            level: 'error',
            text: `Error (line ${event.data.line || '?'}:${event.data.col || '?'}): ${event.data.message}`,
            timestamp: Date.now(),
          },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`http://localhost:3000/preview/${entrypoint}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePopoutPreview = () => {
    if (typeof window === 'undefined') return;
    const popout = window.open(
      '',
      '_blank',
      'width=960,height=720,menubar=no,toolbar=no,location=no,status=no'
    );
    if (popout) {
      popout.document.open();
      popout.document.write(bundledHtml);
      popout.document.close();
      popoutWindowRef.current = popout;
    }
  };

  const errorCount = logs.filter((l) => l.level === 'error').length;

  const viewportContainerClass =
    viewportMode === 'desktop'
      ? 'w-full h-full'
      : viewportMode === 'tablet'
      ? isLandscape
        ? 'w-[1024px] max-w-full h-full'
        : 'w-[768px] max-w-full h-full'
      : isLandscape
      ? 'w-[667px] max-w-full h-[375px]'
      : 'w-[375px] max-w-full h-[667px]';

  return (
    <div
      data-testid="web-preview-panel"
      className="flex-1 flex flex-col h-full bg-slate-950 border-l border-slate-800 select-none overflow-hidden"
    >
      {/* Browser Chrome Header Toolbar */}
      <div className="h-10 px-3 border-b border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2">
        {/* Left: Refresh & URL Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <button
            onClick={handleRefresh}
            title="Refresh preview"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">preview/{entrypoint}</span>
            {isCompiling ? (
              <Loader2 className="w-3 h-3 text-brand-400 animate-spin ml-auto shrink-0" />
            ) : (
              <span className="text-[10px] text-slate-500 ml-auto shrink-0">
                {bundleDuration}ms
              </span>
            )}
            <button
              onClick={handleCopyUrl}
              title="Copy preview path"
              className="p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors ml-1"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Center: Responsive Viewport Switchers & Orientation Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              data-testid="viewport-desktop-btn"
              onClick={() => setViewportMode('desktop')}
              title="Desktop View (100%)"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewportMode === 'desktop'
                  ? 'bg-slate-800 text-brand-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              data-testid="viewport-tablet-btn"
              onClick={() => setViewportMode('tablet')}
              title="Tablet View"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewportMode === 'tablet'
                  ? 'bg-slate-800 text-brand-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              data-testid="viewport-mobile-btn"
              onClick={() => setViewportMode('mobile')}
              title="Mobile View"
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewportMode === 'mobile'
                  ? 'bg-slate-800 text-brand-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Orientation Toggle for mobile & tablet */}
          {(viewportMode === 'tablet' || viewportMode === 'mobile') && (
            <button
              data-testid="preview-orientation-toggle"
              onClick={() => setIsLandscape((prev) => !prev)}
              title={isLandscape ? 'Switch to Portrait' : 'Switch to Landscape'}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                isLandscape
                  ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Tailwind CSS CDN Preset Toggle */}
          <button
            type="button"
            data-testid="toggle-tailwind-cdn-btn"
            onClick={() => setEnableTailwind((prev) => !prev)}
            title={enableTailwind ? 'Tailwind CDN Enabled' : 'Enable Tailwind CSS via CDN'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              enableTailwind
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            <span>Tailwind</span>
          </button>
        </div>

        {/* Right: Popout & Console Drawer Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            data-testid="detach-preview-btn"
            onClick={handlePopoutPreview}
            title="Pop out preview into detached window"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowConsole((prev) => !prev)}
            title="Toggle Preview Console"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
              showConsole
                ? 'bg-slate-800 text-brand-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Console</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                {errorCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Preview Viewport Canvas */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-2 overflow-auto">
        <div
          className={`transition-all duration-300 bg-white rounded-md shadow-2xl overflow-hidden border border-slate-800 ${viewportContainerClass}`}
        >
          {/* Strictly Sandboxed iframe per SEC-02, FR-PREV-03, and AT-06 */}
          <iframe
            key={key}
            ref={iframeRef}
            data-testid="preview-iframe"
            title="Sandboxed Live Preview"
            srcDoc={bundledHtml}
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>

      {/* Toggleable Console Output Drawer */}
      {showConsole && (
        <div className="h-44 border-t border-slate-800 bg-slate-900/95 flex flex-col font-mono text-xs">
          <div className="h-7 px-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-slate-400">
            <span>Preview Console Logs ({logs.length})</span>
            <button
              onClick={() => setLogs([])}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1 select-text">
            {logs.length === 0 ? (
              <div className="text-slate-600 py-1">No console messages logged yet.</div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={`${log.timestamp}-${i}`}
                  className={`flex items-start gap-1.5 py-0.5 ${
                    log.level === 'error' ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {log.level === 'error' && (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <span className="whitespace-pre-wrap break-all">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
