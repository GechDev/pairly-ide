'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Play,
  Globe,
  Terminal,
  History,
  Settings,
  MessageSquare,
  FileText,
  Sparkles,
  Video,
  Share2,
  FileCode,
  Download,
  Github,
  Wifi,
  ShieldAlert,
  LogOut,
  Info,
  CornerDownLeft,
  Palette,
} from 'lucide-react';
import type { WorkspaceItem } from '../workspace/workspaceState';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  category: 'Editor' | 'Workspace' | 'Collaboration' | 'Tools';
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceFiles: WorkspaceItem[];
  onSelectFile: (fileId: string) => void;
  onRunCode: () => void;
  onTogglePreview: () => void;
  onToggleTerminal: () => void;
  onOpenCheckpoints: () => void;
  onOpenSettings: () => void;
  onToggleChat: () => void;
  onToggleNotepad: () => void;
  onToggleWhiteboard?: () => void;
  onToggleAi: () => void;
  onToggleMedia: () => void;
  onOpenShare: () => void;
  onOpenGitHubImport: () => void;
  onOpenDiagnostics: () => void;
  onOpenAbout: () => void;
  onOpenReport: () => void;
  onOpenLeave: () => void;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  workspaceFiles,
  onSelectFile,
  onRunCode,
  onTogglePreview,
  onToggleTerminal,
  onOpenCheckpoints,
  onOpenSettings,
  onToggleChat,
  onToggleNotepad,
  onToggleWhiteboard,
  onToggleAi,
  onToggleMedia,
  onOpenShare,
  onOpenGitHubImport,
  onOpenDiagnostics,
  onOpenAbout,
  onOpenReport,
  onOpenLeave,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened and reset query
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Construct dynamic command list including file navigation
  const fileCommands: CommandItem[] = workspaceFiles
    .filter((f) => !f.isFolder)
    .map((f) => ({
      id: `file-${f.id}`,
      label: `Open: ${f.name}`,
      description: f.path || f.name,
      category: 'Workspace',
      icon: FileCode,
      action: () => onSelectFile(f.id),
    }));

  const standardCommands: CommandItem[] = [
    {
      id: 'cmd-run',
      label: 'Run Code in Sandbox',
      description: 'Execute current file through isolated runner',
      category: 'Editor',
      shortcut: 'Ctrl+Enter',
      icon: Play,
      action: onRunCode,
    },
    {
      id: 'cmd-preview',
      label: 'Toggle Live Web Preview',
      description: 'Open sandboxed multi-file web preview',
      category: 'Editor',
      shortcut: 'Ctrl+P',
      icon: Globe,
      action: onTogglePreview,
    },
    {
      id: 'cmd-terminal',
      label: 'Toggle Shared Terminal',
      description: 'View terminal logs and interact with stdin',
      category: 'Editor',
      shortcut: 'Ctrl+`',
      icon: Terminal,
      action: onToggleTerminal,
    },
    {
      id: 'cmd-checkpoints',
      label: 'Workspace Checkpoints',
      description: 'Save named snapshot or revert to past state',
      category: 'Workspace',
      shortcut: 'Ctrl+S',
      icon: History,
      action: onOpenCheckpoints,
    },
    {
      id: 'cmd-ai',
      label: 'Pairly AI Coding Agent',
      description: 'Generate code, refactor, explain, or fix errors',
      category: 'Tools',
      icon: Sparkles,
      action: onToggleAi,
    },
    {
      id: 'cmd-notes',
      label: 'Collaborative Notes',
      description: 'Shared markdown scratchpad isolated from code',
      category: 'Collaboration',
      icon: FileText,
      action: onToggleNotepad,
    },
    ...(onToggleWhiteboard
      ? [
          {
            id: 'cmd-whiteboard',
            label: 'Architecture Whiteboard',
            description: 'Collaborative real-time canvas for system diagrams and wireframes',
            category: 'Collaboration' as const,
            icon: Palette,
            action: onToggleWhiteboard,
          },
        ]
      : []),
    {
      id: 'cmd-chat',
      label: 'Room Chat',
      description: 'Send messages and @mentions to participants',
      category: 'Collaboration',
      icon: MessageSquare,
      action: onToggleChat,
    },
    {
      id: 'cmd-call',
      label: 'Audio & Video Call',
      description: 'Join WebRTC live voice, video, or screen share',
      category: 'Collaboration',
      icon: Video,
      action: onToggleMedia,
    },
    {
      id: 'cmd-share',
      label: 'Share Room & QR Code',
      description: 'Copy invite link, display QR code, change permissions',
      category: 'Collaboration',
      icon: Share2,
      action: onOpenShare,
    },
    {
      id: 'cmd-github-import',
      label: 'Import from GitHub Repository',
      description: 'Browse and load files from GitHub repositories',
      category: 'Workspace',
      icon: Github,
      action: onOpenGitHubImport,
    },
    {
      id: 'cmd-diagnostics',
      label: 'Network Latency & Connection Diagnostics',
      description: 'Run round-trip ping tests and inspect connection health',
      category: 'Tools',
      icon: Wifi,
      action: onOpenDiagnostics,
    },
    {
      id: 'cmd-settings',
      label: 'Editor Settings',
      description: 'Customize font size, themes, tab size, and line numbers',
      category: 'Editor',
      shortcut: 'Ctrl+,',
      icon: Settings,
      action: onOpenSettings,
    },
    {
      id: 'cmd-about',
      label: 'About Pairly & Shortcuts',
      description: 'View system manual, architectural overview, and keys',
      category: 'Tools',
      icon: Info,
      action: onOpenAbout,
    },
    {
      id: 'cmd-report',
      label: 'Report Abuse or Security Issue',
      description: 'Submit an incident report for host or admins',
      category: 'Collaboration',
      icon: ShieldAlert,
      action: onOpenReport,
    },
    {
      id: 'cmd-leave',
      label: 'Leave Room',
      description: 'Disconnect from the active collaborative session',
      category: 'Collaboration',
      icon: LogOut,
      action: onOpenLeave,
    },
  ];

  const allCommands = [...fileCommands, ...standardCommands];

  const filteredCommands = allCommands.filter((cmd) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description?.toLowerCase().includes(q)
    );
  });

  // Clamp selection index
  const safeSelectedIndex = Math.min(
    Math.max(0, selectedIndex),
    Math.max(0, filteredCommands.length - 1)
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[safeSelectedIndex];
      if (target) {
        onClose();
        target.action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="command-palette-modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            data-testid="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search actions... (e.g. Run, Preview, File, Settings)"
            className="flex-1 bg-transparent border-0 text-sm font-medium text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-800 border border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Command Items List */}
        <div
          ref={listRef}
          data-testid="command-palette-list"
          className="max-h-96 overflow-y-auto p-2 space-y-1 select-none"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 italic">
              No matching commands or files found for &quot;{query}&quot;.
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === safeSelectedIndex;
              const Icon = cmd.icon;

              return (
                <div
                  key={cmd.id}
                  data-testid={`command-item-${cmd.id}`}
                  onClick={() => {
                    onClose();
                    cmd.action();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-600/20 text-white border border-brand-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-brand-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate flex items-center gap-2">
                        <span>{cmd.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60 font-normal">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.description && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {cmd.shortcut && (
                      <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-brand-400" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Pairly Quick Command Palette</span>
        </div>
      </div>
    </div>
  );
}
