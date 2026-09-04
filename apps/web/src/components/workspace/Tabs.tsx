'use client';

import React from 'react';
import { FileCode, X } from 'lucide-react';
import type { WorkspaceItem } from './workspaceState';

export interface TabsProps {
  items: WorkspaceItem[];
  openTabIds: string[];
  activeFileId: string | null;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

export function Tabs({
  items,
  openTabIds,
  activeFileId,
  onSelectTab,
  onCloseTab,
}: TabsProps) {
  const openItems = openTabIds
    .map((id) => items.find((i) => i.id === id))
    .filter((item): item is WorkspaceItem => Boolean(item && !item.isFolder));

  return (
    <div
      id="workspace-tabs-strip"
      data-testid="workspace-tabs"
      className="h-9 border-b border-slate-800 bg-slate-900/30 px-2 flex items-center gap-1 overflow-x-auto select-none"
    >
      {openItems.map((item) => {
        const isActive = activeFileId === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-t text-xs font-mono cursor-pointer transition-colors border-b-2 ${
              isActive
                ? 'bg-slate-950 border-brand-500 text-slate-100 font-medium'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileCode
              className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-500'}`}
            />
            <span>{item.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(item.id);
              }}
              title="Close tab"
              className="p-0.5 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
