import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StatusBar } from '../src/components/workspace/StatusBar';
import { CodeEditor } from '../src/components/editor/CodeEditor';
import type { ParticipantIdentity } from '@pairly/contracts';

const mockParticipant: ParticipantIdentity = {
  id: 'user-test-1',
  displayName: 'Test User',
  avatar: 'user',
  color: '#3b82f6',
  role: 'HOST',
  isGuest: true,
};

describe('Code Editor Ergonomics & Status Bar Controls', () => {
  describe('StatusBar Language Selection & Coordinates', () => {
    it('displays cursor position and opens language dropdown on click', () => {
      const onSelectLanguage = vi.fn();
      const onOpenDiagnostics = vi.fn();

      render(
        <StatusBar
          activeFileName="App.tsx"
          cursorLine={12}
          cursorColumn={8}
          language="TypeScript"
          isConnected={true}
          latencyMs={24}
          onSelectLanguage={onSelectLanguage}
          onOpenDiagnostics={onOpenDiagnostics}
        />
      );

      // Verify line and column tracking
      expect(screen.getByText('Ln 12, Col 8')).toBeDefined();

      // Open language selector
      const langBtn = screen.getByTestId('status-bar-language');
      expect(langBtn.textContent).toBe('TypeScript');
      fireEvent.click(langBtn);

      // Dropdown should be open
      expect(screen.getByTestId('language-select-dropdown')).toBeDefined();
      expect(screen.getByText('Python')).toBeDefined();

      // Click Python
      fireEvent.click(screen.getByText('Python'));
      expect(onSelectLanguage).toHaveBeenCalledWith('Python');

      // Click latency indicator to trigger diagnostics
      const latencyBtn = screen.getByTestId('latency-indicator');
      fireEvent.click(latencyBtn);
      expect(onOpenDiagnostics).toHaveBeenCalled();
    });
  });

  describe('CodeEditor Smart Indentation & Auto-Closing', () => {
    it('renders editor and handles Tab key indentation', () => {
      const onCodeChange = vi.fn();

      render(
        <CodeEditor
          initialCode="const greeting = 'hello';"
          participant={mockParticipant}
          isCollaborative={false}
          onCodeChange={onCodeChange}
        />
      );

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe("const greeting = 'hello';");

      // Place cursor at beginning and press Tab
      textarea.setSelectionRange(0, 0);
      fireEvent.keyDown(textarea, { key: 'Tab' });

      // Indented by 2 spaces
      expect(textarea.value).toBe("  const greeting = 'hello';");
    });

    it('auto-closes parentheses, braces, and quotes', () => {
      render(
        <CodeEditor
          initialCode=""
          participant={mockParticipant}
          isCollaborative={false}
        />
      );

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;

      // Type '('
      textarea.setSelectionRange(0, 0);
      fireEvent.keyDown(textarea, { key: '(' });
      expect(textarea.value).toBe('()');

      // Type '{'
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fireEvent.keyDown(textarea, { key: '{' });
      expect(textarea.value).toBe('{}');

      // Type '"'
      textarea.value = '';
      textarea.setSelectionRange(0, 0);
      fireEvent.keyDown(textarea, { key: '"' });
      expect(textarea.value).toBe('""');
    });

    it('handles auto-indentation on Enter after opening bracket', () => {
      render(
        <CodeEditor
          initialCode="function test() {"
          participant={mockParticipant}
          isCollaborative={false}
        />
      );

      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      const endPos = textarea.value.length;
      textarea.setSelectionRange(endPos, endPos);

      // Hit Enter after opening bracket '{'
      fireEvent.keyDown(textarea, { key: 'Enter' });

      // Should insert newline and indent by 2 spaces
      expect(textarea.value).toBe('function test() {\n  ');
    });
  });
});
