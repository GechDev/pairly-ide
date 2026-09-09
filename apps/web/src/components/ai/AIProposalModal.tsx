'use client';

import React, { useState } from 'react';
import { AiProposal } from '@pairly/contracts';
import { isProposalStale, rebaseProposal } from '@pairly/ai';
import { DiffViewer } from './DiffViewer';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitMerge,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export interface AIProposalModalProps {
  proposal: AiProposal | null;
  currentDocumentVersion: number | string;
  currentDocumentContent: string;
  originalDocumentContent?: string;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (proposal: AiProposal, finalCode: string) => void;
  onReject: (proposalId: string) => void;
  userCanApply?: boolean;
}

export function AIProposalModal({
  proposal,
  currentDocumentVersion,
  currentDocumentContent,
  originalDocumentContent = '',
  isOpen,
  onClose,
  onAccept,
  onReject,
  userCanApply = true,
}: AIProposalModalProps) {
  const [rebasedContent, setRebasedContent] = useState<string | null>(null);
  const [rebaseError, setRebaseError] = useState<string | null>(null);

  if (!isOpen || !proposal) return null;

  const stale = isProposalStale(proposal.baseDocumentVersion, currentDocumentVersion);

  const handleRebase = () => {
    if (!proposal.suggestedCode) return;
    const res = rebaseProposal(
      originalDocumentContent || currentDocumentContent,
      currentDocumentContent,
      proposal.suggestedCode,
    );

    if (res.hasConflict) {
      setRebaseError(res.conflictDetails || 'Conflicting edits detected. Please review manually.');
    } else {
      setRebasedContent(res.rebasedContent);
      setRebaseError(null);
    }
  };

  const handleConfirmAccept = () => {
    const finalCode = rebasedContent || proposal.suggestedCode || currentDocumentContent;
    onAccept(proposal, finalCode);
    onClose();
  };

  const handleConfirmReject = () => {
    onReject(proposal.proposalId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proposal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden text-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4 bg-gray-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="proposal-title" className="text-base font-bold text-gray-100">
                  AI Code Modification Proposal
                </h3>
                <span className="rounded-md bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
                  {proposal.action}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="font-mono text-gray-300">{proposal.filePath}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Base v{String(proposal.baseDocumentVersion)}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
            aria-label="Close proposal modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Explanation Banner */}
          <div className="rounded-xl border border-purple-900/30 bg-purple-950/20 p-4 text-xs text-purple-200 leading-relaxed">
            <div className="font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Assistant Explanation:
            </div>
            <p className="whitespace-pre-line">{proposal.explanation}</p>
          </div>

          {/* Stale Warning Banner (FR-AI-08) */}
          {stale && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-300 text-sm">
                      Stale Proposal Warning (Version Drift Detected)
                    </h4>
                    <p className="text-amber-200/90 mt-1">
                      This proposal was generated from base version{' '}
                      <span className="font-mono font-bold">v{String(proposal.baseDocumentVersion)}</span>,
                      but the active document has updated to{' '}
                      <span className="font-mono font-bold">v{String(currentDocumentVersion)}</span>.
                      Rebase the patch before applying to avoid overwriting concurrent edits.
                    </p>
                    {rebaseError && (
                      <p className="mt-2 text-rose-300 font-semibold flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4" />
                        {rebaseError}
                      </p>
                    )}
                    {rebasedContent && (
                      <p className="mt-2 text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Successfully rebased against current workspace version!
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRebase}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all flex-shrink-0"
                >
                  <GitMerge className="h-4 w-4" />
                  Rebase Patch
                </button>
              </div>
            </div>
          )}

          {/* Diff Viewer Component */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Reviewable Diff (FR-AI-04)
            </div>
            <DiffViewer diffText={proposal.diff} filePath={proposal.filePath} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-800 bg-gray-950/60 px-6 py-4">
          <div className="text-xs text-gray-500">
            {userCanApply
              ? 'Authorized participant: changes apply immediately to shared workspace upon acceptance.'
              : 'Viewer mode: You do not have permission to apply modifications.'}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirmReject}
              className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300 hover:bg-gray-700 hover:text-white transition-all"
            >
              <XCircle className="h-4 w-4 text-rose-400" />
              Reject Proposal
            </button>

            <button
              type="button"
              disabled={!userCanApply}
              onClick={handleConfirmAccept}
              className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold shadow-lg transition-all ${
                userCanApply
                  ? 'bg-purple-600 text-white hover:bg-purple-500 hover:shadow-purple-500/25'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Accept & Apply Diff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
