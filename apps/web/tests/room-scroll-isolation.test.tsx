import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { AppShell } from '../src/components/layout/AppShell';
import { ThemeProvider } from '../src/components/theme/ThemeProvider';

// Mock next/navigation
const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe('AppShell Room Layout and Scroll Isolation', () => {
  it('omits marketing header and footer on /room routes to prevent scroll overflow', () => {
    mockPathname.mockReturnValue('/room/uk74-ztwc');

    const { container } = render(
      <ThemeProvider>
        <AppShell>
          <div data-testid="test-room-content">IDE Workspace Content</div>
        </AppShell>
      </ThemeProvider>
    );

    // Verify room content is present
    expect(screen.getByTestId('test-room-content')).toBeDefined();

    // Verify marketing header and footer are NOT rendered
    expect(container.querySelector('footer')).toBeNull();
    expect(screen.queryByText('Start a room')).toBeNull();
    expect(screen.queryByText('Capabilities')).toBeNull();

    // Verify body overflow is locked to hidden
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('renders marketing header and footer on public routes like / and /docs', () => {
    mockPathname.mockReturnValue('/docs');

    const { container } = render(
      <ThemeProvider>
        <AppShell>
          <div data-testid="public-content">Public Docs Content</div>
        </AppShell>
      </ThemeProvider>
    );

    // Verify marketing header and footer ARE rendered
    expect(container.querySelector('footer')).not.toBeNull();
    expect(screen.getAllByText('Capabilities').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Start a room').length).toBeGreaterThanOrEqual(1);

    // Verify overflow is not locked on public pages
    expect(document.body.style.overflow).toBe('');
  });
});
