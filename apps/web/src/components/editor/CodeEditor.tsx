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

  // Helper to commit code mutations to Yjs CRDT and textarea selection
  const updateEditorCode = useCallback(
    (newText: string, selStart?: number, selEnd?: number) => {
      if (readOnly || !session) return;
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

      if (selStart !== undefined) {
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(selStart, selEnd ?? selStart);
            handleSelectionChange();
          }
        });
      }

      setTimeout(() => {
        isLocalUpdateRef.current = false;
      }, 10);
    },
    [readOnly, session, onCodeChange]
  );

  // Handle local text edits with differential Yjs CRDT operations
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateEditorCode(e.target.value);
    },
    [updateEditorCode]
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

  // Smart keyboard ergonomics: Tab indentation, matching bracket auto-closure, Enter auto-indent
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly || !session) return;
    const el = e.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = el;
    const tabString = ' '.repeat(tabSize);

    // 1. Tab & Shift+Tab Indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      if (start === end) {
        if (e.shiftKey) {
          const lineStart = value.lastIndexOf('\n', start - 1) + 1;
          const linePrefix = value.slice(lineStart, start);
          const matchSpaces = linePrefix.match(/^ +/);
          if (matchSpaces) {
            const toRemove = Math.min(matchSpaces[0].length, tabSize);
            const newCode = value.slice(0, lineStart) + value.slice(lineStart + toRemove);
            updateEditorCode(newCode, Math.max(lineStart, start - toRemove));
          }
        } else {
          const newCode = value.slice(0, start) + tabString + value.slice(end);
          updateEditorCode(newCode, start + tabSize);
        }
      } else {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', end);
        const effectiveEnd = lineEnd === -1 ? value.length : lineEnd;
        const targetLines = value.slice(lineStart, effectiveEnd).split('\n');

        if (e.shiftKey) {
          let removedFromFirst = 0;
          let totalRemoved = 0;
          const updatedLines = targetLines.map((line, idx) => {
            const match = line.match(/^ +/);
            if (match) {
              const count = Math.min(match[0].length, tabSize);
              totalRemoved += count;
              if (idx === 0) removedFromFirst = count;
              return line.slice(count);
            }
            return line;
          });
          const newCode = value.slice(0, lineStart) + updatedLines.join('\n') + value.slice(effectiveEnd);
          updateEditorCode(
            newCode,
            Math.max(lineStart, start - removedFromFirst),
            Math.max(lineStart, end - totalRemoved)
          );
        } else {
          const updatedLines = targetLines.map((line) => tabString + line);
          const addedTotal = targetLines.length * tabSize;
          const newCode = value.slice(0, lineStart) + updatedLines.join('\n') + value.slice(effectiveEnd);
          updateEditorCode(newCode, start + tabSize, end + addedTotal);
        }
      }
      return;
    }

    // 2. Auto-Indent on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      const leadingWhitespace = currentLine.match(/^\s*/)?.[0] || '';
      const trimmedBefore = currentLine.trimEnd();
      const isBlockOpen =
        trimmedBefore.endsWith('{') ||
        trimmedBefore.endsWith('(') ||
        trimmedBefore.endsWith('[') ||
        trimmedBefore.endsWith(':');
      const charAfter = value[end];
      const isSplittingBrackets =
        (trimmedBefore.endsWith('{') && charAfter === '}') ||
        (trimmedBefore.endsWith('(') && charAfter === ')') ||
        (trimmedBefore.endsWith('[') && charAfter === ']');

      if (isSplittingBrackets) {
        const extraIndent = leadingWhitespace + tabString;
        const newCode =
          value.slice(0, start) + '\n' + extraIndent + '\n' + leadingWhitespace + value.slice(end);
        updateEditorCode(newCode, start + 1 + extraIndent.length);
        return;
      }

      const nextIndent = leadingWhitespace + (isBlockOpen ? tabString : '');
      const newCode = value.slice(0, start) + '\n' + nextIndent + value.slice(end);
      updateEditorCode(newCode, start + 1 + nextIndent.length);
      return;
    }

    // 3. Auto-close pairs: (), [], {}, "", '', ``
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key]) {
      const open = e.key;
      const close = pairs[open];
      if ((open === '"' || open === "'" || open === '`') && value[start] === open && start === end) {
        e.preventDefault();
        el.setSelectionRange(start + 1, start + 1);
        handleSelectionChange();
        return;
      }

      e.preventDefault();
      if (start !== end) {
        const selected = value.slice(start, end);
        const newCode = value.slice(0, start) + open + selected + close + value.slice(end);
        updateEditorCode(newCode, start + 1, end + 1);
      } else {
        const newCode = value.slice(0, start) + open + close + value.slice(end);
        updateEditorCode(newCode, start + 1);
      }
      return;
    }

    // 4. Skip closing bracket if already present immediately next
    const closingBrackets = [')', ']', '}', '"', "'", '`'];
    if (closingBrackets.includes(e.key) && start === end && value[start] === e.key) {
      e.preventDefault();
      el.setSelectionRange(start + 1, start + 1);
      handleSelectionChange();
      return;
    }

    // 5. Backspace pair deletion
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prevChar = value[start - 1];
      const nextChar = value[start];
      if (
        (prevChar === '(' && nextChar === ')') ||
        (prevChar === '[' && nextChar === ']') ||
        (prevChar === '{' && nextChar === '}') ||
        (prevChar === '"' && nextChar === '"') ||
        (prevChar === "'" && nextChar === "'") ||
        (prevChar === '`' && nextChar === '`')
      ) {
        e.preventDefault();
        const newCode = value.slice(0, start - 1) + value.slice(start + 1);
        updateEditorCode(newCode, start - 1);
        return;
      }
    }
  };

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
          onKeyDown={handleKeyDown}
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
