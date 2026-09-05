'use client';

import { useState, useCallback, useRef } from 'react';

export interface UseFollowOptions {
  onFollowFileChange?: (fileId: string) => void;
  onFollowCursorChange?: (line: number, column: number) => void;
}

export interface UseFollowReturn {
  followedParticipantId: string | null;
  spotlightedParticipantId: string | null;
  isFollowing: boolean;
  isSpotlighted: boolean;
  startFollowing: (participantId: string) => void;
  stopFollowing: () => void;
  setSpotlight: (participantId: string | null) => void;
  breakFollowOnInteraction: () => void;
  updateFollowedState: (fileId?: string | null, line?: number, column?: number) => void;
}

/**
 * Hook managing Follow Mode and Host Spotlight viewport alignment.
 * Per SRS FR-EDIT-06, FR-EDIT-07, and FR-EDIT-08.
 */
export function useFollow(options: UseFollowOptions = {}): UseFollowReturn {
  const [followedParticipantId, setFollowedParticipantId] = useState<string | null>(null);
  const [spotlightedParticipantId, setSpotlightedParticipantId] = useState<string | null>(null);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const startFollowing = useCallback((participantId: string) => {
    setFollowedParticipantId(participantId);
  }, []);

  const stopFollowing = useCallback(() => {
    // Cannot exit if under host spotlight
    if (spotlightedParticipantId) return;
    setFollowedParticipantId(null);
  }, [spotlightedParticipantId]);

  const setSpotlight = useCallback((participantId: string | null) => {
    setSpotlightedParticipantId(participantId);
    if (participantId) {
      setFollowedParticipantId(participantId);
    }
  }, []);

  const breakFollowOnInteraction = useCallback(() => {
    // Only break manual follow; host spotlight persists until released
    if (!spotlightedParticipantId && followedParticipantId) {
      setFollowedParticipantId(null);
    }
  }, [spotlightedParticipantId, followedParticipantId]);

  const updateFollowedState = useCallback(
    (fileId?: string | null, line?: number, column?: number) => {
      if (fileId && optionsRef.current.onFollowFileChange) {
        optionsRef.current.onFollowFileChange(fileId);
      }
      if (typeof line === 'number' && typeof column === 'number' && optionsRef.current.onFollowCursorChange) {
        optionsRef.current.onFollowCursorChange(line, column);
      }
    },
    []
  );

  return {
    followedParticipantId,
    spotlightedParticipantId,
    isFollowing: Boolean(followedParticipantId),
    isSpotlighted: Boolean(spotlightedParticipantId),
    startFollowing,
    stopFollowing,
    setSpotlight,
    breakFollowOnInteraction,
    updateFollowedState,
  };
}
