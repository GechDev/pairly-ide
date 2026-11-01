'use client';

import React, { useState, useEffect } from 'react';
import {
  Github,
  GitCommit,
  GitBranch,
  FileCode,
  Check,
  ExternalLink,
  X,
  AlertCircle,
  Loader2,
  FolderGit2,
  Key,
  ShieldCheck,
} from 'lucide-react';
import type { GitHubRepoItem } from '../../lib/githubClient';

export interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFileName?: string;
  activeFileContent?: string;
}

export function GitHubExportModal({
  isOpen,
  onClose,
  activeFileName = 'untitled.ts',
  activeFileContent = '',
}: GitHubExportModalProps) {
  const [repos, setRepos] = useState<GitHubRepoItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [branch, setBranch] = useState<string>('main');
  const [filePath, setFilePath] = useState<string>(activeFileName);
  const [commitMessage, setCommitMessage] = useState<string>(
    `Update ${activeFileName} via Pairly IDE`,
  );
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [commitSuccessUrl, setCommitSuccessUrl] = useState<string | null>(null);

  // Live GitHub Token Support (T-28)
  const [patToken, setPatToken] = useState<string>('');
  const [showTokenSettings, setShowTokenSettings] = useState<boolean>(false);
  const [inputToken, setInputToken] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setCommitSuccessUrl(null);
      setError(null);
      return;
    }

    setFilePath(activeFileName);
    setCommitMessage(`Update ${activeFileName} via Pairly IDE`);

    const stored =
      typeof window !== 'undefined' ? localStorage.getItem('pairly_github_pat') || '' : '';
    setPatToken(stored);
    setInputToken(stored);

    fetchRepos(stored);
  }, [isOpen, activeFileName]);

  const fetchRepos = async (tokenOverride?: string) => {
    setIsLoadingRepos(true);
    setError(null);
    try {
      const token = tokenOverride !== undefined ? tokenOverride : patToken;
      const headers: Record<string, string> = {};
      if (token && token.trim()) {
        headers['Authorization'] = `Bearer ${token.trim()}`;
      }

      const res = await fetch('/api/v1/integrations/github/repos', { headers });
      if (res.ok) {
        const raw = await res.json();
        const data: GitHubRepoItem[] = Array.isArray(raw) ? raw : raw.repos || [];
        setRepos(data);
        if (data.length > 0 && !selectedRepo) {
          setSelectedRepo(data[0].fullName);
        }
      }
    } catch (err) {
      console.error('Failed to load repositories', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputToken.trim();
    setPatToken(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('pairly_github_pat', trimmed);
      } else {
        localStorage.removeItem('pairly_github_pat');
      }
    }
    setShowTokenSettings(false);
    fetchRepos(trimmed);
  };

  const handleClearToken = () => {
    setPatToken('');
    setInputToken('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pairly_github_pat');
    }
    fetchRepos('');
  };

  if (!isOpen) return null;

  const isLive = Boolean(
    patToken && patToken.trim() && patToken !== 'mock-token' && !patToken.startsWith('mock_'),
  );

  const handleCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo) {
      setError('Please select or specify a repository');
      return;
    }
    if (!filePath.trim()) {
      setError('Please enter a target file path');
      return;
    }

    const [owner, repo] = selectedRepo.includes('/')
      ? selectedRepo.split('/')
      : ['pairly-team', selectedRepo];

    setIsCommitting(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (patToken && patToken.trim()) {
        headers['Authorization'] = `Bearer ${patToken.trim()}`;
      }

      const res = await fetch('/api/v1/integrations/github/commit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          owner,
          repo,
          path: filePath.trim(),
          content: activeFileContent,
          message: commitMessage.trim(),
          branch: branch.trim() || 'main',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to commit changes');
      }

      setCommitSuccessUrl(data.commitUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error committing to GitHub');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div
      data-testid="github-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCommitting) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <header className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">Commit to GitHub Repository</h3>
                {isLive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-3 w-3" />
                    Live API
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Push current file changes directly to a GitHub branch (CodeX Inspired)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTokenSettings(!showTokenSettings)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-all ${
                showTokenSettings
                  ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                  : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-750'
              }`}
              title="Configure Personal Access Token"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isLive ? 'Token Set' : 'Token'}</span>
            </button>
            <button
              type="button"
              data-testid="close-export-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Token Configuration Banner */}
        {showTokenSettings && (
          <form
            onSubmit={handleSaveToken}
            className="border-b border-slate-800 bg-slate-950/90 p-4 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">
                Personal Access Token (PAT)
              </span>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-brand-400 hover:underline"
              >
                Generate Token ↗
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-600 hover:bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              >
                Save
              </button>
              {patToken && (
                <button
                  type="button"
                  onClick={handleClearToken}
                  className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1.5 text-xs text-rose-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        )}

        {commitSuccessUrl ? (
          /* Success Screen */
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-100">Commit Successful!</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                File <span className="font-mono text-slate-200">{filePath}</span> has been committed
                to branch <span className="font-mono text-slate-200">{branch}</span>.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={commitSuccessUrl}
                target="_blank"
                rel="noreferrer"
                data-testid="view-commit-btn"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View on GitHub</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Commit Form */
          <form onSubmit={handleCommit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Repository */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-brand-400" />
                <span>Repository</span>
              </label>

              {isLoadingRepos ? (
                <div className="text-xs text-slate-500 py-1">Loading repositories...</div>
              ) : repos.length > 0 ? (
                <select
                  data-testid="repo-select"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-sans"
                >
                  {repos.map((r) => (
                    <option key={r.id} value={r.fullName}>
                      {r.fullName} {r.isPrivate ? '(Private)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="owner/repository"
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                />
              )}
            </div>

            {/* Branch and Path Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-brand-400" />
                  <span>Branch</span>
                </label>
                <input
                  type="text"
                  data-testid="branch-input"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-brand-400" />
                  <span>File Path in Repo</span>
                </label>
                <input
                  type="text"
                  data-testid="filepath-input"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="src/index.ts"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            {/* Commit Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-brand-400" />
                <span>Commit Message</span>
              </label>
              <textarea
                rows={2}
                data-testid="commit-message-input"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message describing changes..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-brand-500 font-sans resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isCommitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isCommitting || !selectedRepo}
                data-testid="submit-commit-btn"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCommitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Committing...</span>
                  </>
                ) : (
                  <>
                    <GitCommit className="w-3.5 h-3.5" />
                    <span>Commit Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
