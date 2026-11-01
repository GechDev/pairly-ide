'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Settings,
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Sliders,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('Alex Developer');
  const [email, setEmail] = useState('alex@example.com');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState(14);
  const [tabSize, setTabSize] = useState(2);
  const [aiSuggestions, setAiSuggestions] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Fetch profile
    fetch('/api/v1/users/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || '');
          setEmail(data.user.email || '');
          if (data.user.preferences) {
            setTheme(data.user.preferences.theme || 'dark');
            setFontSize(data.user.preferences.fontSize || 14);
            setTabSize(data.user.preferences.tabSize || 2);
            if (data.user.preferences.aiSuggestions !== undefined) {
              setAiSuggestions(data.user.preferences.aiSuggestions);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          preferences: { theme, fontSize, tabSize, aiSuggestions },
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/v1/users/me/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pairly-user-data-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/v1/users/me', {
        method: 'DELETE',
      });
      if (res.ok) {
        window.location.href = '/';
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[var(--fg-primary)] flex flex-col font-sans"
      style={{ backgroundColor: 'var(--canvas)' }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 60% 30% at 50% 0%, rgba(255, 0, 0, 0.08), transparent 70%)',
        }}
      />

      {/* Main Container */}
      <main className="relative flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">
        {/* Page Title */}
        <div
          className="flex items-start gap-4 pb-6 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="p-3 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(255, 0, 0, 0.08)',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              color: 'var(--accent-teal)',
            }}
          >
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--fg-primary)]">
              Account &amp; Workspace Preferences
            </h1>
            <p className="text-xs text-[var(--fg-muted)] mt-1">
              Personalize your Monaco editor environment, developer identity, and manage GDPR data
              exports.
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <div
          className="rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm transition-all"
          style={{
            backgroundColor: 'var(--canvas-subtle)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="flex items-center justify-between mb-6 pb-5 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background: 'var(--canvas-elevated)',
                  border: '1px solid var(--border-prominent)',
                  color: 'var(--accent-teal)',
                }}
              >
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--fg-primary)]">
                  Profile Information
                </h2>
                <p className="text-xs text-[var(--fg-muted)]">
                  Update your global display name and notification email
                </p>
              </div>
            </div>
            {saveSuccess && (
              <span
                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg"
                style={{
                  background: 'rgba(255, 0, 0, 0.1)',
                  color: 'var(--accent-teal)',
                  border: '1px solid rgba(255, 0, 0, 0.3)',
                }}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Preferences Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg-primary)] transition-all focus:outline-none"
                  style={{
                    backgroundColor: 'var(--canvas-elevated)',
                    border: '1px solid var(--border-prominent)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-teal)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-prominent)')}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl px-3.5 py-2.5 text-xs text-[var(--fg-primary)] transition-all focus:outline-none"
                  style={{
                    backgroundColor: 'var(--canvas-elevated)',
                    border: '1px solid var(--border-prominent)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--accent-teal)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-prominent)')}
                />
              </div>
            </div>

            {/* Editor Preferences */}
            <div className="pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-secondary)] mb-4 flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-[var(--accent-teal)]" />
                Monaco Editor Environment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-[var(--fg-muted)]">
                      Font Size
                    </label>
                    <span className="text-xs font-mono text-[var(--accent-teal)]">
                      {fontSize}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-[var(--accent-teal)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                    Tab Indentation
                  </label>
                  <select
                    value={tabSize}
                    onChange={(e) => setTabSize(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl px-3 py-2 text-xs text-[var(--fg-primary)] transition-all focus:outline-none"
                    style={{
                      backgroundColor: 'var(--canvas-elevated)',
                      border: '1px solid var(--border-prominent)',
                    }}
                  >
                    <option value="2">2 spaces (Recommended)</option>
                    <option value="4">4 spaces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                    AI In-Editor Assistant
                  </label>
                  <button
                    type="button"
                    onClick={() => setAiSuggestions(!aiSuggestions)}
                    className="w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{
                      backgroundColor: aiSuggestions
                        ? 'rgba(255, 0, 0, 0.1)'
                        : 'var(--canvas-elevated)',
                      borderColor: aiSuggestions
                        ? 'rgba(255, 0, 0, 0.4)'
                        : 'var(--border-prominent)',
                      color: aiSuggestions ? 'var(--accent-teal)' : 'var(--fg-muted)',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiSuggestions ? 'Active & Suggesting' : 'Muted'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent-teal)',
                  color: '#090A0D',
                }}
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Data Privacy & GDPR Section (FR-ACCT-03..04, AT-11) */}
        <div
          className="rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6"
          style={{
            backgroundColor: 'var(--canvas-subtle)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="flex items-center gap-3.5 pb-5 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: 'rgba(0, 194, 255, 0.08)',
                border: '1px solid rgba(0, 194, 255, 0.25)',
                color: 'var(--accent-cyan)',
              }}
            >
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--fg-primary)]">
                Data Privacy &amp; Controls (GDPR)
              </h2>
              <p className="text-xs text-[var(--fg-muted)]">
                Manage your personal data exports, room ownership, and privacy compliance
              </p>
            </div>
          </div>

          {/* Export Data Card */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl p-5"
            style={{
              backgroundColor: 'var(--canvas-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <h4 className="text-xs font-bold text-[var(--fg-primary)]">
                Export All Account Data
              </h4>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">
                Download a JSON archive containing your profile, preferences, hosted rooms, and
                checkpoints (FR-ACCT-03).
              </p>
            </div>
            <button
              type="button"
              data-testid="export-data-btn"
              disabled={exporting}
              onClick={handleExportData}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-[var(--fg-primary)] transition-all flex-shrink-0 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--canvas-subtle)',
                border: '1px solid var(--border-prominent)',
              }}
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[var(--accent-cyan)]" />
              )}
              <span>Export JSON Archive</span>
            </button>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone: Delete Account
                </h4>
                <p className="text-[11px] text-rose-300/80 mt-1">
                  Permanently delete your profile and cascade delete all hosted rooms and
                  checkpoints (FR-ACCT-04, AT-11).
                </p>
              </div>
              <button
                type="button"
                data-testid="delete-account-btn"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-all flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4"
            style={{
              backgroundColor: 'var(--canvas-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-300">Confirm Account Deletion</h3>
                <p className="text-xs text-[var(--fg-muted)]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">
              Are you sure you want to delete your account? All hosted rooms, participant records,
              and workspace snapshots will be permanently deleted per GDPR specifications.
            </p>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[var(--fg-secondary)] hover:text-white transition-all"
                style={{
                  backgroundColor: 'var(--canvas-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
