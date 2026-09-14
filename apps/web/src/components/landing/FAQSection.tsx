'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'Do my pairing partners need to install any software or extensions?',
    answer:
      'No. Pairly IDE runs entirely in modern web browsers (Chrome, Firefox, Safari, Edge). Simply share your unique room URL, and your partner joins instantly with an ephemeral guest identity.',
  },
  {
    question: 'How does Pairly resolve concurrent editing conflicts?',
    answer:
      'Pairly uses Yjs conflict-free replicated data types (CRDTs). Edits are modeled as operations on distributed sequence trees and synchronized as binary state vectors over WebSockets. Changes converge deterministically with zero lost keystrokes.',
  },
  {
    question: 'Where is code executed and is it secure?',
    answer:
      'Code execution runs inside isolated, ephemeral container sandboxes. Each run is bounded by strict constraints: a 10-second execution timeout, hard memory limits, and isolated virtual interfaces preventing access to the host network.',
  },
  {
    question: 'How do guest sessions and room lifecycles work?',
    answer:
      'Rooms are generated with unguessable codes (e.g. ABCD-EFGH). Guest credentials remain in session storage, so you can pair without an account. Unused guest rooms with seven consecutive days of inactivity are automatically purged.',
  },
  {
    question: 'Can I export our pair-programming session to GitHub?',
    answer:
      'Yes. Pairly includes a native GitHub Export modal. You can provide a personal access token, choose a target repository and branch, and commit all workspace files directly from the IDE.',
  },
  {
    question: 'Does Pairly support audio or voice communication during pairing?',
    answer:
      'Yes. Pairly integrates direct peer-to-peer WebRTC voice channels, allowing you and your teammates to communicate with sub-second latency while coding together.',
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Answers for developers
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Everything you need to know about pairing, security, sandboxes, and persistence.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden transition-all shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-slate-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
