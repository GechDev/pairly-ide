import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SharedTerminal } from '../src/components/terminal/SharedTerminal';
import type { ExecutionOutputChunk } from '@pairly/contracts';

describe('SharedTerminal Output Download & Actions (CodeX Parity)', () => {
  const mockChunks: ExecutionOutputChunk[] = [
    { runId: 'run-1', stream: 'stdout', data: 'Compiling project...\n', timestamp: 1000 },
    { runId: 'run-1', stream: 'stdout', data: 'Build succeeded in 340ms.\n', timestamp: 1340 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Download Output button and triggers download', () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <SharedTerminal
        chunks={mockChunks}
        status="COMPLETED"
        exitCode={0}
        durationMs={340}
        onClear={vi.fn()}
      />
    );

    const downloadBtn = screen.getByLabelText(/Download terminal output/i);
    expect(downloadBtn).toBeDefined();

    fireEvent.click(downloadBtn);
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it('renders clear output button and triggers onClear handler', () => {
    const handleClear = vi.fn();

    render(
      <SharedTerminal
        chunks={mockChunks}
        status="COMPLETED"
        exitCode={0}
        durationMs={340}
        onClear={handleClear}
      />
    );

    const clearBtn = screen.getByTitle(/Clear terminal output/i);
    fireEvent.click(clearBtn);

    expect(handleClear).toHaveBeenCalled();
  });
});
