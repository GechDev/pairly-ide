'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ParticipantIdentity } from '@pairly/contracts';
import { defaultMediaManager, AvailableDevices } from './mediaDevices';

export interface ParticipantMediaState {
  identity: string;
  name: string;
  color?: string;
  isAudioActive: boolean;
  isVideoActive: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  videoTrack?: MediaStreamTrack | null;
  screenTrack?: MediaStreamTrack | null;
}

export interface UseLiveKitOptions {
  roomCode: string;
  participantId?: string;
  participantName: string;
  activeParticipants?: ParticipantIdentity[];
  onSendWsMessage?: (msg: any) => void;
  autoConnect?: boolean;
  onPermissionDenied?: (error: Error) => void;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

export function useLiveKit({
  roomCode,
  participantId,
  participantName,
  activeParticipants = [],
  onSendWsMessage,
  autoConnect = true,
  onPermissionDenied,
}: UseLiveKitOptions) {
  const [isConnected, setIsConnected] = useState(autoConnect);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [availableDevices, setAvailableDevices] = useState<AvailableDevices>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });

  // Local tracks
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [localScreenTrack, setLocalScreenTrack] = useState<MediaStreamTrack | null>(null);

  const [remoteParticipants, setRemoteParticipants] = useState<ParticipantMediaState[]>([]);
  const stopAudioMeterRef = useRef<(() => void) | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  // Keep references for asynchronous WebRTC callbacks
  const localVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  localVideoTrackRef.current = localVideoTrack;
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);
  localAudioTrackRef.current = localAudioTrack;

  // Enumerate devices on mount
  useEffect(() => {
    defaultMediaManager.enumerateDevices().then(setAvailableDevices);
  }, []);

  // Synchronize remote participant list with active room participants
  useEffect(() => {
    if (!participantId) return;
    const others = activeParticipants.filter((p) => p.id !== participantId);

    setRemoteParticipants((prev) => {
      return others.map((p) => {
        const existing = prev.find((r) => r.identity === p.id);
        return {
          identity: p.id,
          name: p.displayName,
          color: p.color,
          isAudioActive: existing ? existing.isAudioActive : false,
          isVideoActive: existing ? existing.isVideoActive : false,
          isScreenSharing: existing ? existing.isScreenSharing : false,
          isSpeaking: existing ? existing.isSpeaking : false,
          videoTrack: existing?.videoTrack ?? null,
          screenTrack: existing?.screenTrack ?? null,
        };
      });
    });
  }, [activeParticipants, participantId]);

  /**
   * Helper to get or create an RTCPeerConnection with a remote peer
   */
  const getOrCreatePeerConnection = useCallback(
    (targetPeerId: string): RTCPeerConnection => {
      let pc = peerConnectionsRef.current.get(targetPeerId);
      if (pc && pc.connectionState !== 'closed') {
        return pc;
      }

      pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(targetPeerId, pc);

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && onSendWsMessage) {
          onSendWsMessage({
            type: 'WEBRTC_SIGNAL',
            targetParticipantId: targetPeerId,
            signal: {
              type: 'candidate',
              candidate: event.candidate,
            },
          });
        }
      };

      // Handle Incoming Remote Tracks
      pc.ontrack = (event) => {
        const [remoteTrack] = event.streams[0]?.getTracks() || [event.track];
        if (remoteTrack) {
          setRemoteParticipants((prev) =>
            prev.map((peer) => {
              if (peer.identity === targetPeerId) {
                if (remoteTrack.kind === 'video') {
                  return {
                    ...peer,
                    videoTrack: remoteTrack,
                    isVideoActive: true,
                  };
                }
                if (remoteTrack.kind === 'audio') {
                  return {
                    ...peer,
                    isAudioActive: true,
                  };
                }
              }
              return peer;
            })
          );
        }
      };

      // Add existing local tracks if available
      if (localVideoTrackRef.current) {
        pc.addTrack(localVideoTrackRef.current);
      }
      if (localAudioTrackRef.current) {
        pc.addTrack(localAudioTrackRef.current);
      }

      return pc;
    },
    [onSendWsMessage]
  );

  /**
   * Send WebRTC Offer to all remote peers
   */
  const broadcastOfferToPeers = useCallback(
    async (track: MediaStreamTrack) => {
      if (!participantId || !onSendWsMessage) return;
      const peers = activeParticipants.filter((p) => p.id !== participantId);

      for (const peer of peers) {
        try {
          const pc = getOrCreatePeerConnection(peer.id);
          const senders = pc.getSenders();
          const hasTrack = senders.some((s) => s.track?.id === track.id);
          if (!hasTrack) {
            pc.addTrack(track);
          }

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          onSendWsMessage({
            type: 'WEBRTC_SIGNAL',
            targetParticipantId: peer.id,
            signal: offer,
          });
        } catch (err) {
          console.warn(`[WebRTC] Failed to send offer to peer ${peer.id}:`, err);
        }
      }
    },
    [activeParticipants, participantId, onSendWsMessage, getOrCreatePeerConnection]
  );

  /**
   * Handle incoming WebRTC signaling message
   */
  const handleWebRtcSignal = useCallback(
    async (fromParticipantId: string, signal: any) => {
      if (!fromParticipantId || !signal) return;

      try {
        const pc = getOrCreatePeerConnection(fromParticipantId);

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (onSendWsMessage) {
            onSendWsMessage({
              type: 'WEBRTC_SIGNAL',
              targetParticipantId: fromParticipantId,
              signal: answer,
            });
          }
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.type === 'candidate' && signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn(`[WebRTC] Error handling signal from ${fromParticipantId}:`, err);
      }
    },
    [getOrCreatePeerConnection, onSendWsMessage]
  );

  /**
   * Handle incoming Media State Updates from peers (camera on/off, etc.)
   */
  const handleMediaStateUpdate = useCallback(
    (peerId: string, mediaState: { cameraOn?: boolean; micOn?: boolean; screenOn?: boolean }) => {
      setRemoteParticipants((prev) =>
        prev.map((peer) => {
          if (peer.identity === peerId) {
            return {
              ...peer,
              isVideoActive: mediaState.cameraOn ?? peer.isVideoActive,
              isAudioActive: mediaState.micOn ?? peer.isAudioActive,
              isScreenSharing: mediaState.screenOn ?? peer.isScreenSharing,
            };
          }
          return peer;
        })
      );
    },
    []
  );

  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    setIsConnected(true);
    setIsConnecting(false);
    return true;
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setIsScreenSharing(false);
    setIsCameraOff(true);
    setIsMicMuted(true);

    if (stopAudioMeterRef.current) {
      stopAudioMeterRef.current();
      stopAudioMeterRef.current = null;
    }

    // Close all peer connections
    for (const pc of peerConnectionsRef.current.values()) {
      pc.close();
    }
    peerConnectionsRef.current.clear();

    defaultMediaManager.destroy();
    setLocalVideoTrack(null);
    setLocalAudioTrack(null);
    setLocalScreenTrack(null);
    setAudioVolume(0);
  }, []);

  /**
   * Toggle camera with real MediaStream acquisition and peer broadcast
   */
  const toggleCamera = useCallback(async () => {
    if (!isCameraOff && localVideoTrack) {
      // Turn off camera
      localVideoTrack.stop();
      setLocalVideoTrack(null);
      setIsCameraOff(true);

      onSendWsMessage?.({
        type: 'MEDIA_STATE_UPDATE',
        mediaState: {
          cameraOn: false,
          micOn: !isMicMuted,
          screenOn: isScreenSharing,
        },
      });
      return false;
    }

    try {
      setError(null);
      const stream = await defaultMediaManager.getUserMedia({
        video: true,
        audio: !isMicMuted,
      });

      if (stream) {
        const vTrack = stream.getVideoTracks()[0] ?? null;
        setLocalVideoTrack(vTrack);
        setIsCameraOff(false);

        const aTrack = stream.getAudioTracks()[0] ?? null;
        if (aTrack && !isMicMuted) {
          setLocalAudioTrack(aTrack);
        }

        // Notify room participants that camera is on
        onSendWsMessage?.({
          type: 'MEDIA_STATE_UPDATE',
          mediaState: {
            cameraOn: true,
            micOn: !isMicMuted,
            screenOn: isScreenSharing,
          },
        });

        // Broadcast WebRTC video track to peers
        if (vTrack) {
          broadcastOfferToPeers(vTrack);
        }

        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Camera request denied or unavailable:', err);
      setError('Camera access denied or unavailable in this environment');
      setIsCameraOff(true);
      if (onPermissionDenied) {
        onPermissionDenied(err instanceof Error ? err : new Error(String(err)));
      }
      return false;
    }
  }, [
    isCameraOff,
    isMicMuted,
    isScreenSharing,
    localVideoTrack,
    onSendWsMessage,
    broadcastOfferToPeers,
    onPermissionDenied,
  ]);

  /**
   * Toggle microphone with real AudioMeter volume detection
   */
  const toggleMic = useCallback(async () => {
    if (!isMicMuted && localAudioTrack) {
      localAudioTrack.enabled = false;
      setIsMicMuted(true);
      if (stopAudioMeterRef.current) {
        stopAudioMeterRef.current();
        stopAudioMeterRef.current = null;
      }
      setAudioVolume(0);

      onSendWsMessage?.({
        type: 'MEDIA_STATE_UPDATE',
        mediaState: {
          cameraOn: !isCameraOff,
          micOn: false,
          screenOn: isScreenSharing,
        },
      });
      return true;
    }

    try {
      setError(null);
      let aTrack = localAudioTrack;

      if (!aTrack) {
        const stream = await defaultMediaManager.getUserMedia({
          video: !isCameraOff,
          audio: true,
        });
        if (stream) {
          aTrack = stream.getAudioTracks()[0] ?? null;
          setLocalAudioTrack(aTrack);

          const cleanup = defaultMediaManager.startAudioMeter(stream, (vol) => {
            setAudioVolume(vol);
          });
          stopAudioMeterRef.current = cleanup;
        }
      } else {
        aTrack.enabled = true;
      }

      setIsMicMuted(false);

      onSendWsMessage?.({
        type: 'MEDIA_STATE_UPDATE',
        mediaState: {
          cameraOn: !isCameraOff,
          micOn: true,
          screenOn: isScreenSharing,
        },
      });

      return false;
    } catch (err: any) {
      console.warn('Microphone request denied or unavailable:', err);
      setError('Microphone access denied or unavailable');
      setIsMicMuted(true);
      return true;
    }
  }, [isMicMuted, isCameraOff, isScreenSharing, localAudioTrack, onSendWsMessage]);

  /**
   * Toggle screen share with real browser display capture
   */
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing && localScreenTrack) {
      localScreenTrack.stop();
      setLocalScreenTrack(null);
      setIsScreenSharing(false);

      onSendWsMessage?.({
        type: 'MEDIA_STATE_UPDATE',
        mediaState: {
          cameraOn: !isCameraOff,
          micOn: !isMicMuted,
          screenOn: false,
        },
      });
      return false;
    }

    try {
      setError(null);
      const stream = await defaultMediaManager.getDisplayMedia();
      if (stream) {
        const track = stream.getVideoTracks()[0] ?? null;
        setLocalScreenTrack(track);
        setIsScreenSharing(true);

        onSendWsMessage?.({
          type: 'MEDIA_STATE_UPDATE',
          mediaState: {
            cameraOn: !isCameraOff,
            micOn: !isMicMuted,
            screenOn: true,
          },
        });

        if (track) {
          broadcastOfferToPeers(track);
          track.onended = () => {
            setLocalScreenTrack(null);
            setIsScreenSharing(false);
            onSendWsMessage?.({
              type: 'MEDIA_STATE_UPDATE',
              mediaState: {
                cameraOn: !isCameraOff,
                micOn: !isMicMuted,
                screenOn: false,
              },
            });
          };
        }
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn('Screen share permission denied or cancelled:', err);
      setIsScreenSharing(false);
      return false;
    }
  }, [
    isScreenSharing,
    isCameraOff,
    isMicMuted,
    localScreenTrack,
    onSendWsMessage,
    broadcastOfferToPeers,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stopAudioMeterRef.current) {
        stopAudioMeterRef.current();
      }
      for (const pc of peerConnectionsRef.current.values()) {
        pc.close();
      }
      peerConnectionsRef.current.clear();
      defaultMediaManager.destroy();
    };
  }, []);

  return {
    isConnected,
    isConnecting,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    error,
    audioVolume,
    availableDevices,
    localVideoTrack,
    localAudioTrack,
    localScreenTrack,
    remoteParticipants,
    connect,
    disconnect,
    toggleMic,
    toggleCamera,
    toggleScreenShare,
    handleWebRtcSignal,
    handleMediaStateUpdate,
  };
}
