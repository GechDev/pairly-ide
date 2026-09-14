import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhiteboardModal, type WhiteboardElement } from '../src/components/whiteboard/WhiteboardModal';

const mockElements: WhiteboardElement[] = [
  {
    id: 'el-1',
    type: 'pen',
    points: [{ x: 10, y: 10 }, { x: 50, y: 50 }],
    color: '#10b981',
    strokeWidth: 3,
  },
  {
    id: 'el-2',
    type: 'rect',
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    color: '#3b82f6',
    strokeWidth: 4,
  },
];

describe('WhiteboardModal Component', () => {
  it('renders toolbar, tools, and canvas', () => {
    const onClose = vi.fn();
    const onAddElement = vi.fn();
    const onClearElements = vi.fn();

    render(
      <WhiteboardModal
        isOpen={true}
        onClose={onClose}
        roomCode="room-whiteboard-1"
        elements={mockElements}
        onAddElement={onAddElement}
        onClearElements={onClearElements}
      />
    );

    // Title and Room Code badge
    expect(screen.getByText('Architecture Whiteboard')).toBeDefined();
    expect(screen.getByText('room-whiteboard-1')).toBeDefined();

    // Tools
    expect(screen.getByTestId('tool-pen')).toBeDefined();
    expect(screen.getByTestId('tool-line')).toBeDefined();
    expect(screen.getByTestId('tool-rect')).toBeDefined();
    expect(screen.getByTestId('tool-circle')).toBeDefined();
    expect(screen.getByTestId('tool-text')).toBeDefined();
    expect(screen.getByTestId('tool-eraser')).toBeDefined();

    // Canvas
    const canvas = screen.getByTestId('whiteboard-canvas');
    expect(canvas).toBeDefined();

    // Tool switching
    const rectBtn = screen.getByTestId('tool-rect');
    fireEvent.click(rectBtn);
    expect(rectBtn.className).toContain('bg-brand-600');

    // Clear canvas button
    const clearBtn = screen.getByTestId('whiteboard-clear-btn');
    fireEvent.click(clearBtn);
    expect(onClearElements).toHaveBeenCalled();
  });

  it('handles mouse drawing and adds drawn pen element', () => {
    const onAddElement = vi.fn();

    render(
      <WhiteboardModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="room-whiteboard-1"
        elements={[]}
        onAddElement={onAddElement}
        onClearElements={vi.fn()}
      />
    );

    const canvas = screen.getByTestId('whiteboard-canvas');

    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = vi.fn(() => ({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    fireEvent.mouseDown(canvas, { clientX: 20, clientY: 30 });
    fireEvent.mouseMove(canvas, { clientX: 40, clientY: 60 });
    fireEvent.mouseUp(canvas, { clientX: 70, clientY: 90 });

    expect(onAddElement).toHaveBeenCalledTimes(1);
    const added = onAddElement.mock.calls[0][0];
    expect(added.type).toBe('pen');
    expect(added.points.length).toBeGreaterThanOrEqual(2);
  });
});
