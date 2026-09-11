'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  UserX,
} from 'lucide-react';
import type { ParticipantIdentity } from '@pairly/contracts';

export interface AbuseReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  reporterId: string;
  participants: ParticipantIdentity[];
  activeFileName?: string;
}

export function AbuseReportModal({
  isOpen,
  onClose,
  roomCode,
  reporterId,
  participants,
  activeFileName,
}: AbuseReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    'HARASSMENT' | 'MALICIOUS_CODE' | 'SPAM' | 'SECURITY_VIOLATION' | 'OTHER'
  >('HARASSMENT');
  const [reportedParticipantId, setReportedParticipantId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      setError('Please provide a brief description (minimum 5 characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: roomCode,
          reporterId,
          reportedParticipantId: reportedParticipantId || undefined,
          category: selectedCategory,
          description: description.trim(),
          contextSnapshot: {
            activeFileName,
            timestamp: Date.now(),
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit report. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Report Abuse or Violation</h3>
              <p className="text-xs text-slate-400">
                Reports are sent immediately to room administrators (FR-ADMIN-01)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto animate-in zoom-in-50 duration-200" />
            <h4 className="text-sm font-bold text-emerald-300">Report Submitted</h4>
            <p className="text-xs text-slate-400">
              Thank you for keeping Pairly safe. Our moderation system will review this report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Offending Participant (Optional) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Participant to Report
              </label>
              <select
                value={reportedParticipantId}
                onChange={(e) => setReportedParticipantId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
              >
                <option value="">General Room / Unknown Participant</option>
                {participants
                  .filter((p) => p.id !== reporterId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName} ({p.role})
                    </option>
                  ))}
              </select>
            </div>

            {/* Violation Category */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Violation Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'HARASSMENT', label: 'Harassment' },
                  { id: 'MALICIOUS_CODE', label: 'Malicious Code' },
                  { id: 'SPAM', label: 'Spam / Disruption' },
                  { id: 'SECURITY_VIOLATION', label: 'Security Breach' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                      selectedCategory === cat.id
                        ? 'bg-rose-600/20 text-rose-300 border-rose-500/50'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Description of Incident
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what occurred, including actions or harmful code injected..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-200 placeholder-slate-500 focus:border-brand-500 focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Submit Abuse Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
