'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

export interface ParticipantMediaState {
  identity: string;
  name: string;
  color?: string;
  isAudioActive: boolean;
  isVideoActive: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export interface UseLiveKitOptions {
  roomCode: string;
  participantName: string;
  autoConnect?: boolean;
  onPermissionDenied?: (error: Error) => void;
}

export function useLiveKit({
  roomCode,
  participantName,
  autoConnect = false,
  onPermissionDenied,
}: UseLiveKitOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<ParticipantMediaState[]>([]);

  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Fetch token from server endpoint
      const resp = await fetch(`/api/v1/rooms/${roomCode}/media/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantName, roomCode }),
      });

      if (!resp.ok) {
        throw new Error(`Media token request rejected with status ${resp.status}`);
      }

      const data = await resp.json();
      setIsConnected(true);
      setIsConnecting(false);

      // Initialize remote participant mock/relay state
      setRemoteParticipants([
        {
          identity: 'demo-peer-1',
          name: 'Collab Partner',
          isAudioActive: true,
          isVideoActive: true,
          isScreenSharing: false,
          isSpeaking: false,
        },
      ]);

      return true;
    } catch (err: unknown) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      setError(errObj.message);
      setIsConnecting(false);
      setIsConnected(false);

      if (onPermissionDenied) {
        onPermissionDenied(errObj);
      }
      // Graceful degradation: never crash or block code editing (FR-COMM-10)
      return false;
    }
  }, [roomCode, participantName, onPermissionDenied]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsScreenSharing(false);
    setRemoteParticipants([]);
  }, []);

  const toggleMic = useCallback(async () => {
    setIsMicMuted((prev) => !prev);
    return !isMicMuted;
  }, [isMicMuted]);

  const toggleCamera = useCallback(async () => {
    setIsCameraOff((prev) => !prev);
    return !isCameraOff;
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    try {
      setIsScreenSharing((prev) => !prev);
      return !isScreenSharing;
    } catch (err) {
      console.warn('Screen share permission denied or unsupported', err);
      return false;
    }
  }, [isScreenSharing]);

  return {
    isConnected,
    isConnecting,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    error,
    remoteParticipants,
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
  };
}
