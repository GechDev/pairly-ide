'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  X,
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Clock,
  Sparkles,
  FileCode,
  MessageSquare,
  Terminal as TerminalIcon,
  Users,
  Check,
  Disc,
  FastForward,
  Layers,
} from 'lucide-react';
import type { SessionRecording, RecordingEvent } from './types';
import { downloadSessionVideo, downloadSessionJson } from './videoExporter';

export interface RecordingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  currentUsername: string;
  isRecording: boolean;
  recordingSeconds: number;
  recordings: SessionRecording[];
  onStartRecording: (title?: string) => void;
  onStopRecording: () => void;
  onDeleteRecording: (id: string) => void;
  onRestoreCodeToWorkspace?: (code: string, fileName?: string) => void;
}

export function RecordingsModal({
  isOpen,
  onClose,
  roomCode,
  currentUsername,
  isRecording,
  recordingSeconds,
  recordings,
  onStartRecording,
  onStopRecording,
  onDeleteRecording,
  onRestoreCodeToWorkspace,
}: RecordingsModalProps) {
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [titleInput, setTitleInput] = useState('');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [restoredCodeSuccess, setRestoredCodeSuccess] = useState(false);

  // Set default selected recording when list changes
  useEffect(() => {
    if (recordings.length > 0 && !selectedRecording) {
      setSelectedRecording(recordings[0]);
    } else if (recordings.length === 0) {
      setSelectedRecording(null);
    }
  }, [recordings, selectedRecording]);

  // Playback timer ticker
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying && selectedRecording) {
      timer = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= selectedRecording.durationSeconds) {
            setIsPlaying(false);
            return selectedRecording.durationSeconds;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, selectedRecording, playbackSpeed]);

  if (!isOpen) return null;

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartRecording(titleInput || `Session by ${currentUsername}`);
    setTitleInput('');
  };

  const visibleEvents: RecordingEvent[] = selectedRecording
    ? selectedRecording.events.filter((e) => e.timestamp <= playbackTime)
    : [];

  const latestCodeEvent = visibleEvents.filter((e) => e.type === 'code').pop();
  const currentReplayCode =
    latestCodeEvent?.detail ||
    selectedRecording?.initialCode ||
    '// No code recorded at this point in session';

  const handleExportVideo = async () => {
    if (!selectedRecording) return;
    setIsExportingVideo(true);
    setExportProgress(0);
    try {
      await downloadSessionVideo(selectedRecording, (pct) => setExportProgress(pct));
    } finally {
      setIsExportingVideo(false);
    }
  };

  const handleRestoreToEditor = () => {
    if (onRestoreCodeToWorkspace && selectedRecording) {
      onRestoreCodeToWorkspace(
        currentReplayCode,
        selectedRecording.initialFileName || 'main.ts'
      );
      setRestoredCodeSuccess(true);
      setTimeout(() => setRestoredCodeSuccess(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="recordings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-6xl max-h-[92vh] rounded-2xl border border-slate-800 bg-slate-900/98 shadow-2xl flex flex-col text-slate-100 overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Session Recordings & Timeline Replay
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  CodeX + CodeSync Studio
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Capture live workspace sessions, scrub through past event timelines, and export WebM video recordings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isRecording ? (
              <div className="flex items-center gap-3 bg-rose-950/50 border border-rose-500/30 px-3.5 py-1.5 rounded-xl">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-xs font-mono font-bold text-rose-300">
                  REC {formatTime(recordingSeconds)}
                </span>
                <button
                  type="button"
                  onClick={onStopRecording}
                  data-testid="stop-recording-btn"
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            ) : (
              <form onSubmit={handleStart} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Session title (optional)..."
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 sm:w-60"
                />
                <button
                  type="submit"
                  data-testid="start-recording-btn"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors shadow-sm"
                >
                  <Disc className="w-3.5 h-3.5 text-rose-400" />
                  <span>Start Recording</span>
                </button>
              </form>
            )}

            <button
              onClick={onClose}
              aria-label="Close recordings modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Recorded Sessions List (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-3 overflow-y-auto">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recorded Sessions ({recordings.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Room: {roomCode}</span>
            </div>

            {recordings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-800/80 rounded-xl my-4 text-slate-500">
                <Disc className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-400">No recordings saved yet</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                  Click "Start Recording" above to capture live editor changes, chat, and runs.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recordings.map((rec) => {
                  const isSelected = selectedRecording?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setSelectedRecording(rec);
                        setPlaybackTime(0);
                        setIsPlaying(false);
                      }}
                      className={`group p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/10 shadow-sm'
                          : 'border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">
                            {rec.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {formatTime(rec.durationSeconds)}
                            </span>
                            <span>•</span>
                            <span className="truncate">by {rec.createdBy}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 font-mono">
                            <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{rec.eventsCount} events</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteRecording(rec.id);
                            if (selectedRecording?.id === rec.id) {
                              setSelectedRecording(null);
                            }
                          }}
                          title="Delete recording"
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Replay Theater & Event Timeline (8 cols) */}
          <div className="md:col-span-8 flex flex-col overflow-y-auto bg-slate-900/40 p-5 gap-4">
            {selectedRecording ? (
              <>
                {/* Replay Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{selectedRecording.title}</span>
                      <span className="text-xs font-mono font-normal text-slate-400">
                        ({formatTime(selectedRecording.durationSeconds)})
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Recorded on {new Date(selectedRecording.createdAt).toLocaleString()} by{' '}
                      <span className="text-slate-300 font-medium">{selectedRecording.createdBy}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onRestoreCodeToWorkspace && (
                      <button
                        type="button"
                        onClick={handleRestoreToEditor}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF0000]/20 text-[#FF0000] hover:bg-[#FF0000]/30 border border-[#FF0000]/30 text-xs font-bold transition-colors"
                        title="Restore current scrubber code to active editor"
                      >
                        {restoredCodeSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-red-300" />
                            <span>Restored!</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Apply to Editor</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => downloadSessionJson(selectedRecording)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors border border-slate-700"
                      title="Download JSON session log"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>JSON</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportVideo}
                      disabled={isExportingVideo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-colors shadow-sm"
                      title="Generate and download .webm video recording"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isExportingVideo ? `Rendering (${exportProgress.toFixed(0)}%)...` : 'Export WebM'}</span>
                    </button>
                  </div>
                </div>

                {/* Scrubber Timeline Bar */}
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="font-mono text-xs text-slate-300">
                        <span className="text-indigo-400 font-bold">{formatTime(playbackTime)}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span>{formatTime(selectedRecording.durationSeconds)}</span>
                      </div>
                    </div>

                    {/* Speed Controls */}
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                      {[1, 2, 4].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setPlaybackSpeed(spd)}
                          className={`px-2 py-0.5 rounded transition-colors ${
                            playbackSpeed === spd
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {spd}×
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrubber Slider */}
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={selectedRecording.durationSeconds}
                      value={playbackTime}
                      onChange={(e) => {
                        setPlaybackTime(Number(e.target.value));
                        setIsPlaying(false);
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Split Bottom Area: Synchronized Code Preview + Event Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-[300px]">
                  {/* Code Snapshot (7 cols) */}
                  <div className="lg:col-span-7 flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="h-8 px-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="font-mono text-slate-200 font-medium">
                          {selectedRecording.initialFileName || 'main.ts'}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {currentReplayCode.split('\n').length} lines
                      </span>
                    </div>

                    <div className="p-3 font-mono text-xs overflow-auto flex-1 text-slate-300 leading-relaxed bg-slate-950/90 max-h-[280px]">
                      <pre className="whitespace-pre">
                        {currentReplayCode.split('\n').map((line, idx) => (
                          <div key={idx} className="flex">
                            <span className="w-8 select-none text-slate-600 text-right pr-3 font-mono">
                              {idx + 1}
                            </span>
                            <span className="flex-1">{line || ' '}</span>
                          </div>
                        ))}
                      </pre>
                    </div>
                  </div>

                  {/* Synchronized Event Feed (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <div className="h-8 px-3 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-semibold text-slate-200">Timeline Events</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {visibleEvents.length}/{selectedRecording.eventsCount}
                      </span>
                    </div>

                    <div className="p-2.5 overflow-y-auto flex-1 flex flex-col gap-1.5 max-h-[280px]">
                      {visibleEvents.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 text-xs">
                          No events at 00:00. Press Play or scrub forward.
                        </div>
                      ) : (
                        visibleEvents.map((ev) => {
                          let badgeBg = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                          let Icon = FileCode;
                          if (ev.type === 'chat') {
                            badgeBg = 'bg-[#FF0000]/10 text-[#FF0000] border border-[#FF0000]/20';
                            Icon = MessageSquare;
                          } else if (ev.type === 'terminal') {
                            badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                            Icon = TerminalIcon;
                          } else if (ev.type === 'presence') {
                            badgeBg = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
                            Icon = Users;
                          }

                          return (
                            <div
                              key={ev.id}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800/60 flex items-center gap-2 text-xs"
                            >
                              <span className="font-mono text-[10px] text-slate-500">
                                {formatTime(ev.timestamp)}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeBg}`}
                              >
                                {ev.type}
                              </span>
                              <span className="text-slate-300 truncate flex-1 text-[11px]">
                                {ev.detail}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-500">
                <Video className="w-12 h-12 text-slate-700 mb-3" />
                <h4 className="text-sm font-bold text-slate-300">Select a Session to Replay</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Choose a recorded session from the left column to view its code evolution, activity timeline, and export video.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
