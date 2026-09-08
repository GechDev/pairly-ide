'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Download,
  Copy,
  Check,
  RotateCcw,
  X,
  Eye,
  Edit3,
} from 'lucide-react';
import { createNotepadSession, type NotepadSession } from './notepadSession';

export interface SharedNotepadProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  initialContent?: string;
  onBroadcastUpdate?: (updateBase64: string) => void;
  onMountSession?: (session: NotepadSession) => void;
}

/**
 * Lightweight Markdown renderer for Notepad Preview.
 */
function renderMarkdownPreview(markdown: string): React.ReactNode[] {
  const lines = markdown.split('\n');

  return lines.map((line, idx) => {
    // Heading 1
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} className="text-xl font-bold text-slate-100 mt-4 mb-2 border-b border-slate-800 pb-1">
          {line.slice(2)}
        </h1>
      );
    }
    // Heading 2
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="text-base font-semibold text-slate-200 mt-3 mb-1.5">
          {line.slice(3)}
        </h2>
      );
    }
    // Heading 3
    if (line.startsWith('### ')) {
      return (
        <h3 key={idx} className="text-sm font-medium text-brand-300 mt-2 mb-1">
          {line.slice(4)}
        </h3>
      );
    }
    // Task list checkbox
    if (line.startsWith('- [ ] ')) {
      return (
        <div key={idx} className="flex items-center gap-2 py-0.5 text-slate-300 text-xs">
          <input type="checkbox" disabled className="rounded border-slate-700 bg-slate-900" />
          <span>{line.slice(6)}</span>
        </div>
      );
    }
    if (line.startsWith('- [x] ') || line.startsWith('- [X] ')) {
      return (
        <div key={idx} className="flex items-center gap-2 py-0.5 text-slate-500 line-through text-xs">
          <input type="checkbox" checked disabled className="rounded border-slate-700 bg-slate-900" />
          <span>{line.slice(6)}</span>
        </div>
      );
    }
    // Bullet list
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={idx} className="ml-4 list-disc text-slate-300 text-xs py-0.5">
          {line.slice(2)}
        </li>
      );
    }
    // Blockquote
    if (line.startsWith('> ')) {
      return (
        <blockquote
          key={idx}
          className="border-l-2 border-brand-500 pl-3 my-1.5 text-xs text-slate-400 italic"
        >
          {line.slice(2)}
        </blockquote>
      );
    }
    // Empty line
    if (!line.trim()) {
      return <div key={idx} className="h-2" />;
    }
    // Regular paragraph
    return (
      <p key={idx} className="text-xs leading-relaxed text-slate-300 my-1">
        {line}
      </p>
    );
  });
}

export function SharedNotepad({
  isOpen,
  onClose,
  roomCode,
  initialContent = `# Room ${roomCode} Collaborative Notes\n\n- [ ] Architecture design review\n- [ ] Code execution pipeline\n\n> Document notes here in real-time.`,
  onBroadcastUpdate,
  onMountSession,
}: SharedNotepadProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [content, setContent] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const sessionRef = useRef<NotepadSession | null>(null);

  useEffect(() => {
    const session = createNotepadSession(initialContent);
    sessionRef.current = session;

    if (onMountSession) {
      onMountSession(session);
    }

    const unsub = session.onUpdate((base64Update, origin) => {
      setContent(session.getText());
      if (origin !== 'remote' && onBroadcastUpdate) {
        onBroadcastUpdate(base64Update);
      }
    });

    return () => {
      unsub();
      session.destroy();
    };
  }, [roomCode, initialContent, onBroadcastUpdate, onMountSession]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    sessionRef.current?.setText(val);
  };

  const handleExportDownload = () => {
    if (!sessionRef.current) return;
    const blob = sessionRef.current.exportMarkdownBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pairly-notes-${roomCode}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleClear = () => {
    if (confirm('Clear all collaborative notes in this room?')) {
      setContent('');
      sessionRef.current?.setText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notepad-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl h-[75vh] rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-12 px-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-400" />
              <h2 id="notepad-modal-title" className="text-xs font-semibold text-slate-100">
                Collaborative Notepad
              </h2>
            </div>

            {/* Tab switchers */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('edit')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-slate-800 text-brand-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-slate-800 text-brand-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={handleExportDownload}
              title="Download as .md file (FR-BOARD-04)"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .md</span>
            </button>

            <button
              onClick={handleCopy}
              title="Copy markdown to clipboard"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={handleClear}
              title="Clear notes"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              title="Close notepad"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 p-4">
          {activeTab === 'edit' ? (
            <textarea
              value={content}
              onChange={handleTextChange}
              placeholder="Write collaborative notes, task lists, or design architecture here in Markdown..."
              className="w-full h-full bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed resize-none focus:outline-none placeholder-slate-600"
            />
          ) : (
            <div className="w-full h-full overflow-y-auto select-text pr-2">
              {content.trim() ? (
                renderMarkdownPreview(content)
              ) : (
                <div className="text-center py-10 text-xs text-slate-600">
                  Notepad is currently empty. Switch to &quot;Edit&quot; tab to write notes.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-8 px-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
          <span>Synced via isolated Yjs CRDT</span>
          <span>{content.length} characters</span>
        </div>
      </div>
    </div>
  );
}
