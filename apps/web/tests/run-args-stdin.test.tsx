import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RunArgsModal } from '../src/components/room/RunArgsModal';

describe('RunArgsModal & CLI Arguments / Stdin (CodeX Parity)', () => {
  it('renders modal with arguments and stdin fields', () => {
    render(
      <RunArgsModal
        isOpen={true}
        onClose={vi.fn()}
        args={['--port', '8080']}
        stdin="initial user input"
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByTestId('run-args-modal')).toBeDefined();
    expect(screen.getByTestId('cli-args-input')).toBeDefined();
    expect(screen.getByTestId('stdin-input')).toBeDefined();
    expect((screen.getByTestId('cli-args-input') as HTMLInputElement).value).toBe('--port 8080');
    expect((screen.getByTestId('stdin-input') as HTMLTextAreaElement).value).toBe(
      'initial user input',
    );
  });

  it('allows editing CLI arguments and saving configuration', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <RunArgsModal isOpen={true} onClose={handleClose} args={[]} stdin="" onSave={handleSave} />,
    );

    const argsInput = screen.getByTestId('cli-args-input');
    const stdinInput = screen.getByTestId('stdin-input');

    fireEvent.change(argsInput, { target: { value: '--host 0.0.0.0 --verbose' } });
    fireEvent.change(stdinInput, { target: { value: 'alice\nsecret123\n' } });

    const saveBtn = screen.getByTestId('save-run-args-btn');
    fireEvent.click(saveBtn);

    expect(handleSave).toHaveBeenCalledWith(
      ['--host', '0.0.0.0', '--verbose'],
      'alice\nsecret123\n',
    );
    expect(handleClose).toHaveBeenCalled();
  });

  it('triggers onRunWithArgs when Run with Args is clicked', () => {
    const handleRunWithArgs = vi.fn();
    const handleClose = vi.fn();

    render(
      <RunArgsModal
        isOpen={true}
        onClose={handleClose}
        args={['--debug']}
        stdin="hello"
        onSave={vi.fn()}
        onRunWithArgs={handleRunWithArgs}
      />,
    );

    const runBtn = screen.getByTestId('run-with-args-btn');
    fireEvent.click(runBtn);

    expect(handleRunWithArgs).toHaveBeenCalledWith(['--debug'], 'hello');
    expect(handleClose).toHaveBeenCalled();
  });

  it('clears inputs when individual clear buttons or reset is clicked', () => {
    render(
      <RunArgsModal
        isOpen={true}
        onClose={vi.fn()}
        args={['--flag']}
        stdin="piped input"
        onSave={vi.fn()}
      />,
    );

    const clearArgsBtn = screen.getByText('Clear args');
    fireEvent.click(clearArgsBtn);
    expect((screen.getByTestId('cli-args-input') as HTMLInputElement).value).toBe('');

    const clearStdinBtn = screen.getByText('Clear stdin');
    fireEvent.click(clearStdinBtn);
    expect((screen.getByTestId('stdin-input') as HTMLTextAreaElement).value).toBe('');
  });
});
