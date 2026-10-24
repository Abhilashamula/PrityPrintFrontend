import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark premium brand palette
        'brand': {
          DEFAULT: '#6C63FF',   // vibrant indigo-violet
          light:   '#8B83FF',
          dark:    '#4B43D6',
          glow:    'rgba(108, 99, 255, 0.35)',
        },
        'accent': {
          orange:  '#FF6B35',   // vivid orange
          teal:    '#00D4AA',   // neon teal
          pink:    '#FF3CAC',   // hot pink
          yellow:  '#FFD60A',   // golden yellow
        },
        'surface': {
          DEFAULT: '#0f1923',   // deep navy
          1:       '#141d2e',
          2:       '#1a2540',
          3:       '#1f2d4d',
          card:    'rgba(255,255,255,0.04)',
          glass:   'rgba(255,255,255,0.07)',
        },
        'ink': {
          DEFAULT: '#F0F4FF',
          muted:   'rgba(240,244,255,0.55)',
          dim:     'rgba(240,244,255,0.30)',
          faint:   'rgba(240,244,255,0.12)',
        },
        // Legacy tokens (keep for compatibility)
        'pp-blue':   { DEFAULT: '#6C63FF', light: '#8B83FF', lighter: '#C8C5FF', dark: '#4B43D6', darker: '#322B9E' },
        'pp-orange': { DEFAULT: '#FF6B35', light: '#FF8A5B', dark: '#D44E1F' },
        'pp-bg':     '#0f1923',
        'pp-dark':   '#F0F4FF',
        'pp-gray':   'rgba(240,244,255,0.55)',
        'lux-ink':   '#F0F4FF',
        'lux-paper': '#0f1923',
        'lux-copper': '#FF6B35',
        'lux-sage':  '#00D4AA',
      },
      fontFamily: {
        sans:    ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Syne', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #6C63FF 0%, #FF3CAC 100%)',
        'gradient-teal':    'linear-gradient(135deg, #00D4AA 0%, #6C63FF 100%)',
        'gradient-fire':    'linear-gradient(135deg, #FF6B35 0%, #FF3CAC 100%)',
        'gradient-surface': 'linear-gradient(160deg, #141d2e 0%, #0f1923 100%)',
        'gradient-glass':   'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        'gradient-dark':    'linear-gradient(180deg, #0f1923 0%, #091525 100%)',
        'hero-mesh':        'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,60,172,0.12) 0%, transparent 60%), radial-gradient(ellipse at 60% 80%, rgba(0,212,170,0.10) 0%, transparent 60%)',
      },
      boxShadow: {
        'glow-brand':  '0 0 40px rgba(108,99,255,0.35)',
        'glow-orange': '0 0 30px rgba(255,107,53,0.40)',
        'glow-teal':   '0 0 30px rgba(0,212,170,0.35)',
        'card':        '0 8px 32px rgba(0,0,0,0.32)',
        'card-hover':  '0 20px 60px rgba(0,0,0,0.50)',
        'premium':     '0 24px 80px rgba(0,0,0,0.60)',
        'inner-glow':  'inset 0 0 30px rgba(108,99,255,0.10)',
      },
      animation: {
        'float-1':      'float1 6s ease-in-out infinite',
        'float-2':      'float2 8s ease-in-out infinite',
        'float-3':      'float3 7s ease-in-out infinite',
        'pulse-slow':   'pulseSlow 2.5s ease-in-out infinite',
        'fade-in':      'fadeIn 0.45s ease-out',
        'slide-up':     'slideUp 0.45s cubic-bezier(.2,.8,.2,1)',
        'spin-slow':    'spin 3s linear infinite',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'bounce-slow':  'bounceSlow 2s ease-in-out infinite',
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px) rotate(0deg)' },
          '33%':      { transform: 'translateY(-20px) translateX(10px) rotate(1deg)' },
          '66%':      { transform: 'translateY(10px) translateX(-10px) rotate(-1deg)' },
        },
        float2: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '50%':      { transform: 'translateY(-30px) translateX(-15px)' },
        },
        float3: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-15px)' },
        },
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 20px 40px rgba(108,99,255,0.30)' },
          '50%':      { transform: 'scale(1.04)', boxShadow: '0 28px 55px rgba(108,99,255,0.50)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108,99,255,0.30)' },
          '50%':      { boxShadow: '0 0 50px rgba(108,99,255,0.65)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        bounceSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      minHeight: { touch: '48px' },
      minWidth:  { touch: '48px' },
    },
  },
  plugins: [],
} satisfies Config
