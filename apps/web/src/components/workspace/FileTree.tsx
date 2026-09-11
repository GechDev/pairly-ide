'use client';

import React, { useState } from 'react';
import {
  FileCode,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  ChevronRight,
  ChevronDown,
  Github,
} from 'lucide-react';
import type { WorkspaceItem } from './workspaceState';
import { exportWorkspaceAsZip, importZipToWorkspace, triggerFileDownload } from '../../lib/zip';

export interface FileTreeProps {
  items: WorkspaceItem[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string, isFolder?: boolean, parentId?: string | null) => void;
  onDeleteFile: (fileId: string) => void;
  onImportItems: (items: WorkspaceItem[]) => void;
  onOpenGitHubImport?: () => void;
}

export function FileTree({
  items,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onImportItems,
  onOpenGitHubImport,
}: FileTreeProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'folder-src': true,
  });
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (folderId: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim(), false, null);
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleDownloadZip = async () => {
    const blob = await exportWorkspaceAsZip(items);
    triggerFileDownload(blob, 'pairly-workspace.zip');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const imported = await importZipToWorkspace(file);
        if (imported.length > 0) {
          onImportItems(imported);
        }
      } catch (err) {
        console.error('Failed to import zip:', err);
      }
    }
  };

  // Organize root items vs children
  const rootItems = items.filter((i) => !i.parentId);
  const getChildren = (parentId: string) => items.filter((i) => i.parentId === parentId);

  const renderItem = (item: WorkspaceItem, depth = 0) => {
    if (item.isFolder) {
      const isOpen = openFolders[item.id] ?? false;
      const children = getChildren(item.id);
      return (
        <div key={item.id} className="flex flex-col">
          <div
            onClick={() => toggleFolder(item.id)}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            className="flex items-center justify-between group py-1.5 px-2 rounded hover:bg-slate-800/60 cursor-pointer text-xs text-slate-300 transition-colors select-none"
          >
            <div className="flex items-center gap-1.5 overflow-hidden">
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span className="truncate font-mono">{item.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(item.id);
              }}
              title="Delete folder"
              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {isOpen && children.map((child) => renderItem(child, depth + 1))}
        </div>
      );
    }

    const isActive = activeFileId === item.id;
    return (
      <div
        key={item.id}
        onClick={() => onSelectFile(item.id)}
        style={{ paddingLeft: `${depth * 12 + 16}px` }}
        className={`flex items-center justify-between group py-1.5 px-2 rounded cursor-pointer text-xs transition-colors select-none ${
          isActive
            ? 'bg-slate-800 text-brand-300 font-medium'
            : 'text-slate-300 hover:bg-slate-800/40 hover:text-slate-100'
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
          <span className="truncate font-mono">{item.name}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFile(item.id);
          }}
          title="Delete file"
          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div
      id="workspace-filetree-container"
      data-testid="filetree-panel"
      className="flex-1 flex flex-col h-full bg-slate-900/40 select-none overflow-hidden"
    >
      {/* File Tree Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800/80">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            id="add-file-btn"
            onClick={() => setIsCreatingFile(true)}
            title="New File"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {onOpenGitHubImport && (
            <button
              id="import-github-btn"
              data-testid="import-github-btn"
              onClick={onOpenGitHubImport}
              title="Import GitHub Repository (FR-INT-01..02)"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
            </button>
          )}
          <label
            title="Import ZIP"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept=".zip"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            id="download-zip-btn"
            onClick={handleDownloadZip}
            title="Export as ZIP"
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-800/80">
          <input
            autoFocus
            type="text"
            placeholder="filename.ts"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onBlur={() => {
              if (!newFileName.trim()) setIsCreatingFile(false);
            }}
            className="w-full px-2 py-1 text-xs font-mono bg-slate-950 border border-brand-500 rounded text-slate-200 outline-none"
          />
        </form>
      )}

      {/* Items List */}
      <div className="flex-1 p-2 overflow-y-auto space-y-0.5">
        {rootItems.map((item) => renderItem(item))}
      </div>
    </div>
  );
}
