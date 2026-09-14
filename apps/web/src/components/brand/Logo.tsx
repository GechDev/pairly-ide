import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ size = 26, className = '', showText = false }: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className="relative flex items-center justify-center shrink-0 border transition-all"
        style={{
          width: size,
          height: size,
          backgroundColor: 'var(--canvas-2)',
          borderColor: 'var(--canvas-border)',
        }}
      >
        <Image
          src="/logo.png"
          alt="Pairly"
          width={Math.round(size * 0.9)}
          height={Math.round(size * 0.9)}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className="font-bold text-[15px] tracking-[-0.02em] text-[var(--fg-primary)]">
          Pairly
        </span>
      )}
    </div>
  );
}

export default Logo;
