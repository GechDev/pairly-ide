import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPaletteModal } from '../src/components/room/CommandPaletteModal';
import type { WorkspaceItem } from '../src/components/workspace/workspaceState';

const mockFiles: WorkspaceItem[] = [
  { id: 'file-1', name: 'main.ts', isFolder: false, parentId: null, content: 'console.log("hi");' },
  { id: 'file-2', name: 'styles.css', isFolder: false, parentId: null, content: 'body { margin: 0; }' },
];

describe('CommandPaletteModal Component', () => {
  it('renders command palette and displays commands and workspace files', () => {
    const onClose = vi.fn();
    const onRunCode = vi.fn();
    const onSelectFile = vi.fn();

    render(
      <CommandPaletteModal
        isOpen={true}
        onClose={onClose}
        workspaceFiles={mockFiles}
        onSelectFile={onSelectFile}
        onRunCode={onRunCode}
        onTogglePreview={vi.fn()}
        onToggleTerminal={vi.fn()}
        onOpenCheckpoints={vi.fn()}
        onOpenSettings={vi.fn()}
        onToggleChat={vi.fn()}
        onToggleNotepad={vi.fn()}
        onToggleAi={vi.fn()}
        onToggleMedia={vi.fn()}
        onOpenShare={vi.fn()}
        onOpenGitHubImport={vi.fn()}
        onOpenDiagnostics={vi.fn()}
        onOpenAbout={vi.fn()}
        onOpenReport={vi.fn()}
        onOpenLeave={vi.fn()}
      />
    );

    // Should render input
    const input = screen.getByTestId('command-palette-input');
    expect(input).toBeDefined();

    // Should list files
    expect(screen.getByText('Open: main.ts')).toBeDefined();
    expect(screen.getByText('Open: styles.css')).toBeDefined();

    // Should list standard commands
    expect(screen.getByText('Run Code in Sandbox')).toBeDefined();
    expect(screen.getByText('Toggle Live Web Preview')).toBeDefined();
  });

  it('filters actions by search query and executes selected action on Enter', () => {
    const onClose = vi.fn();
    const onRunCode = vi.fn();

    render(
      <CommandPaletteModal
        isOpen={true}
        onClose={onClose}
        workspaceFiles={mockFiles}
        onSelectFile={vi.fn()}
        onRunCode={onRunCode}
        onTogglePreview={vi.fn()}
        onToggleTerminal={vi.fn()}
        onOpenCheckpoints={vi.fn()}
        onOpenSettings={vi.fn()}
        onToggleChat={vi.fn()}
        onToggleNotepad={vi.fn()}
        onToggleAi={vi.fn()}
        onToggleMedia={vi.fn()}
        onOpenShare={vi.fn()}
        onOpenGitHubImport={vi.fn()}
        onOpenDiagnostics={vi.fn()}
        onOpenAbout={vi.fn()}
        onOpenReport={vi.fn()}
        onOpenLeave={vi.fn()}
      />
    );

    const input = screen.getByTestId('command-palette-input');
    fireEvent.change(input, { target: { value: 'run' } });

    // Should display matching item
    expect(screen.getByText('Run Code in Sandbox')).toBeDefined();

    // Press Enter to trigger top matched item
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onClose).toHaveBeenCalled();
    expect(onRunCode).toHaveBeenCalled();
  });

  it('navigates with arrow keys and closes on Escape', () => {
    const onClose = vi.fn();

    render(
      <CommandPaletteModal
        isOpen={true}
        onClose={onClose}
        workspaceFiles={mockFiles}
        onSelectFile={vi.fn()}
        onRunCode={vi.fn()}
        onTogglePreview={vi.fn()}
        onToggleTerminal={vi.fn()}
        onOpenCheckpoints={vi.fn()}
        onOpenSettings={vi.fn()}
        onToggleChat={vi.fn()}
        onToggleNotepad={vi.fn()}
        onToggleAi={vi.fn()}
        onToggleMedia={vi.fn()}
        onOpenShare={vi.fn()}
        onOpenGitHubImport={vi.fn()}
        onOpenDiagnostics={vi.fn()}
        onOpenAbout={vi.fn()}
        onOpenReport={vi.fn()}
        onOpenLeave={vi.fn()}
      />
    );

    const input = screen.getByTestId('command-palette-input');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
