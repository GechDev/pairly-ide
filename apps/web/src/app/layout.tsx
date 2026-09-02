import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/theme/ThemeProvider';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const metadata: Metadata = {
  title: 'Pairly - Cloud Pair-Programming & Real-time Collaboration IDE',
  description:
    'A high-performance cloud pair-programming environment with sub-50ms conflict-free sync, browser-based sandboxes, voice channels, and contextual AI.',
  keywords: [
    'pair programming',
    'real-time collaboration',
    'cloud ide',
    'monaco editor',
    'code execution',
    'ai pair programmer',
  ],
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
          <Header />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
