/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#fdf4fb',
          100: '#fae6f5',
          200: '#f5caec',
          300: '#eda0d9',
          400: '#dd6cbc',
          500: '#c2409e',
          600: '#a42884',
          700: '#8c1e80',
          800: '#6b1761',
          900: '#58144e',
          950: '#360a2e',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        cta: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        dark: {
          bg: '#020617',
          card: '#0f172a',
          elevated: '#1e293b',
        },
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
      },
      letterSpacing: {
        tight: '-0.025em',
      },
      lineHeight: {
        relaxed: '1.7',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
        'card-hover': '0 8px 24px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.04)',
        'elevated': '0 12px 36px -8px rgba(15,23,42,0.12), 0 4px 12px -2px rgba(15,23,42,0.05)',
        'floating': '0 24px 64px -16px rgba(15,23,42,0.16), 0 8px 24px -6px rgba(15,23,42,0.06)',
        'inner-subtle': 'inset 0 1px 2px rgba(15,23,42,0.04)',
        'glow-sm': '0 0 12px -3px rgba(140,30,128,0.4)',
        'glow-md': '0 0 24px -6px rgba(140,30,128,0.35)',
        'glow-accent': '0 0 16px -3px rgba(245,158,11,0.35)',
        'glow-cta': '0 0 16px -3px rgba(225,29,72,0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        'shimmer-line': 'shimmerLine 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        shimmerLine: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
