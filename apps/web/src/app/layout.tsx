import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL('https://pairly.dev'),
  title: {
    default: 'Pairly IDE: Real-Time Collaborative Cloud Development',
    template: '%s | Pairly IDE',
  },
  description:
    'High-performance cloud pair-programming environment with sub-50ms conflict-free CRDT sync, sandboxed multi-language execution, isolated whiteboard, and server-enforced RBAC.',
  keywords: [
    'pair programming',
    'real-time collaboration',
    'cloud ide',
    'CRDT',
    'yjs',
    'code execution sandbox',
    'monaco editor',
    'developer tools',
  ],
  authors: [{ name: 'Pairly Team' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Pairly IDE: Real-Time Collaborative Cloud Development',
    description:
      'Browser-based collaborative development with zero setup. Share a link, pair in real time, and execute code in isolated sandboxes.',
    url: 'https://pairly.dev',
    siteName: 'Pairly IDE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pairly IDE: Real-Time Collaborative Cloud Development',
    description:
      'Browser-based collaborative development with zero setup. Share a link, pair in real time, and execute code in isolated sandboxes.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans bg-canvas text-canvas-fg antialiased flex flex-col">
        <ThemeProvider defaultTheme="system" storageKey="pairly-theme">
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
