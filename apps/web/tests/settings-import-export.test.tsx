import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EditorSettingsModal,
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
} from '../src/components/room/EditorSettingsModal';

describe('EditorSettingsModal JSON Export & Import (CodeX Parity)', () => {
  const mockSettings: EditorSettings = {
    fontSize: 16,
    tabSize: 4,
    wordWrap: true,
    lineNumbers: true,
    theme: 'vs-dark',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Export and Import buttons in the modal footer', () => {
    render(
      <EditorSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={mockSettings}
        onUpdateSettings={vi.fn()}
      />,
    );

    expect(screen.getByTestId('export-settings-btn')).toBeDefined();
    expect(screen.getByTestId('import-settings-btn')).toBeDefined();
  });

  it('triggers JSON blob creation on Export Settings click', () => {
    const createObjectURLMock = vi.fn(() => 'blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <EditorSettingsModal
        isOpen={true}
        onClose={vi.fn()}
        settings={mockSettings}
        onUpdateSettings={vi.fn()}
      />,
    );

    const exportBtn = screen.getByTestId('export-settings-btn');
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
  });
});
