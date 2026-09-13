import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RemotePointers, type RemotePointer } from '../src/components/presence/RemotePointers';
import { StatusBar } from '../src/components/workspace/StatusBar';
import { ShareRoomModal } from '../src/components/room/ShareRoomModal';

describe('Collaborative Presence & Workspace Enhancements (CodeX Inspired)', () => {
  describe('RemotePointers Component', () => {
    it('renders remote participant cursors and filters out self pointer', () => {
      const mockPointers: Record<string, RemotePointer> = {
        'user-1': {
          id: 'user-1',
          name: 'Alice',
          color: '#10b981',
          x: 25.5,
          y: 40.2,
          lastUpdate: Date.now(),
        },
        'user-self': {
          id: 'user-self',
          name: 'Self Host',
          color: '#6366f1',
          x: 50.0,
          y: 50.0,
          lastUpdate: Date.now(),
        },
      };

      const { container } = render(
        <RemotePointers
          currentUserId="user-self"
          pointers={mockPointers}
        />
      );

      // Alice's pointer should exist
      expect(screen.getByTestId('remote-pointer-user-1')).toBeDefined();
      expect(screen.getByText('Alice')).toBeDefined();

      // Self pointer should NOT be rendered
      expect(container.querySelector('[data-testid="remote-pointer-user-self"]')).toBeNull();
    });
  });

  describe('StatusBar Component', () => {
    it('renders coordinates, file name, language, and latency meter', () => {
      const onToggleTerminal = vi.fn();
      const onTogglePreview = vi.fn();

      render(
        <StatusBar
          activeFileName="gateway.ts"
          cursorLine={42}
          cursorColumn={15}
          language="TypeScript"
          isConnected={true}
          latencyMs={35}
          isTerminalOpen={true}
          isPreviewOpen={false}
          onToggleTerminal={onToggleTerminal}
          onTogglePreview={onTogglePreview}
        />
      );

      expect(screen.getByText('gateway.ts')).toBeDefined();
      expect(screen.getByText('Ln 42, Col 15')).toBeDefined();
      expect(screen.getByText('TypeScript')).toBeDefined();
      expect(screen.getByTestId('latency-indicator')).toBeDefined();

      // Click terminal toggle
      fireEvent.click(screen.getByTitle('Toggle Terminal Panel'));
      expect(onToggleTerminal).toHaveBeenCalled();
    });
  });

  describe('ShareRoomModal Component', () => {
    it('displays join link, room short code, and copies link to clipboard', () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
        writable: true,
      });

      render(
        <ShareRoomModal
          isOpen={true}
          onClose={vi.fn()}
          roomCode="abc-1234"
          isHost={true}
          isLocked={false}
          onToggleLock={vi.fn()}
        />
      );

      expect(screen.getByText('Share Collaboration Room')).toBeDefined();
      expect(screen.getByText('abc-1234')).toBeDefined();

      // Click copy button
      const copyBtn = screen.getByTestId('copy-link-btn');
      fireEvent.click(copyBtn);
      expect(writeTextMock).toHaveBeenCalledWith(expect.stringContaining('abc-1234'));
    });
  });
});
