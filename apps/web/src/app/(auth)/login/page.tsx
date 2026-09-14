'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Github, Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleMagicLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setMagicLinkSent(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 pt-24 pb-16 relative" style={{ backgroundColor: 'var(--canvas)' }}>
      {/* Background accent glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(255,0,0,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Fine line grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      <div className="relative w-full max-w-[400px] flex flex-col items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mb-8 group" aria-label="Pairly home">
          <div className="w-9 h-9 flex items-center justify-center border transition-all group-hover:border-[#FF0000]" style={{ backgroundColor: 'var(--canvas-2)', borderColor: 'var(--canvas-border)' }}>
            <Image
              src="/logo.png"
              alt="Pairly"
              width={26}
              height={26}
              className="object-contain"
              priority
            />
          </div>
          <span className="font-bold text-lg tracking-[-0.02em] text-[var(--fg-primary)]">Pairly</span>
        </Link>

        {/* Card */}
        <div className="w-full rounded-xl border border-white/[0.08] bg-[#111114] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          <div className="text-center mb-7">
            <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#f0ede8]">Welcome to Pairly</h1>
            <p className="text-[13px] text-[#5c5651] mt-2 leading-relaxed">
              Sign in to manage persistent rooms, GitHub integrations, and settings.
            </p>
          </div>

          {/* Social OAuth */}
          <div className="space-y-2.5 mb-6">
            <button
              type="button"
              onClick={() => { window.location.href = '/api/v1/integrations/github/repos'; }}
              className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#18181c] hover:bg-white/[0.06] py-2.5 text-[13px] font-semibold text-[#f0ede8] transition-all btn-press"
            >
              <Github className="h-4 w-4 text-[#a09a92]" />
              <span>Continue with GitHub</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#18181c] hover:bg-white/[0.06] py-2.5 text-[13px] font-semibold text-[#f0ede8] transition-all btn-press"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-white/[0.06] w-full" />
            <span className="bg-[#111114] px-3 text-[10px] uppercase tracking-[0.12em] text-[#5c5651] font-mono font-semibold absolute">
              or magic link
            </span>
          </div>

          {/* Magic Link Form */}
          {magicLinkSent ? (
            <div className="rounded-xl border border-[#FF0000]/20 bg-[#FF0000]/08 p-5 text-center space-y-2">
              <CheckCircle2 className="h-7 w-7 text-[#FF0000] mx-auto" />
              <h3 className="text-[14px] font-bold text-[#f0ede8]">Magic Link Sent!</h3>
              <p className="text-[12px] text-[#a09a92] leading-relaxed">
                Check your inbox at{' '}
                <span className="font-mono font-bold text-[#f0ede8]">{email}</span>{' '}
                to log in instantly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[12px] font-semibold text-[#a09a92] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-[11px] h-4 w-4 text-[#5c5651]" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@example.com"
                    className="w-full bg-[#0a0a0b] border border-white/[0.08] rounded-lg py-2.5 pl-10 pr-4 text-[14px] text-[#f0ede8] placeholder-[#5c5651] focus:outline-none focus:ring-2 focus:ring-[#FF0000]/40 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF0000] hover:bg-[#e60000] py-2.5 text-[14px] font-bold text-white transition-all btn-press disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Magic Link</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Guest reminder */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-[12px] text-[#5c5651]">
              No account required.{' '}
              <Link href="/" className="text-[#FF0000] font-semibold hover:underline">
                Create a guest room →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
