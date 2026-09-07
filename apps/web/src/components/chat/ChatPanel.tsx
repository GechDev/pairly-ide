'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  AtSign,
  Code2,
} from 'lucide-react';
import type { ParticipantIdentity } from '@pairly/contracts';

export interface ChatMessageItem {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderColor: string;
  senderRole?: string;
  content: string;
  mentions: string[];
  createdAt: number;
}

export interface ChatPanelProps {
  messages: ChatMessageItem[];
  currentParticipant: ParticipantIdentity | null;
  participants: ParticipantIdentity[];
  onSendMessage: (content: string) => void;
  onClose?: () => void;
}

/**
 * Parses lightweight Markdown formatting (inline code, bold, italic, @mentions).
 */
export function formatChatMarkdown(text: string): React.ReactNode[] {
  // Split tokens by code blocks, inline code, bold, and mentions
  const lines = text.split('\n');

  return lines.flatMap((line, lineIdx) => {
    // Regex matching @mentions or inline code `code` or bold **bold**
    const parts = line.split(/(@[a-zA-Z0-9_-]+|`[^`]+`|\*\*[^*]+\*\*)/g);

    const formattedParts = parts.map((part, partIdx) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={`${lineIdx}-${partIdx}`}
            className="px-1 py-0.2 rounded bg-brand-500/20 text-brand-300 font-medium font-mono text-[11px]"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        return (
          <code
            key={`${lineIdx}-${partIdx}`}
            className="px-1.5 py-0.5 rounded bg-slate-800 text-brand-300 font-mono text-[11px] border border-slate-700"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return (
          <strong key={`${lineIdx}-${partIdx}`} className="font-semibold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    return [
      ...formattedParts,
      lineIdx < lines.length - 1 ? <br key={`br-${lineIdx}`} /> : null,
    ];
  });
}

export function ChatPanel({
  messages,
  currentParticipant,
  participants,
  onSendMessage,
  onClose,
}: ChatPanelProps) {
  const [inputText, setInputText] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSendMessage(inputText.trim());
    setInputText('');
    setShowMentionMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInsertMention = (name: string) => {
    setInputText((prev) => `${prev}@${name} `);
    setShowMentionMenu(false);
  };

  return (
    <div
      data-testid="chat-panel"
      className="w-80 flex flex-col h-full bg-slate-950 border-l border-slate-800 select-none shadow-xl"
    >
      {/* Chat Header */}
      <div className="h-10 px-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-100">Room Chat</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
            {messages.length}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            No messages yet. Say hello or discuss code with your team!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentParticipant?.id === msg.senderId;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: msg.senderColor }}
                  />
                  <span className="font-medium text-slate-300">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  {msg.senderRole && (
                    <span className="text-[9px] text-slate-500">({msg.senderRole})</span>
                  )}
                  <span>•</span>
                  <span>{timeStr}</span>
                </div>

                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed break-words ${
                    isMe
                      ? 'bg-brand-600 text-white rounded-br-xs'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-xs'
                  }`}
                >
                  {formatChatMarkdown(msg.content)}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention helper popover */}
      {showMentionMenu && (
        <div className="p-2 border-t border-slate-800 bg-slate-900/90 text-xs space-y-1">
          <div className="text-[10px] text-slate-400 px-1 font-medium">Mention someone:</div>
          <div className="flex flex-wrap gap-1">
            {participants.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleInsertMention(p.displayName)}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                @{p.displayName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar (FR-COMM-01) */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-slate-800 bg-slate-900/60 flex flex-col gap-2"
      >
        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            type="button"
            onClick={() => setShowMentionMenu((prev) => !prev)}
            title="Mention participant"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <AtSign className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setInputText((prev) => `${prev}\`code\` `)}
            title="Insert inline code"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-end gap-1.5">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or @mention... (Enter to send)"
            className="flex-1 px-3 py-2 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-colors shrink-0"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
