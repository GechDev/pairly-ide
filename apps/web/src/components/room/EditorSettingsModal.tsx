'use client';

import React from 'react';
import { Settings, X, Sliders, Type, AlignLeft, Sun, Moon } from 'lucide-react';

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
}

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: false,
  lineNumbers: true,
  theme: 'vs-dark',
};

export interface EditorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (newSettings: EditorSettings) => void;
}

/**
 * Editor Settings Modal.
 * Direct architectural alignment with CodeX settings-sheet.
 */
export function EditorSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: EditorSettingsModalProps) {
  if (!isOpen) return null;

  const handleChange = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    onUpdateSettings(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pairly_editor_settings', JSON.stringify(updated));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="editor-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 text-slate-100 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Editor Settings
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize appearance, font size, and typography preferences.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form Body */}
        <div className="flex flex-col gap-5 text-xs">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Type className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">Font Size</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[12, 14, 16, 18].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleChange('fontSize', size)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    settings.fontSize === size
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">Tab Size (Spaces)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {[2, 4].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleChange('tabSize', size)}
                  className={`px-3.5 py-1 rounded-lg font-bold transition-all ${
                    settings.tabSize === size
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <AlignLeft className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">Line Wrapping</span>
            </div>
            <button
              type="button"
              onClick={() => handleChange('wordWrap', !settings.wordWrap)}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all border ${
                settings.wordWrap
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {settings.wordWrap ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Line Numbers */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-mono text-indigo-400 font-bold">123</span>
              <span className="font-semibold">Line Numbers Gutter</span>
            </div>
            <button
              type="button"
              onClick={() => handleChange('lineNumbers', !settings.lineNumbers)}
              className={`px-4 py-1.5 rounded-xl font-bold transition-all border ${
                settings.lineNumbers
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {settings.lineNumbers ? 'Visible' : 'Hidden'}
            </button>
          </div>

          {/* Editor Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">Color Theme</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleChange('theme', 'vs-dark')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  settings.theme === 'vs-dark'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => handleChange('theme', 'hc-black')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  settings.theme === 'hc-black'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Contrast
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
