'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { ParticipantIdentity } from '@pairly/contracts';
import {
  createCollaborativeSession,
  type CollaborativeSession,
  type RemoteCursor,
} from './yjsExtension';
import type { EditorSettings } from '../room/EditorSettingsModal';

export interface CodeEditorProps {
  initialCode?: string;
  initialUpdate?: string;
  isCollaborative?: boolean;
  language?: string;
  readOnly?: boolean;
  participant: ParticipantIdentity;
  onCodeChange?: (newCode: string) => void;
  onSessionReady?: (session: CollaborativeSession) => void;
  onCursorMove?: (cursor: RemoteCursor) => void;
  settings?: EditorSettings;
}

export function CodeEditor({
  initialCode = '',
  initialUpdate,
  isCollaborative = false,
  language = 'typescript',
  readOnly = false,
  participant,
  onCodeChange,
  onSessionReady,
  onCursorMove,
  settings,
}: CodeEditorProps) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [code, setCode] = useState(isCollaborative && !initialUpdate ? '' : initialCode);
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLocalUpdateRef = useRef(false);
  const initialCodeRef = useRef(initialCode);

  // Initialize collaborative Yjs CRDT session
  useEffect(() => {
    // If in a collaborative room, start with empty doc to receive authoritative server root items
    const seedText = isCollaborative ? '' : initialCodeRef.current;
    const colabSession = createCollaborativeSession(seedText, participant);

    if (initialUpdate) {
      colabSession.applyEncodedUpdate(initialUpdate);
    }
    setSession(colabSession);

    // Initial content
    const initialDocText = colabSession.ytext.toString();
    if (initialDocText) {
      setCode(initialDocText);
    }

    // Listen to Yjs CRDT document updates
    const unbindUpdate = colabSession.onUpdate((_base64, origin) => {
      if (origin !== 'local') {
        const updatedText = colabSession.ytext.toString();
        isLocalUpdateRef.current = true;
        const textarea = textareaRef.current;
        const selStart = textarea?.selectionStart;
        const selEnd = textarea?.selectionEnd;
        setCode(updatedText);
        onCodeChange?.(updatedText);
        if (textarea && selStart !== undefined && selEnd !== undefined) {
          requestAnimationFrame(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(selStart, selEnd);
            }
          });
        }
        setTimeout(() => {
          isLocalUpdateRef.current = false;
        }, 10);
      }
    });

    // Listen to remote cursors
    const unbindCursors = colabSession.onCursorChange((remoteCursors) => {
      setCursors(remoteCursors.filter((c) => c.participantId !== participant.id));
    });

    onSessionReady?.(colabSession);

    return () => {
      unbindUpdate();
      unbindCursors();
      colabSession.destroy();
    };
  }, [participant.id, isCollaborative]);

  // Synchronize dynamic initialUpdate snapshot when received after mount
  useEffect(() => {
    if (initialUpdate && session) {
      if (session.ytext.length === 0) {
        session.applyEncodedUpdate(initialUpdate);
        const text = session.ytext.toString();
        setCode(text);
        onCodeChange?.(text);
      }
    }
  }, [initialUpdate, session, onCodeChange]);

  // Offline fallback: if collaborative server does not respond within 1500ms, populate template
  useEffect(() => {
    if (!isCollaborative) return;
    const timer = setTimeout(() => {
      if (session && session.ytext.length === 0 && initialCodeRef.current) {
        session.ytext.insert(0, initialCodeRef.current);
        setCode(initialCodeRef.current);
        onCodeChange?.(initialCodeRef.current);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isCollaborative, session, onCodeChange]);

  // Handle local text edits with differential Yjs CRDT operations
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (readOnly || !session) return;
      const newText = e.target.value;
      const oldText = session.ytext.toString();

      isLocalUpdateRef.current = true;
      session.doc.transact(() => {
        let start = 0;
        while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
          start++;
        }
        let endOld = oldText.length;
        let endNew = newText.length;
        while (endOld > start && endNew > start && oldText[endOld - 1] === newText[endNew - 1]) {
          endOld--;
          endNew--;
        }
        const deleteCount = endOld - start;
        const insertText = newText.slice(start, endNew);

        if (deleteCount > 0) {
          session.ytext.delete(start, deleteCount);
        }
        if (insertText.length > 0) {
          session.ytext.insert(start, insertText);
        }
      }, 'local');

      setCode(newText);
      onCodeChange?.(newText);
      setTimeout(() => {
        isLocalUpdateRef.current = false;
      }, 10);
    },
    [readOnly, session, onCodeChange]
  );

  // Handle cursor positioning & selection
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current || !session) return;
    const el = textareaRef.current;
    const pos = el.selectionStart || 0;

    // Calculate line and column
    const textBefore = el.value.slice(0, pos);
    const linesArr = textBefore.split('\n');
    const line = linesArr.length;
    const currentLineText = linesArr[linesArr.length - 1] ?? '';
    const column = currentLineText.length + 1;

    const cursor = session.updateLocalCursor(line, column);
    onCursorMove?.(cursor);
  }, [session, onCursorMove]);

  const lines = code.split('\n');
  const showLineNumbers = settings ? settings.lineNumbers : true;
  const fontSize = settings ? settings.fontSize : 14;
  const wordWrap = settings ? settings.wordWrap : false;
  const tabSize = settings ? settings.tabSize : 2;
  const themeClass = settings?.theme === 'hc-black' ? 'bg-black text-white' : 'bg-slate-950 text-slate-200';

  return (
    <div
      id="code-editor-container"
      data-testid="code-editor"
      data-language={language}
      className={`relative flex-1 flex h-full w-full ${themeClass} font-mono overflow-hidden select-text`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Line Numbers Gutter */}
      {showLineNumbers && (
        <div
          id="editor-gutter"
          aria-hidden="true"
          className="w-12 select-none border-r border-slate-800 bg-slate-950/80 py-4 pr-3 text-right text-xs text-slate-600 flex flex-col font-mono"
        >
          {lines.map((_, i) => (
            <div key={i} className="h-6 leading-6">
              {i + 1}
            </div>
          ))}
        </div>
      )}

      {/* Editor Viewport & Remote Cursors Overlay */}
      <div className="relative flex-1 h-full overflow-auto">
        <textarea
          ref={textareaRef}
          id="editor-textarea"
          data-testid="editor-textarea"
          value={code}
          readOnly={readOnly}
          onChange={handleTextChange}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          onSelect={handleSelectionChange}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          style={{ tabSize }}
          className={`absolute inset-0 w-full h-full p-4 resize-none bg-transparent ${themeClass} caret-brand-400 font-mono leading-6 outline-none border-0 overflow-auto z-10 selection:bg-brand-500/30 ${
            wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'
          }`}
          placeholder={readOnly ? 'Viewing mode (read-only)...' : 'Type your code here...'}
        />

        {/* Remote Cursors Overlay */}
        <div
          id="remote-cursors-layer"
          className="pointer-events-none absolute inset-0 p-4 z-20"
        >
          {cursors.map((c) => {
            const topOffset = (c.line - 1) * 24; // 24px line-height
            const leftOffset = (c.column - 1) * 8.4; // approx monospace char width
            return (
              <div
                key={c.participantId}
                className="absolute transition-all duration-75 flex flex-col"
                style={{
                  top: `${topOffset}px`,
                  left: `${leftOffset}px`,
                }}
              >
                {/* Remote cursor caret */}
                <div
                  className="w-0.5 h-6 animate-pulse"
                  style={{ backgroundColor: c.color }}
                />
                {/* Remote cursor tag */}
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] text-white font-sans font-medium whitespace-nowrap shadow-md -mt-1 -ml-1 select-none"
                  style={{ backgroundColor: c.color }}
                >
                  {c.displayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
