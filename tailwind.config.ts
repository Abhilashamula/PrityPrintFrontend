import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'pp-blue': {
          DEFAULT: '#C77952',
          light:   '#D99A78',
          lighter: '#E7D5C9',
          dark:    '#9B563B',
          darker:  '#6B3828',
        },
        'pp-orange': {
          DEFAULT: '#C77952',
          light:   '#D99A78',
          dark:    '#9B563B',
        },
        'pp-bg':   '#F5F0E8',
        'pp-dark': '#17211F',
        'pp-gray': '#65706B',
        'lux-ink': '#17211F',
        'lux-paper': '#F5F0E8',
        'lux-copper': '#C77952',
        'lux-sage': '#A7B6A0',
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      animation: {
        'float-1':    'float1 6s ease-in-out infinite',
        'float-2':    'float2 8s ease-in-out infinite',
        'float-3':    'float3 7s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 2.5s ease-in-out infinite',
        'fade-in':    'fadeIn 0.4s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'spin-slow':  'spin 3s linear infinite',
        'tip-fade':   'tipFade 0.5s ease-in-out',
      },
      keyframes: {
        float1: {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '33%':      { transform: 'translateY(-20px) translateX(10px)' },
          '66%':      { transform: 'translateY(10px) translateX(-10px)' },
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
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 20px 40px rgba(255, 107, 53, 0.3)' },
          '50%':      { transform: 'scale(1.04)', boxShadow: '0 28px 55px rgba(255, 107, 53, 0.45)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        tipFade: {
          '0%':  { opacity: '0', transform: 'translateY(4px)' },
          '100%':{ opacity: '1', transform: 'translateY(0)' },
        },
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
} satisfies Config

