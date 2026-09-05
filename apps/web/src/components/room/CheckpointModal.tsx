'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Plus, RotateCcw, X, Loader2, Check, AlertCircle } from 'lucide-react';

export interface SnapshotItem {
  id: string;
  roomId: string;
  version: number;
  name: string;
  sizeBytes: number;
  createdById: string | null;
  createdAt: string;
}

interface CheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isHostOrEditor?: boolean;
  onSnapshotRestored?: (snapshotId: string, version: number) => void;
}

export function CheckpointModal({
  isOpen,
  onClose,
  roomCode,
  isHostOrEditor = true,
  onSnapshotRestored,
}: CheckpointModalProps) {
  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [checkpointName, setCheckpointName] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchSnapshots = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/rooms/${roomCode}/snapshots`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots || []);
      }
    } catch {
      setStatusMessage({ text: 'Failed to fetch snapshots', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots();
      setStatusMessage(null);
    }
  }, [isOpen, fetchSnapshots]);

  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkpointName.trim() || isCreating) return;

    setIsCreating(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/rooms/${roomCode}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: checkpointName.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setCheckpointName('');
        setStatusMessage({ text: `Checkpoint "${data.snapshot.name}" created`, type: 'success' });
        fetchSnapshots();
      } else {
        const err = await res.json();
        setStatusMessage({ text: err.error || 'Failed to create checkpoint', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Error connecting to snapshot service', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreCheckpoint = async (snapshot: SnapshotItem) => {
    if (!confirm(`Are you sure you want to restore "${snapshot.name}" (v${snapshot.version})? This will overwrite active room state.`)) {
      return;
    }

    setRestoringId(snapshot.id);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/rooms/${roomCode}/snapshots/${snapshot.id}/restore`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMessage({ text: `Successfully restored version ${data.version}`, type: 'success' });
        if (onSnapshotRestored) {
          onSnapshotRestored(snapshot.id, data.version);
        }
      } else {
        const err = await res.json();
        setStatusMessage({ text: err.error || 'Failed to restore checkpoint', type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'Restore failed due to network error', type: 'error' });
    } finally {
      setRestoringId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkpoint-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 id="checkpoint-modal-title" className="text-sm font-semibold text-slate-100">
                Workspace Checkpoints
              </h2>
              <p className="text-xs text-slate-400">
                Save manual rollback points or restore previous versions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Checkpoint Form */}
        {isHostOrEditor && (
          <form
            onSubmit={handleCreateCheckpoint}
            className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="e.g. Before refactoring AST..."
              value={checkpointName}
              onChange={(e) => setCheckpointName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!checkpointName.trim() || isCreating}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-medium transition-colors whitespace-nowrap"
            >
              {isCreating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Create</span>
            </button>
          </form>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`px-4 py-2 text-xs flex items-center gap-2 border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50'
                : 'bg-rose-950/40 text-rose-300 border-rose-900/50'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Snapshots List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Loading checkpoints...</span>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No checkpoints recorded yet. Create one before making large changes!
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-brand-300 border border-slate-700">
                    v{snap.version}
                  </span>
                  <div>
                    <div className="text-xs font-medium text-slate-200">{snap.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(snap.createdAt).toLocaleDateString()} {new Date(snap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {(snap.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>

                {isHostOrEditor && (
                  <button
                    onClick={() => handleRestoreCheckpoint(snap)}
                    disabled={restoringId === snap.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 transition-colors"
                  >
                    {restoringId === snap.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    <span>Restore</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center text-xs text-slate-400">
          <span>{snapshots.length} checkpoint{snapshots.length === 1 ? '' : 's'} recorded</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
