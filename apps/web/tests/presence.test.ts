import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFollow } from '../src/components/presence/useFollow';
import { authorizeAction } from '../../realtime/src/rbac/guard';

describe('T-10: Presence Awareness, Follow Mode, and Host Spotlight', () => {
  it('manages follow mode activation, file tracking, and manual interaction break (FR-EDIT-07)', () => {
    const onFollowFileChange = vi.fn();
    const onFollowCursorChange = vi.fn();

    const { result } = renderHook(() =>
      useFollow({
        onFollowFileChange,
        onFollowCursorChange,
      })
    );

    expect(result.current.isFollowing).toBe(false);

    // 1. Start following Alice
    act(() => {
      result.current.startFollowing('user-alice');
    });

    expect(result.current.isFollowing).toBe(true);
    expect(result.current.followedParticipantId).toBe('user-alice');

    // 2. Alice changes active file & cursor
    act(() => {
      result.current.updateFollowedState('file-utils-ts', 12, 4);
    });

    expect(onFollowFileChange).toHaveBeenCalledWith('file-utils-ts');
    expect(onFollowCursorChange).toHaveBeenCalledWith(12, 4);

    // 3. User interaction breaks follow mode
    act(() => {
      result.current.breakFollowOnInteraction();
    });

    expect(result.current.isFollowing).toBe(false);
    expect(result.current.followedParticipantId).toBeNull();
  });

  it('manages host spotlight locking and release (FR-EDIT-08)', () => {
    const { result } = renderHook(() => useFollow());

    // 1. Host spotlights Bob
    act(() => {
      result.current.setSpotlight('user-bob');
    });

    expect(result.current.isSpotlighted).toBe(true);
    expect(result.current.isFollowing).toBe(true);
    expect(result.current.followedParticipantId).toBe('user-bob');

    // 2. Local user interaction CANNOT break Host Spotlight
    act(() => {
      result.current.breakFollowOnInteraction();
    });

    expect(result.current.isSpotlighted).toBe(true);
    expect(result.current.isFollowing).toBe(true);

    // 3. Host releases spotlight
    act(() => {
      result.current.setSpotlight(null);
    });

    expect(result.current.isSpotlighted).toBe(false);

    // Now user can stop following
    act(() => {
      result.current.stopFollowing();
    });
    expect(result.current.isFollowing).toBe(false);
  });

  it('enforces RBAC for SPOTLIGHT_PARTICIPANT action on server guard', () => {
    // 1. Viewer role is denied spotlight
    const viewerCheck = authorizeAction('SPOTLIGHT_PARTICIPANT', { role: 'VIEWER' });
    expect(viewerCheck.allowed).toBe(false);
    expect(viewerCheck.code).toBe('UNAUTHORIZED_ACTION');

    // 2. Editor role is denied spotlight
    const editorCheck = authorizeAction('SPOTLIGHT_PARTICIPANT', { role: 'EDITOR' });
    expect(editorCheck.allowed).toBe(false);
    expect(editorCheck.code).toBe('UNAUTHORIZED_ACTION');

    // 3. Host role is authorized to spotlight
    const hostCheck = authorizeAction('SPOTLIGHT_PARTICIPANT', { role: 'HOST' });
    expect(hostCheck.allowed).toBe(true);
  });
});
