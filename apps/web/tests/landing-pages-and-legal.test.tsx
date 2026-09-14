import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Header } from '../src/components/layout/Header';
import { Footer } from '../src/components/layout/Footer';
import { InteractiveProductDemo } from '../src/components/landing/InteractiveProductDemo';
import { ArchitectureSection } from '../src/components/landing/ArchitectureSection';
import { FAQSection } from '../src/components/landing/FAQSection';
import { FinalCTASection } from '../src/components/landing/FinalCTASection';
import PrivacyPage from '../src/app/privacy/page';
import TermsPage from '../src/app/terms/page';
import DocsPage from '../src/app/docs/page';

import { ThemeProvider } from '../src/components/theme/ThemeProvider';

describe('Startup Public Landing & Legal Pages', () => {
  it('renders Header with navigation links and start room CTA', () => {
    render(
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    );
    expect(screen.getByText('Pairly')).toBeDefined();
    expect(screen.getByText('Capabilities')).toBeDefined();
    expect(screen.getByText('Start a room')).toBeDefined();
  });

  it('renders Footer with working legal and documentation links (no # placeholders)', () => {
    const { container } = render(<Footer />);
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText('Terms of Service')).toBeDefined();
    expect(screen.getByText('Documentation')).toBeDefined();

    // Check that privacy and terms links point to /privacy and /terms
    const links = container.querySelectorAll('a');
    const hrefs = Array.from(links).map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/privacy');
    expect(hrefs).toContain('/terms');
    expect(hrefs).toContain('/docs');
    expect(hrefs).not.toContain('#privacy');
    expect(hrefs).not.toContain('#terms');
  });

  it('renders InteractiveProductDemo with code tabs and run button', () => {
    render(<InteractiveProductDemo />);
    expect(screen.getByText('See Pairly in action')).toBeDefined();
    expect(screen.getByText('index.ts')).toBeDefined();
    expect(screen.getByText('Run Code')).toBeDefined();
  });

  it('renders ArchitectureSection with 3 distributed system tiers', () => {
    render(<ArchitectureSection />);
    expect(screen.getByText('Designed for deterministic collaboration')).toBeDefined();
    expect(screen.getByText(/Yjs CRDT & Monaco Core/i)).toBeDefined();
    expect(screen.getByText(/Fastify & Redis Pub\/Sub/i)).toBeDefined();
    expect(screen.getByText(/Container Sandboxing/i)).toBeDefined();
  });

  it('renders FAQSection with developer questions and toggleable answers', () => {
    render(<FAQSection />);
    expect(screen.getByText('Answers for developers')).toBeDefined();
    expect(
      screen.getByText(/Do my pairing partners need to install any software or extensions/i)
    ).toBeDefined();
  });

  it('renders FinalCTASection with room launch link', () => {
    render(<FinalCTASection />);
    expect(screen.getByText('Ready to pair with your team?')).toBeDefined();
    expect(screen.getByText('Start an Instant Room')).toBeDefined();
  });

  it('renders PrivacyPage with GDPR rights and data retention policy', () => {
    render(<PrivacyPage />);
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText(/1\. Overview and Core Philosophy/i)).toBeDefined();
    expect(screen.getByText(/4\. User Rights and GDPR \/ CCPA Compliance/i)).toBeDefined();
  });

  it('renders TermsPage with acceptable use and sandbox quotas', () => {
    render(<TermsPage />);
    expect(screen.getByText('Terms of Service')).toBeDefined();
    expect(screen.getByText(/3\. Acceptable Use and Sandbox Security/i)).toBeDefined();
  });

  it('renders DocsPage with system architecture and keyboard shortcuts', () => {
    render(<DocsPage />);
    expect(screen.getByText('Pairly IDE Documentation')).toBeDefined();
    expect(screen.getByText(/6\. Keyboard Shortcuts/i)).toBeDefined();
    expect(screen.getByText('Command Palette')).toBeDefined();
  });
});
