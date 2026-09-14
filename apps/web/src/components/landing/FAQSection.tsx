'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Do partners need to install anything?',
    answer:
      'No. Pairly runs entirely in modern browsers — Chrome, Firefox, Safari, and Edge. Share your room URL, and partners join instantly as ephemeral guests with no registration required.',
  },
  {
    question: 'How does Pairly resolve concurrent editing conflicts?',
    answer:
      'Pairly uses Yjs conflict-free replicated data types (CRDTs). Edits are modeled as operations on distributed sequence trees and synchronized as binary state vectors over WebSockets. Changes converge deterministically — zero lost keystrokes, always.',
  },
  {
    question: 'Where does code run, and how is it isolated?',
    answer:
      'Every execution runs inside an ephemeral, quarantined container with a 10-second timeout, hard memory limits, and a virtual network interface isolated from the host. No code escapes the sandbox.',
  },
  {
    question: 'How do room codes and guest sessions work?',
    answer:
      'Rooms are identified by unguessable 8-character codes (ABCD-EFGH). Guest credentials live in sessionStorage — you can pair without an account. Rooms inactive for seven consecutive days are automatically purged.',
  },
  {
    question: 'Can I export our session to GitHub?',
    answer:
      'Yes. Pairly includes a native GitHub Export modal. Provide a personal access token, choose a repository and branch, and commit all workspace files directly from the IDE without leaving the browser.',
  },
  {
    question: 'Does Pairly support voice communication?',
    answer:
      'Yes. Pairly integrates direct peer-to-peer WebRTC audio channels, letting you and teammates communicate with sub-second latency while coding together — no third-party call tool required.',
  },
];

function useScrollReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-visible'); }),
      { rootMargin: '0px 0px -80px 0px' }
    );
    const el = ref.current;
    if (el) el.querySelectorAll('.reveal').forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const ref = useScrollReveal();

  return (
    <section ref={ref} className="py-[clamp(5rem,10vw,9rem)] bg-[#111114] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-white/[0.06]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Left column – sticky header */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 self-start">

            <h2 className="reveal text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-[-0.03em] leading-[1.05] text-[#f0ede8]">
              Questions, answered.
            </h2>
            <p className="reveal mt-5 text-[15px] text-[#a09a92] leading-[1.65] font-[380]">
              Everything developers commonly ask about pairing, security, sandbox isolation, and session persistence.
            </p>
          </div>

          {/* Right column – accordion */}
          <div className="lg:col-span-8">
            <div className="divide-y divide-white/[0.06]">
              {FAQS.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="reveal">
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-6 py-6 text-left group"
                      aria-expanded={isOpen}
                    >
                      <span className="text-[16px] font-semibold tracking-[-0.01em] text-[#f0ede8] group-hover:text-[#FF0000] transition-colors duration-150">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#5c5651] shrink-0 transition-transform duration-250 ${isOpen ? 'rotate-180 text-[#FF0000]' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="pb-6 text-[15px] text-[#a09a92] leading-[1.7] font-[380] animate-fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
