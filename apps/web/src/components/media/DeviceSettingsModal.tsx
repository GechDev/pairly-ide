'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Video, Volume2, Check, Settings2 } from 'lucide-react';
import { defaultMediaManager, type AvailableDevices } from './mediaDevices';
import { TrackVideo } from './TrackVideo';

export interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDevices: AvailableDevices;
  selectedAudioId?: string;
  selectedVideoId?: string;
  onSelectAudioDevice?: (deviceId: string) => void;
  onSelectVideoDevice?: (deviceId: string) => void;
}

export function DeviceSettingsModal({
  isOpen,
  onClose,
  availableDevices,
  selectedAudioId,
  selectedVideoId,
  onSelectAudioDevice,
  onSelectVideoDevice,
}: DeviceSettingsModalProps) {
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [currentAudio, setCurrentAudio] = useState(selectedAudioId || '');
  const [currentVideo, setCurrentVideo] = useState(selectedVideoId || '');

  // Start preview when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (previewStream) {
        for (const t of previewStream.getTracks()) t.stop();
        setPreviewStream(null);
      }
      return;
    }

    let isMounted = true;
    let stopMeter: (() => void) | null = null;

    defaultMediaManager
      .getUserMedia({
        video: currentVideo ? { deviceId: { exact: currentVideo } } : true,
        audio: currentAudio ? { deviceId: { exact: currentAudio } } : true,
      })
      .then((stream) => {
        if (!isMounted || !stream) return;
        setPreviewStream(stream);
        stopMeter = defaultMediaManager.startAudioMeter(stream, (vol) => {
          if (isMounted) setMicLevel(vol);
        });
      })
      .catch((err) => {
        console.warn('Device preview failed:', err);
      });

    return () => {
      isMounted = false;
      if (stopMeter) stopMeter();
      if (previewStream) {
        for (const t of previewStream.getTracks()) t.stop();
      }
    };
  }, [isOpen, currentAudio, currentVideo]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="device-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl p-6 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Audio & Video Settings</h2>
              <p className="text-xs text-slate-400">Configure your camera, microphone, and speakers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex items-center justify-center">
          {previewStream && previewStream.getVideoTracks().length > 0 ? (
            <TrackVideo stream={previewStream} mirrored={true} />
          ) : (
            <div className="flex flex-col items-center text-slate-500 text-xs">
              <Video className="w-8 h-8 mb-2 opacity-40" />
              <span>Camera preview not available</span>
            </div>
          )}
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono">
            Preview
          </div>
        </div>

        {/* Device Selectors */}
        <div className="flex flex-col gap-4 text-xs">
          {/* Camera Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-300 flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              Camera
            </label>
            <select
              value={currentVideo}
              onChange={(e) => {
                setCurrentVideo(e.target.value);
                onSelectVideoDevice?.(e.target.value);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {availableDevices.videoInputs.length === 0 ? (
                <option value="">Default Camera</option>
              ) : (
                availableDevices.videoInputs.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Microphone Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-slate-300 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              Microphone
            </label>
            <select
              value={currentAudio}
              onChange={(e) => {
                setCurrentAudio(e.target.value);
                onSelectAudioDevice?.(e.target.value);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {availableDevices.audioInputs.length === 0 ? (
                <option value="">Default Microphone</option>
              ) : (
                availableDevices.audioInputs.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Microphone ${idx + 1}`}
                  </option>
                ))
              )}
            </select>

            {/* Mic Live Level Indicator */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-400">Input Level:</span>
              <div className="flex-1 h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.min(100, micLevel)}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-7 text-right">{micLevel}%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
