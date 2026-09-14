/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      sm: '0px',
      DEFAULT: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      colors: {
        // Canvas – warm dark palette
        canvas: {
          DEFAULT: '#0a0a0b',
          2: '#111114',
          3: '#18181c',
        },
        // Foreground – warm off-white
        fg: {
          DEFAULT: '#f0ede8',
          2: '#a09a92',
          3: '#5c5651',
        },
        // Accent
        accent: {
          DEFAULT: '#FF0000',
          dim: 'rgba(255,0,0,0.12)',
        },
        // Surfaces
        surface: {
          dark: '#111114',
          'dark-card': '#18181c',
          'dark-border': 'rgba(255,255,255,0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Display scale inspired by Capsule's kinetic large type
        'display-2xl': ['clamp(4rem, 10vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-xl':  ['clamp(3rem, 7vw, 6rem)', { lineHeight: '0.97', letterSpacing: '-0.035em' }],
        'display-lg':  ['clamp(2.25rem, 5vw, 4rem)', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'display-md':  ['clamp(1.75rem, 3.5vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
      },
      animation: {
        'fade-up':      'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':      'fade-in 0.5s ease both',
        'ticker':       'ticker-scroll 36s linear infinite',
        'pulse-dot':    'pulse-dot 2s ease-in-out infinite',
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'glow':         'glow-pulse 2.5s ease-in-out infinite',
        'float':        'float-slow 4s ease-in-out infinite',
        'spin-slow':    'spin 8s linear infinite',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'ticker-scroll': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':       { opacity: '0.5', transform: 'scale(0.75)' },
        },
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,0,0,0.35)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(255,0,0,0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        // Subtle dot grid
        'dot-grid': 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        // Fine line grid
        'line-grid': `
          linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'dot-grid':  '28px 28px',
        'line-grid': '40px 40px',
      },
      boxShadow: {
        'accent-glow': '0 0 40px rgba(255, 0, 0, 0.18)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.3)',
        'card-hover':  '0 4px 24px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.4)',
        'inset-top':   'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
