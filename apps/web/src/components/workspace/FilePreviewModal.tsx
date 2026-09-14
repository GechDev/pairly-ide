'use client';

import React, { useState } from 'react';
import {
  FileCode,
  X,
  Columns,
  FileText,
  Plus,
  RefreshCw,
  FolderPlus,
  AlertCircle,
} from 'lucide-react';

export interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileContent: string;
  currentCode?: string;
  currentFileName?: string;
  onAppend: (content: string) => void;
  onReplace: (content: string) => void;
  onSaveAsNewFile: (name: string, content: string) => void;
}

/**
 * File Diff & Preview Modal.
 * Direct architectural implementation from code-editor/apps/client/src/components/FilePreview.tsx
 * enhanced with modern responsive side-by-side diffing and file creation options.
 */
export function FilePreviewModal({
  isOpen,
  onClose,
  fileName,
  fileContent,
  currentCode = '',
  currentFileName = 'active file',
  onAppend,
  onReplace,
  onSaveAsNewFile,
}: FilePreviewModalProps) {
  const [viewMode, setViewMode] = useState<'diff' | 'raw'>('diff');

  if (!isOpen) return null;

  const currentLines = currentCode.split('\n');
  const incomingLines = fileContent.split('\n');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      data-testid="file-preview-modal"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="file-diff-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="file-diff-title"
                className="text-sm font-bold text-slate-100 flex items-center gap-2"
              >
                File Diff & Preview: <span className="font-mono text-indigo-400">{fileName}</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Compare imported file against active editor document before applying changes
              </p>
            </div>

            <div className="ml-4 flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('diff')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'diff'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                Side-by-Side Diff
              </button>
              <button
                type="button"
                onClick={() => setViewMode('raw')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'raw'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Incoming File Only
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diff Content Viewport */}
        <div className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs">
          {viewMode === 'diff' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Left Diff Section: Existing Code */}
              <div className="flex flex-col bg-slate-900/80 rounded-xl border border-rose-500/30 overflow-hidden">
                <div className="px-3 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 font-semibold text-xs flex items-center justify-between">
                  <span>Current Editor ({currentFileName})</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-200">
                    {currentLines.length} lines
                  </span>
                </div>
                <div className="p-3 overflow-x-auto whitespace-pre font-mono text-slate-300 flex-1 leading-relaxed">
                  {currentCode ? (
                    currentLines.map((line, idx) => (
                      <div key={idx} className="flex gap-3 hover:bg-rose-500/5 px-1 rounded">
                        <span className="text-slate-600 select-none w-8 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-300">{line || ' '}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 italic">// Current editor is empty</span>
                  )}
                </div>
              </div>

              {/* Right Diff Section: Incoming Code */}
              <div className="flex flex-col bg-slate-900/80 rounded-xl border border-emerald-500/30 overflow-hidden">
                <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 font-semibold text-xs flex items-center justify-between">
                  <span>Uploaded File ({fileName})</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                    {incomingLines.length} lines
                  </span>
                </div>
                <div className="p-3 overflow-x-auto whitespace-pre font-mono text-emerald-300/90 flex-1 leading-relaxed">
                  {incomingLines.map((line, idx) => (
                    <div key={idx} className="flex gap-3 hover:bg-emerald-500/5 px-1 rounded">
                      <span className="text-emerald-700/60 select-none w-8 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-emerald-200">{line || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 whitespace-pre font-mono text-slate-200 leading-relaxed overflow-x-auto">
              {incomingLines.map((line, idx) => (
                <div key={idx} className="flex gap-3 hover:bg-slate-800/50 px-1 rounded">
                  <span className="text-slate-600 select-none w-8 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <span>{line || ' '}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap justify-between items-center gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Choose how to incorporate <strong className="text-slate-200">{fileName}</strong> into your workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSaveAsNewFile(fileName, fileContent);
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              Save as New File
            </button>
            <button
              type="button"
              onClick={() => {
                onAppend(fileContent);
                onClose();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium rounded-lg text-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              Append to Active
            </button>
            <button
              type="button"
              onClick={() => {
                onReplace(fileContent);
                onClose();
              }}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Replace Active Content
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
