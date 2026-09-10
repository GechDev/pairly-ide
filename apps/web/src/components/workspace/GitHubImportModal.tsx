'use client';

import React, { useState, useEffect } from 'react';
import {
  Github,
  Search,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  Download,
  AlertCircle,
} from 'lucide-react';
import type { GitHubRepoItem, GitHubImportFile } from '../../lib/githubClient';

export interface GitHubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportFiles: (files: GitHubImportFile[], repoName: string) => void;
}

export function GitHubImportModal({
  isOpen,
  onClose,
  onImportFiles,
}: GitHubImportModalProps) {
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRepos();
    }
  }, [isOpen]);

  const loadRepos = async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/v1/integrations/github/repos?query=${encodeURIComponent(query)}`
        : '/api/v1/integrations/github/repos';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load repositories');
      const data = await res.json();
      setRepos(data.repos || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRepos(search);
  };

  const handleImport = async (repo: GitHubRepoItem) => {
    setImportingId(repo.id);
    setError(null);

    try {
      const parts = repo.fullName.split('/');
      const owner = parts[0] || 'pairly-team';
      const repoName = parts[1] || repo.name;

      const res = await fetch('/api/v1/integrations/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo: repoName,
          branch: repo.defaultBranch,
        }),
      });

      if (!res.ok) throw new Error('Repository import failed');
      const data = await res.json();

      if (data.files && data.files.length > 0) {
        onImportFiles(data.files, repo.name);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImportingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-white border border-slate-700">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Import GitHub Repository</h3>
              <p className="text-xs text-slate-400">
                Browse public and private repositories to import files into your room (FR-INT-01..02)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search repositories by name or description..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-2.5 pl-10 pr-24 text-xs text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Repo List */}
        <div className="flex-1 overflow-y-auto max-h-[380px] p-4 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-brand-400 mb-2" />
              <span className="text-xs font-medium">Fetching repositories from GitHub...</span>
            </div>
          ) : repos.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              No repositories found matching your query.
            </div>
          ) : (
            repos.map((repo) => {
              const isImporting = importingId === repo.id;
              return (
                <div
                  key={repo.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 hover:border-slate-700 transition-all"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200 hover:text-brand-300 truncate font-mono">
                        {repo.fullName}
                      </span>
                      {repo.isPrivate ? (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-amber-400 border border-slate-700">
                          <Lock className="h-2.5 w-2.5" />
                          Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-700">
                          <Globe className="h-2.5 w-2.5" />
                          Public
                        </span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isImporting || importingId !== null}
                    onClick={() => handleImport(repo)}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-all flex-shrink-0 disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Import</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-3 text-xs text-slate-500">
          <span>Files are imported directly into the active collaborative workspace.</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
