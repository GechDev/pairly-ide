import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  RecordingsModal,
  downloadSessionJson,
  downloadSessionVideo,
  type SessionRecording,
} from '../src/components/recordings';

describe('Session Recordings & Event Timeline Replay (CodeSync/CodeX Inspired)', () => {
  const mockRecording: SessionRecording = {
    id: 'rec_test_123',
    roomCode: 'room-abc',
    title: 'Debugging Python Server',
    createdBy: 'Ada Lovelace',
    createdAt: '2026-09-14T10:00:00.000Z',
    durationSeconds: 45,
    eventsCount: 4,
    initialCode: 'print("Initial script")',
    initialFileName: 'server.py',
    events: [
      {
        id: 'ev_1',
        timestamp: 0,
        type: 'code',
        detail: 'print("Initial script")',
        metadata: { fileName: 'server.py' },
      },
      {
        id: 'ev_2',
        timestamp: 10,
        type: 'chat',
        detail: 'Hey Ada, check the port binding',
        metadata: { senderName: 'Alan' },
      },
      {
        id: 'ev_3',
        timestamp: 25,
        type: 'code',
        detail: 'import socket\nprint("Server starting on 8080")',
        metadata: { fileName: 'server.py' },
      },
      {
        id: 'ev_4',
        timestamp: 35,
        type: 'terminal',
        detail: 'Run executed for server.py',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders RecordingsModal with active recording banner when recording is in progress', () => {
    const handleStop = vi.fn();

    render(
      <RecordingsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="room-abc"
        currentUsername="Ada Lovelace"
        isRecording={true}
        recordingSeconds={42}
        recordings={[mockRecording]}
        onStartRecording={vi.fn()}
        onStopRecording={handleStop}
        onDeleteRecording={vi.fn()}
      />,
    );

    expect(screen.getByText(/Session Recordings & Timeline Replay/i)).toBeDefined();
    expect(screen.getByText(/REC 00:42/i)).toBeDefined();

    const stopBtn = screen.getByTestId('stop-recording-btn');
    fireEvent.click(stopBtn);
    expect(handleStop).toHaveBeenCalled();
  });

  it('renders list of past recordings and displays code at timeline second', () => {
    render(
      <RecordingsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="room-abc"
        currentUsername="Ada Lovelace"
        isRecording={false}
        recordingSeconds={0}
        recordings={[mockRecording]}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
        onDeleteRecording={vi.fn()}
      />,
    );

    // Assert session title in left column and right theater
    const titles = screen.getAllByText('Debugging Python Server');
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.getByText(/server\.py/i)).toBeDefined();

    // Check code display
    expect(screen.getAllByText(/Initial script/i).length).toBeGreaterThanOrEqual(1);
  });

  it('scrubs timeline slider and advances playback time and event stream', () => {
    render(
      <RecordingsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="room-abc"
        currentUsername="Ada Lovelace"
        isRecording={false}
        recordingSeconds={0}
        recordings={[mockRecording]}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
        onDeleteRecording={vi.fn()}
      />,
    );

    // Range input slider
    const slider = screen.getByRole('slider');
    expect(slider).toBeDefined();

    // Scrub forward to 30 seconds
    fireEvent.change(slider, { target: { value: 30 } });

    // Code at 30 seconds should now display the updated code
    expect(screen.getAllByText(/Server starting on 8080/i).length).toBeGreaterThanOrEqual(1);
  });

  it('restores scrubber code to editor workspace when Apply to Editor is clicked', () => {
    const handleRestore = vi.fn();

    render(
      <RecordingsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="room-abc"
        currentUsername="Ada Lovelace"
        isRecording={false}
        recordingSeconds={0}
        recordings={[mockRecording]}
        onStartRecording={vi.fn()}
        onStopRecording={vi.fn()}
        onDeleteRecording={vi.fn()}
        onRestoreCodeToWorkspace={handleRestore}
      />,
    );

    const applyBtn = screen.getByTitle(/Restore current scrubber code to active editor/i);
    fireEvent.click(applyBtn);

    expect(handleRestore).toHaveBeenCalledWith('print("Initial script")', 'server.py');
    expect(screen.getByText(/Restored!/i)).toBeDefined();
  });

  it('triggers JSON and video export methods without error', async () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    expect(() => downloadSessionJson(mockRecording)).not.toThrow();

    const videoResult = await downloadSessionVideo(mockRecording);
    expect(videoResult).toBe(true);
  });
});
