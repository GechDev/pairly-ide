import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NetworkDiagnosticsModal } from '../src/components/room/NetworkDiagnosticsModal';

describe('NetworkDiagnosticsModal Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', timestamp: Date.now() }),
    }));
  });

  it('renders modal with connection status and metrics', () => {
    const onClose = vi.fn();
    render(
      <NetworkDiagnosticsModal
        isOpen={true}
        onClose={onClose}
        roomCode="TEST-DIAG"
        currentPingLatency={24}
        connectionStatus="connected"
      />
    );

    expect(screen.getByTestId('network-diagnostics-modal')).toBeDefined();
    expect(screen.getByText('Network & Collaboration Diagnostics')).toBeDefined();
    expect(screen.getByText('TEST-DIAG')).toBeDefined();
    expect(screen.getByText('24ms')).toBeDefined();
    expect(screen.getByTestId('health-rating-badge')).toBeDefined();
  });

  it('runs diagnostic tests, populates history table, and computes statistics', async () => {
    render(
      <NetworkDiagnosticsModal
        isOpen={true}
        onClose={vi.fn()}
        roomCode="TEST-DIAG"
        currentPingLatency={18}
        connectionStatus="connected"
      />
    );

    // Change iterations to 3
    const iterationsSelect = screen.getByTestId('iterations-select');
    fireEvent.change(iterationsSelect, { target: { value: '3' } });

    // Click Run Diagnostics
    const runBtn = screen.getByTestId('run-diagnostics-btn');
    fireEvent.click(runBtn);

    // Wait for the 3 samples to finish
    await waitFor(() => {
      expect(screen.getByText('Probe Samples (3)')).toBeDefined();
    }, { timeout: 4000 });

    expect(screen.getByText('#1')).toBeDefined();
    expect(screen.getByText('#2')).toBeDefined();
    expect(screen.getByText('#3')).toBeDefined();

    // Copy report button should now be visible
    const copyBtn = screen.getByTestId('copy-report-btn');
    expect(copyBtn).toBeDefined();

    // Clear diagnostics
    const clearBtn = screen.getByTestId('clear-diagnostics-btn');
    fireEvent.click(clearBtn);

    expect(screen.getByText('Probe Samples (0)')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <NetworkDiagnosticsModal
        isOpen={true}
        onClose={onClose}
        roomCode="TEST-DIAG"
      />
    );

    const closeBtn = screen.getByTestId('close-diagnostics-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
