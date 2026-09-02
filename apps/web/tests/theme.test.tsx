import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../src/components/theme/ThemeProvider';
import { ThemeToggle } from '../src/components/theme/ThemeToggle';

describe('ThemeProvider and ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders ThemeToggle button with accessible aria-label and test id', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-label')).toBe('Toggle dark/light theme');
  });

  it('toggles between dark and light themes upon click', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByTestId('theme-toggle');
    
    // Initial click should toggle theme
    await act(async () => {
      fireEvent.click(button);
    });

    const storedTheme = localStorage.getItem('pairly_theme');
    expect(storedTheme).toBe('light');

    // Click again to toggle back
    await act(async () => {
      fireEvent.click(button);
    });

    expect(localStorage.getItem('pairly_theme')).toBe('dark');
  });

  it('throws error when useTheme is called outside ThemeProvider', () => {
    function InvalidConsumer() {
      useTheme();
      return <div>Invalid</div>;
    }

    // Suppress console error during expected exception
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<InvalidConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    );
    spy.mockRestore();
  });
});
