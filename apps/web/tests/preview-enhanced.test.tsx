import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WebPreview } from '../src/components/preview/WebPreview';
import type { WorkspaceItem } from '../src/components/workspace/workspaceState';

const sampleWorkspace: WorkspaceItem[] = [
  {
    id: '1',
    name: 'index.html',
    path: '/index.html',
    isFolder: false,
    content: '<html><body><h1 className="text-2xl text-blue-500">Hello</h1></body></html>',
    parentId: null,
  },
];

describe('Enhanced WebPreview Component', () => {
  beforeEach(() => {
    vi.stubGlobal('open', vi.fn().mockReturnValue({
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
      closed: false,
    }));
  });

  it('renders viewport mode controls and switches device sizes', async () => {
    render(<WebPreview items={sampleWorkspace} />);

    expect(screen.getByTestId('web-preview-panel')).toBeDefined();
    expect(screen.getByTestId('viewport-desktop-btn')).toBeDefined();
    expect(screen.getByTestId('viewport-tablet-btn')).toBeDefined();
    expect(screen.getByTestId('viewport-mobile-btn')).toBeDefined();

    // Click tablet
    fireEvent.click(screen.getByTestId('viewport-tablet-btn'));
    // In tablet mode, orientation toggle is visible
    expect(screen.getByTestId('preview-orientation-toggle')).toBeDefined();

    // Toggle orientation to landscape
    fireEvent.click(screen.getByTestId('preview-orientation-toggle'));
    expect(screen.getByTestId('preview-orientation-toggle')).toBeDefined();
  });

  it('toggles Tailwind CDN script injection and updates preview iframe srcDoc', async () => {
    render(<WebPreview items={sampleWorkspace} />);

    const tailwindBtn = screen.getByTestId('toggle-tailwind-cdn-btn');
    expect(tailwindBtn).toBeDefined();

    // Toggle Tailwind ON
    fireEvent.click(tailwindBtn);

    await waitFor(() => {
      const iframe = screen.getByTestId('preview-iframe') as HTMLIFrameElement;
      const srcDocContent = iframe.getAttribute('srcdoc') || iframe.srcDoc || '';
      expect(srcDocContent).toContain('cdn.tailwindcss.com');
    });
  });

  it('pops out detached preview window on click', () => {
    render(<WebPreview items={sampleWorkspace} />);

    const detachBtn = screen.getByTestId('detach-preview-btn');
    fireEvent.click(detachBtn);

    expect(window.open).toHaveBeenCalledWith(
      '',
      '_blank',
      expect.stringContaining('width=960')
    );
  });
});
