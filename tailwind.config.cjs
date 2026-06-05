module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#04050a',
        surface: '#0a0c14',
        'surface-2': '#0f1120',
        border: 'rgba(255,255,255,0.07)',
        accent: {
          DEFAULT: '#6366f1',
          soft:    '#818cf8',
          muted:   'rgba(99,102,241,0.15)',
          glow:    'rgba(99,102,241,0.35)',
        },
        cyan: {
          glow: 'rgba(6,182,212,0.35)',
        },
        emerald: {
          glow: 'rgba(16,185,129,0.35)',
        },
        red: {
          glow: 'rgba(239,68,68,0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':  'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(99,102,241,0.3)',
        'glow-md':  '0 0 24px rgba(99,102,241,0.4), 0 0 48px rgba(99,102,241,0.15)',
        'glow-lg':  '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)',
        'glow-cyan':'0 0 24px rgba(6,182,212,0.4), 0 0 48px rgba(6,182,212,0.15)',
        'glow-emerald':'0 0 24px rgba(16,185,129,0.4), 0 0 48px rgba(16,185,129,0.15)',
        'glow-red': '0 0 24px rgba(239,68,68,0.4), 0 0 48px rgba(239,68,68,0.15)',
        'glass':    '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'glass-lg': '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card':     '0 4px 24px rgba(0,0,0,0.3)',
      },
      animation: {
        'float':          'float 6s ease-in-out infinite',
        'float-delayed':  'float 6s ease-in-out 3s infinite',
        'pulse-slow':     'pulse 4s ease-in-out infinite',
        'spin-slow':      'spin 20s linear infinite',
        'glow-pulse':     'glow-pulse 2.5s ease-in-out infinite',
        'glow-pulse-cyan':'glow-pulse-cyan 2.5s ease-in-out infinite',
        'glow-pulse-green':'glow-pulse-green 2.5s ease-in-out infinite',
        'glow-pulse-red': 'glow-pulse-red 2.5s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'shimmer':        'shimmer 2.5s linear infinite',
        'scan-line':      'scan-line 3s ease-in-out infinite',
        'blob':           'blob 12s ease-in-out infinite',
        'blob-delayed':   'blob 12s ease-in-out 4s infinite',
        'data-packet':    'data-packet 2s ease-in-out infinite',
        'ripple':         'ripple 0.6s ease-out',
        'breathe':        'breathe 4s ease-in-out infinite',
        'slide-up':       'slide-up 0.5s ease-out',
        'confetti-fall':  'confetti-fall 1s ease-out forwards',
        'count-up':       'count-up 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(99,102,241,0.3), 0 0 16px rgba(99,102,241,0.1)' },
          '50%':      { boxShadow: '0 0 20px rgba(99,102,241,0.6), 0 0 40px rgba(99,102,241,0.25)' },
        },
        'glow-pulse-cyan': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(6,182,212,0.3), 0 0 16px rgba(6,182,212,0.1)' },
          '50%':      { boxShadow: '0 0 20px rgba(6,182,212,0.6), 0 0 40px rgba(6,182,212,0.25)' },
        },
        'glow-pulse-green': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(16,185,129,0.3), 0 0 16px rgba(16,185,129,0.1)' },
          '50%':      { boxShadow: '0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.25)' },
        },
        'glow-pulse-red': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(239,68,68,0.3), 0 0 16px rgba(239,68,68,0.1)' },
          '50%':      { boxShadow: '0 0 20px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.25)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(200%)' },
        },
        blob: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%':      { borderRadius: '30% 60% 70% 40% / 50% 60% 30% 60%' },
          '50%':      { borderRadius: '50% 60% 30% 60% / 40% 30% 70% 50%' },
          '75%':      { borderRadius: '40% 60% 50% 50% / 60% 40% 60% 30%' },
        },
        'data-packet': {
          '0%':   { left: '15%', opacity: 0, transform: 'scale(0.5)' },
          '10%':  { opacity: 1, transform: 'scale(1)' },
          '90%':  { opacity: 1, transform: 'scale(1)' },
          '100%': { left: '80%', opacity: 0, transform: 'scale(0.5)' },
        },
        ripple: {
          '0%':   { transform: 'scale(0)', opacity: 0.5 },
          '100%': { transform: 'scale(4)', opacity: 0 },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.8 },
          '50%':      { transform: 'scale(1.05)', opacity: 1 },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)',    opacity: 1 },
        },
        'confetti-fall': {
          '0%':   { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
          '100%': { transform: 'translateY(60px) rotate(360deg)', opacity: 0 },
        },
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    }
  },
  plugins: []
}
