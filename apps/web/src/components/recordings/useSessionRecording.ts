'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SessionRecording, RecordingEvent, RecordingEventType } from './types';

export interface UseSessionRecordingProps {
  roomCode: string;
  currentUsername: string;
}

export function useSessionRecording({ roomCode, currentUsername }: UseSessionRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordings, setRecordings] = useState<SessionRecording[]>([]);
  const activeEventsRef = useRef<RecordingEvent[]>([]);
  const currentRecordingMetaRef = useRef<{
    id: string;
    title: string;
    initialCode?: string;
    initialFileName?: string;
    createdAt: string;
  } | null>(null);

  const storageKey = `pairly_recordings_${roomCode}`;

  // Load existing recordings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecordings(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load session recordings:', e);
    }
  }, [storageKey]);

  // Save recordings to localStorage whenever updated
  const saveToStorage = useCallback(
    (updated: SessionRecording[]) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist session recordings:', e);
      }
    },
    [storageKey],
  );

  // Recording ticker
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Start recording
  const startRecording = useCallback(
    (title?: string, initialCode?: string, initialFileName?: string): string => {
      const id = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const sessionTitle = title?.trim() || `Session by ${currentUsername}`;
      const nowIso = new Date().toISOString();

      currentRecordingMetaRef.current = {
        id,
        title: sessionTitle,
        initialCode,
        initialFileName,
        createdAt: nowIso,
      };

      activeEventsRef.current = [
        {
          id: `ev_init_${Date.now()}`,
          timestamp: 0,
          type: 'code',
          detail: initialCode || '',
          metadata: { fileName: initialFileName || 'main.ts', action: 'session_init' },
        },
      ];

      setRecordingSeconds(0);
      setIsRecording(true);
      return id;
    },
    [currentUsername],
  );

  // Record an event into the active stream
  const addEvent = useCallback(
    (type: RecordingEventType, detail: string, metadata?: Record<string, any>) => {
      if (!isRecording) return;
      const newEv: RecordingEvent = {
        id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: recordingSeconds,
        type,
        detail,
        metadata,
      };
      activeEventsRef.current.push(newEv);
    },
    [isRecording, recordingSeconds],
  );

  // Stop recording and compile session
  const stopRecording = useCallback((): SessionRecording | null => {
    if (!isRecording || !currentRecordingMetaRef.current) return null;

    const meta = currentRecordingMetaRef.current;
    const finalRecording: SessionRecording = {
      id: meta.id,
      roomCode,
      title: meta.title,
      createdBy: currentUsername,
      createdAt: meta.createdAt,
      durationSeconds: Math.max(1, recordingSeconds),
      eventsCount: activeEventsRef.current.length,
      events: [...activeEventsRef.current],
      initialCode: meta.initialCode,
      initialFileName: meta.initialFileName,
    };

    setRecordings((prev) => {
      const updated = [finalRecording, ...prev];
      saveToStorage(updated);
      return updated;
    });

    setIsRecording(false);
    currentRecordingMetaRef.current = null;
    activeEventsRef.current = [];
    return finalRecording;
  }, [isRecording, roomCode, currentUsername, recordingSeconds, saveToStorage]);

  // Delete recording
  const deleteRecording = useCallback(
    (id: string) => {
      setRecordings((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage],
  );

  return {
    isRecording,
    recordingSeconds,
    recordings,
    startRecording,
    stopRecording,
    addEvent,
    deleteRecording,
  };
}
