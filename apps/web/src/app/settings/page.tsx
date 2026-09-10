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
  Code2,
  AlertTriangle,
  ArrowLeft,
  Moon,
  Sun,
  Sliders,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Pairly</span>
          </Link>
          <span className="text-slate-600">/</span>
          <h1 className="text-sm font-bold text-slate-200">Account & Privacy Settings</h1>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30">
          <Settings className="h-4 w-4" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-brand-400 font-bold border border-slate-700">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-100">Profile Information</h2>
                <p className="text-xs text-slate-400">Update your display name and email address</p>
              </div>
            </div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Settings Saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3.5 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Editor Preferences */}
            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-brand-400" />
                Editor Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Font Size ({fontSize}px)
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="20"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Tab Size</label>
                  <select
                    value={tabSize}
                    onChange={(e) => setTabSize(parseInt(e.target.value, 10))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="2">2 spaces</option>
                    <option value="4">4 spaces</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    AI In-Editor Assistant
                  </label>
                  <button
                    type="button"
                    onClick={() => setAiSuggestions(!aiSuggestions)}
                    className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      aiSuggestions
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                        : 'bg-slate-950/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    {aiSuggestions ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-5 py-2 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Data Privacy & GDPR Section (FR-ACCT-03..04, AT-11) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800/80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Data Privacy & Controls (GDPR)</h2>
              <p className="text-xs text-slate-400">
                Manage your personal data exports, room ownership, and privacy compliance
              </p>
            </div>
          </div>

          {/* Export Data Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200">Export All Account Data</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Download a JSON archive containing your profile, preferences, hosted rooms, and checkpoints (FR-ACCT-03).
              </p>
            </div>
            <button
              type="button"
              data-testid="export-data-btn"
              disabled={exporting}
              onClick={handleExportData}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all flex-shrink-0 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-indigo-400" />
              )}
              <span>Export JSON Archive</span>
            </button>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone: Delete Account
                </h4>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  Permanently delete your profile and cascade delete all hosted rooms and checkpoints (FR-ACCT-04, AT-11).
                </p>
              </div>
              <button
                type="button"
                data-testid="delete-account-btn"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-all flex-shrink-0"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-rose-900/50 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-300">Confirm Account Deletion</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete your account? All hosted rooms, participant records, and workspace snapshots will be permanently deleted per GDPR specifications.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
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
