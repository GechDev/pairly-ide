'use client';

import React, { useState } from 'react';
import { Columns, AlignJustify, Plus, Minus, FileCode } from 'lucide-react';

export interface DiffViewerProps {
  diffText: string;
  filePath?: string;
  className?: string;
}

interface ParsedDiffLine {
  type: 'add' | 'delete' | 'unchanged' | 'header';
  text: string;
  oldNum?: number;
  newNum?: number;
}

export function DiffViewer({ diffText, filePath = 'code.ts', className = '' }: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  // Parse unified diff into structured lines
  const lines = React.useMemo(() => {
    const rawLines = diffText.split('\n');
    const parsed: ParsedDiffLine[] = [];
    let oldCounter = 1;
    let newCounter = 1;

    for (const line of rawLines) {
      if (line.startsWith('---') || line.startsWith('+++')) {
        parsed.push({ type: 'header', text: line });
      } else if (line.startsWith('@@')) {
        parsed.push({ type: 'header', text: line });
        // Extract start line if available
        const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          if (match[1]) oldCounter = parseInt(match[1], 10);
          if (match[2]) newCounter = parseInt(match[2], 10);
        }
      } else if (line.startsWith('+')) {
        parsed.push({
          type: 'add',
          text: line.slice(1),
          newNum: newCounter++,
        });
      } else if (line.startsWith('-')) {
        parsed.push({
          type: 'delete',
          text: line.slice(1),
          oldNum: oldCounter++,
        });
      } else {
        const text = line.startsWith(' ') ? line.slice(1) : line;
        parsed.push({
          type: 'unchanged',
          text,
          oldNum: oldCounter++,
          newNum: newCounter++,
        });
      }
    }
    return parsed;
  }, [diffText]);

  const addCount = lines.filter((l) => l.type === 'add').length;
  const delCount = lines.filter((l) => l.type === 'delete').length;

  return (
    <div
      className={`flex flex-col rounded-xl border border-gray-800 bg-gray-950/90 shadow-2xl backdrop-blur-md overflow-hidden text-gray-200 ${className}`}
    >
      {/* Diff Header */}
      <div className="flex items-center justify-between border-b border-gray-800/80 bg-gray-900/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-purple-400" />
          <span className="font-mono text-xs font-semibold text-gray-300">{filePath}</span>
          <div className="flex items-center gap-1.5 ml-3">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              <Plus className="h-3 w-3" />
              {addCount}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
              <Minus className="h-3 w-3" />
              {delCount}
            </span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border border-gray-800 bg-gray-900/90 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('unified')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === 'unified'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Unified View"
          >
            <AlignJustify className="h-3.5 w-3.5" />
            <span>Unified</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Split View"
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Split</span>
          </button>
        </div>
      </div>

      {/* Diff Content View */}
      <div className="overflow-x-auto overflow-y-auto max-h-[440px] font-mono text-xs leading-relaxed select-text">
        {viewMode === 'unified' ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                if (line.type === 'header') {
                  return (
                    <tr key={idx} className="bg-purple-950/20 text-purple-300 font-bold border-y border-purple-900/30">
                      <td colSpan={3} className="px-4 py-1.5 text-[11px] select-none text-purple-400/90">
                        {line.text}
                      </td>
                    </tr>
                  );
                }

                const isAdd = line.type === 'add';
                const isDel = line.type === 'delete';

                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${
                      isAdd
                        ? 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-200'
                        : isDel
                          ? 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-200'
                          : 'hover:bg-gray-900/50 text-gray-300'
                    }`}
                  >
                    <td className="w-10 select-none text-right pr-2 text-gray-600 font-mono text-[11px]">
                      {line.oldNum ?? ''}
                    </td>
                    <td className="w-10 select-none text-right pr-3 text-gray-600 font-mono text-[11px] border-r border-gray-800/80">
                      {line.newNum ?? ''}
                    </td>
                    <td className="px-3 py-0.5 whitespace-pre font-mono">
                      <span className="inline-block w-4 select-none font-bold">
                        {isAdd ? '+' : isDel ? '-' : ' '}
                      </span>
                      {line.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* Split View */
          <div className="grid grid-cols-2 divide-x divide-gray-800">
            {/* Left: Original */}
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => {
                  if (line.type === 'header') return null;
                  if (line.type === 'add') {
                    return (
                      <tr key={`left-${idx}`} className="bg-gray-950/30">
                        <td className="w-10 select-none text-right pr-2 text-gray-700">-</td>
                        <td className="px-3 py-0.5 select-none text-gray-700">&nbsp;</td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={`left-${idx}`}
                      className={line.type === 'delete' ? 'bg-rose-950/30 text-rose-200' : 'text-gray-300'}
                    >
                      <td className="w-10 select-none text-right pr-2 text-gray-600 font-mono text-[11px] border-r border-gray-800/80">
                        {line.oldNum}
                      </td>
                      <td className="px-3 py-0.5 whitespace-pre font-mono">
                        {line.type === 'delete' && <span className="font-bold select-none mr-2">-</span>}
                        {line.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Right: Suggested */}
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => {
                  if (line.type === 'header') return null;
                  if (line.type === 'delete') {
                    return (
                      <tr key={`right-${idx}`} className="bg-gray-950/30">
                        <td className="w-10 select-none text-right pr-2 text-gray-700">+</td>
                        <td className="px-3 py-0.5 select-none text-gray-700">&nbsp;</td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={`right-${idx}`}
                      className={line.type === 'add' ? 'bg-emerald-950/30 text-emerald-200' : 'text-gray-300'}
                    >
                      <td className="w-10 select-none text-right pr-2 text-gray-600 font-mono text-[11px] border-r border-gray-800/80">
                        {line.newNum}
                      </td>
                      <td className="px-3 py-0.5 whitespace-pre font-mono">
                        {line.type === 'add' && <span className="font-bold select-none mr-2">+</span>}
                        {line.text}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
