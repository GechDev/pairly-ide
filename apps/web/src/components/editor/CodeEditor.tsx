'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { ParticipantIdentity } from '@pairly/contracts';
import {
  createCollaborativeSession,
  type CollaborativeSession,
  type RemoteCursor,
} from './yjsExtension';

export interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  readOnly?: boolean;
  participant: ParticipantIdentity;
  onCodeChange?: (newCode: string) => void;
  onSessionReady?: (session: CollaborativeSession) => void;
}

export function CodeEditor({
  initialCode = '',
  language = 'typescript',
  readOnly = false,
  participant,
  onCodeChange,
  onSessionReady,
}: CodeEditorProps) {
  const [session, setSession] = useState<CollaborativeSession | null>(null);
  const [code, setCode] = useState(initialCode);
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isLocalUpdateRef = useRef(false);

  // Initialize collaborative Yjs CRDT session
  useEffect(() => {
    const colabSession = createCollaborativeSession(initialCode, participant);
    setSession(colabSession);

    // Initial content
    setCode(colabSession.ytext.toString());

    // Listen to Yjs CRDT document updates
    const unbindUpdate = colabSession.onUpdate((_base64, origin) => {
      if (origin !== 'local') {
        const updatedText = colabSession.ytext.toString();
        isLocalUpdateRef.current = true;
        setCode(updatedText);
        onCodeChange?.(updatedText);
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
  }, [participant.id, initialCode]);

  // Handle local text edits
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (readOnly || !session) return;
      const newText = e.target.value;

      isLocalUpdateRef.current = true;
      session.doc.transact(() => {
        session.ytext.delete(0, session.ytext.length);
        session.ytext.insert(0, newText);
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

    session.updateLocalCursor(line, column);
  }, [session]);

  const lines = code.split('\n');

  return (
    <div
      id="code-editor-container"
      data-testid="code-editor"
      data-language={language}
      className="relative flex-1 flex h-full w-full bg-slate-950 font-mono text-sm overflow-hidden select-text"
    >
      {/* Line Numbers Gutter */}
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
          className="absolute inset-0 w-full h-full p-4 resize-none bg-transparent text-slate-200 caret-brand-400 font-mono text-sm leading-6 outline-none border-0 overflow-auto z-10 selection:bg-brand-500/30"
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
