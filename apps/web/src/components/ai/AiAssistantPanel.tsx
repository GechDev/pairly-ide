'use client';

import React, { useState } from 'react';
import { AiAction, AiProposal } from '@pairly/contracts';
import { computeUnifiedDiff } from '@pairly/ai';
import {
  Sparkles,
  Send,
  Loader2,
  Bug,
  BookOpen,
  Wrench,
  TestTube,
  FileText,
  Code2,
  Check,
  Copy,
  Layers,
  ArrowRight,
} from 'lucide-react';

export interface AiAssistantPanelProps {
  roomCode: string;
  activeFilePath: string;
  activeFileContent: string;
  selectedText?: string;
  documentVersion?: number | string;
  userRole?: string;
  onOpenProposal: (proposal: AiProposal) => void;
  terminalError?: string;
  className?: string;
}

export function AiAssistantPanel({
  roomCode,
  activeFilePath,
  activeFileContent,
  selectedText,
  documentVersion = 1,
  userRole = 'EDITOR',
  onOpenProposal,
  terminalError,
  className = '',
}: AiAssistantPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState<AiAction>('EXPLAIN');
  const [selectedModel, setSelectedModel] = useState<string>('claude-3-5-sonnet');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastResponse, setLastResponse] = useState<{
    explanation: string;
    suggestedCode?: string;
    tokensUsed?: { total: number };
  } | null>(null);

  const actionButtons: Array<{ id: AiAction; label: string; icon: React.ReactNode }> = [
    { id: 'EXPLAIN', label: 'Explain Code', icon: <BookOpen className="h-3.5 w-3.5" /> },
    { id: 'FIND_BUGS', label: 'Find Bugs', icon: <Bug className="h-3.5 w-3.5 text-rose-400" /> },
    { id: 'REFACTOR', label: 'Refactor', icon: <Wrench className="h-3.5 w-3.5 text-amber-400" /> },
    { id: 'GENERATE_TESTS', label: 'Generate Tests', icon: <TestTube className="h-3.5 w-3.5 text-emerald-400" /> },
    { id: 'DOCUMENT', label: 'Add Docs', icon: <FileText className="h-3.5 w-3.5 text-blue-400" /> },
    { id: 'GENERATE_CODE', label: 'Generate Code', icon: <Code2 className="h-3.5 w-3.5 text-purple-400" /> },
  ];

  const handleSubmit = async (overrideAction?: AiAction) => {
    const act = overrideAction || selectedAction;
    setLoading(true);

    try {
      const res = await fetch(`/api/v1/rooms/${roomCode}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': userRole,
        },
        body: JSON.stringify({
          action: act,
          prompt: prompt.trim() || undefined,
          model: selectedModel,
          context: {
            activeFile: {
              path: activeFilePath || 'index.ts',
              content: activeFileContent || '',
              language: activeFilePath?.endsWith('.py')
                ? 'python'
                : activeFilePath?.endsWith('.rs')
                  ? 'rust'
                  : 'typescript',
              selection: selectedText
                ? {
                    startLine: 1,
                    startColumn: 1,
                    endLine: 1,
                    endColumn: 1,
                    text: selectedText,
                  }
                : undefined,
            },
            terminalOutput: terminalError,
            errorContext: terminalError ? { message: terminalError } : undefined,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`AI Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setLastResponse(data);

      // If suggested code is generated, prepare proposal
      if (data.suggestedCode && act !== 'EXPLAIN') {
        const diffRes = computeUnifiedDiff(
          activeFileContent || '',
          data.suggestedCode,
          activeFilePath || 'file.ts',
        );

        const proposal: AiProposal = {
          proposalId: `prop-${Date.now()}`,
          action: act,
          filePath: activeFilePath || 'file.ts',
          baseDocumentVersion: documentVersion,
          explanation: data.explanation,
          diff: diffRes.diffText,
          suggestedCode: data.suggestedCode,
          status: 'PENDING',
          createdAt: Date.now(),
        };

        onOpenProposal(proposal);
      }
    } catch (err) {
      console.error('AI invocation failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (lastResponse?.suggestedCode || lastResponse?.explanation) {
      navigator.clipboard.writeText(lastResponse.suggestedCode || lastResponse.explanation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-gray-950 text-gray-200 border-l border-gray-800 ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-gray-800/80 bg-gray-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-200">Pairly Agent</h4>
            <span className="text-[10px] text-purple-400 font-medium">AI Pair Programmer (FR-AI-01)</span>
          </div>
        </div>

        {/* Model Selector */}
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="rounded-lg bg-gray-900 border border-gray-700/80 px-2 py-1 text-[11px] text-gray-300 font-mono focus:border-purple-500 focus:outline-none"
        >
          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
          <option value="gpt-4o">OpenAI GPT-4o</option>
          <option value="mock">Pairly Mock Engine</option>
        </select>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-3.5 flex flex-col space-y-3.5 overflow-y-auto">
        {/* Context Disclosure Badge (FR-AI-07) */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-2.5 text-[11px] text-gray-400 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <Layers className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
            <span className="truncate">
              Target: <code className="text-gray-200">{activeFilePath || 'Active buffer'}</code>
            </span>
          </div>
          {selectedText && (
            <span className="rounded bg-purple-950/60 text-purple-300 px-1.5 py-0.5 text-[10px] border border-purple-800/40 font-mono">
              Selection ({selectedText.length}c)
            </span>
          )}
        </div>

        {/* Action Pills */}
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Quick Actions
          </span>
          <div className="grid grid-cols-2 gap-2">
            {actionButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setSelectedAction(btn.id);
                  handleSubmit(btn.id);
                }}
                disabled={loading}
                className={`px-2.5 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
                  selectedAction === btn.id
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-sm'
                    : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700 hover:text-gray-300'
                }`}
              >
                {btn.icon}
                <span className="truncate">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input */}
        <div className="flex-1 flex flex-col min-h-[140px]">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
            Instructions / Query
          </span>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                handleSubmit();
              }
            }}
            placeholder="Ask Pairly Agent (e.g. Optimize array iterations, check for memory leaks)..."
            className="w-full flex-1 rounded-xl border border-gray-800 bg-gray-900/80 p-3 text-xs text-gray-200 placeholder-gray-500 focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/40 focus:outline-none resize-none font-sans leading-relaxed"
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-purple-500 hover:shadow-purple-500/25 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing & Generating...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Invoke AI Assistant</span>
            </>
          )}
        </button>

        {/* Latest Response Card */}
        {lastResponse && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/90 p-3 text-xs space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
              <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Latest Output
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-200 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
              {lastResponse.explanation}
            </p>

            {lastResponse.suggestedCode && (
              <button
                type="button"
                onClick={() => {
                  const diffRes = computeUnifiedDiff(
                    activeFileContent || '',
                    lastResponse.suggestedCode!,
                    activeFilePath || 'file.ts',
                  );
                  onOpenProposal({
                    proposalId: `prop-${Date.now()}`,
                    action: selectedAction,
                    filePath: activeFilePath || 'file.ts',
                    baseDocumentVersion: documentVersion,
                    explanation: lastResponse.explanation,
                    diff: diffRes.diffText,
                    suggestedCode: lastResponse.suggestedCode,
                    status: 'PENDING',
                    createdAt: Date.now(),
                  });
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-600/10 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600/20 transition-all mt-2"
              >
                <span>Review Proposal Diff</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
