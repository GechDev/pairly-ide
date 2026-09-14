import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParticipantsModal } from '../src/components/room/ParticipantsModal';
import type { ParticipantIdentity } from '@pairly/contracts';

const hostUser: ParticipantIdentity = {
  id: 'user-host',
  displayName: 'Alice (Host)',
  role: 'HOST',
  color: '#6366f1',
};

const editorUser: ParticipantIdentity = {
  id: 'user-editor',
  displayName: 'Bob The Builder',
  role: 'EDITOR',
  color: '#10b981',
};

const viewerUser: ParticipantIdentity = {
  id: 'user-viewer',
  displayName: 'Charlie Observer',
  role: 'VIEWER',
  color: '#64748b',
};

describe('ParticipantsModal Component', () => {
  it('renders participant list with correct badges and role items', () => {
    const onClose = vi.fn();
    render(
      <ParticipantsModal
        isOpen={true}
        onClose={onClose}
        roomCode="TEST-ROOM"
        currentParticipant={hostUser}
        participants={[hostUser, editorUser, viewerUser]}
        participantPresenceMap={{
          'user-editor': { fileName: 'app.tsx' },
        }}
        isRoomLocked={false}
        mutedParticipantIds={[]}
        onChangeRole={vi.fn()}
        onKickParticipant={vi.fn()}
        onToggleMuteParticipant={vi.fn()}
        onToggleRoomLock={vi.fn()}
      />
    );

    expect(screen.getByTestId('participants-modal')).toBeDefined();
    expect(screen.getByText('Alice (Host)')).toBeDefined();
    expect(screen.getByText('Bob The Builder')).toBeDefined();
    expect(screen.getByText('Charlie Observer')).toBeDefined();
    expect(screen.getByText('Editing app.tsx')).toBeDefined();
    expect(screen.getByText('You')).toBeDefined();
  });

  it('filters participants by search query', () => {
    render(
      <ParticipantsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="TEST-ROOM"
        currentParticipant={hostUser}
        participants={[hostUser, editorUser, viewerUser]}
        isRoomLocked={false}
        onChangeRole={vi.fn()}
        onKickParticipant={vi.fn()}
        onToggleMuteParticipant={vi.fn()}
        onToggleRoomLock={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId('participants-search-input');
    fireEvent.change(searchInput, { target: { value: 'Charlie' } });

    expect(screen.queryByText('Bob The Builder')).toBeNull();
    expect(screen.getByText('Charlie Observer')).toBeDefined();
  });

  it('allows host to change role, mute audio, and kick participants', () => {
    const onChangeRole = vi.fn();
    const onToggleMute = vi.fn();
    const onKick = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ParticipantsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="TEST-ROOM"
        currentParticipant={hostUser}
        participants={[hostUser, editorUser]}
        isRoomLocked={false}
        mutedParticipantIds={[]}
        onChangeRole={onChangeRole}
        onKickParticipant={onKick}
        onToggleMuteParticipant={onToggleMute}
        onToggleRoomLock={vi.fn()}
      />
    );

    // Host changes Bob's role to VIEWER
    const roleSelect = screen.getByTestId('role-select-user-editor');
    fireEvent.change(roleSelect, { target: { value: 'VIEWER' } });
    expect(onChangeRole).toHaveBeenCalledWith('user-editor', 'VIEWER');

    // Host mutes Bob
    const muteBtn = screen.getByTestId('mute-btn-user-editor');
    fireEvent.click(muteBtn);
    expect(onToggleMute).toHaveBeenCalledWith('user-editor', true);

    // Host kicks Bob
    const kickBtn = screen.getByTestId('kick-btn-user-editor');
    fireEvent.click(kickBtn);
    expect(onKick).toHaveBeenCalledWith('user-editor');
  });

  it('allows host to toggle room lock', () => {
    const onToggleRoomLock = vi.fn();

    render(
      <ParticipantsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="TEST-ROOM"
        currentParticipant={hostUser}
        participants={[hostUser, editorUser]}
        isRoomLocked={false}
        onChangeRole={vi.fn()}
        onKickParticipant={vi.fn()}
        onToggleMuteParticipant={vi.fn()}
        onToggleRoomLock={onToggleRoomLock}
      />
    );

    const lockBtn = screen.getByTestId('toggle-room-lock-btn');
    fireEvent.click(lockBtn);
    expect(onToggleRoomLock).toHaveBeenCalledWith(true);
  });
});
