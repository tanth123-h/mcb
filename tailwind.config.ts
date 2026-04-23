import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // MCB Design System
        bg:        '#0A0F14',
        surface:   '#0D1520',
        border:    '#1A2535',
        'border-bright': '#243040',
        text:      '#E6EDF3',
        'text-dim': '#8B99A6',
        'text-muted': '#4A5568',
        accent:    '#7AA2F7',
        'accent-dim': '#4A6FA5',
        'accent-glow': '#7AA2F7',
        // Status colors
        active:    '#4ADE80',
        injured:   '#FBBF24',
        deceased:  '#F87171',
        missing:   '#94A3B8',
        observation: '#A78BFA',
        // UI states
        danger:    '#EF4444',
        success:   '#22C55E',
        pending:   '#F59E0B',
        rejected:  '#EF4444',
      },
      fontFamily: {
        mono:    ['var(--font-mono)', 'Courier New', 'monospace'],
        sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      backgroundImage: {
        'scanlines': "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
        'grid-dark': "linear-gradient(rgba(122,162,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(122,162,247,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        'scanlines': '100% 4px',
        'grid-dark': '40px 40px',
      },
      animation: {
        'flicker':      'flicker 0.15s infinite',
        'glitch':       'glitch 2s infinite',
        'scanline':     'scanline 8s linear infinite',
        'fadeIn':       'fadeIn 0.5s ease forwards',
        'slideUp':      'slideUp 0.4s ease forwards',
        'pulse-glow':   'pulseGlow 2s ease-in-out infinite',
        'blink':        'blink 1s step-end infinite',
        'reveal':       'reveal 0.6s ease forwards',
        'noise':        'noise 0.5s steps(1) infinite',
        'status-pulse': 'statusPulse 3s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.92' },
        },
        glitch: {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '92%':           { transform: 'translate(-2px, 1px)' },
          '94%':           { transform: 'translate(2px, -1px)' },
          '96%':           { transform: 'translate(-1px, 2px)' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(122,162,247,0.3)' },
          '50%':      { boxShadow: '0 0 20px rgba(122,162,247,0.6), 0 0 40px rgba(122,162,247,0.2)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        reveal: {
          from: { opacity: '0', transform: 'translateY(8px)', filter: 'blur(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)',   filter: 'blur(0)' },
        },
        noise: {
          '0%':  { backgroundPosition: '0 0' },
          '20%': { backgroundPosition: '-5% -10%' },
          '40%': { backgroundPosition: '-15% 5%' },
          '60%': { backgroundPosition: '7% -25%' },
          '80%': { backgroundPosition: '20% 25%' },
        },
        statusPulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
      boxShadow: {
        'accent': '0 0 20px rgba(122,162,247,0.15)',
        'accent-lg': '0 0 40px rgba(122,162,247,0.2)',
        'inset-accent': 'inset 0 1px 0 rgba(122,162,247,0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
