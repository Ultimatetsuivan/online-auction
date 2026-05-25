/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Map to CSS variable tokens
        bn: {
          primary: 'var(--bn-primary)',
          'primary-light': 'var(--bn-primary-light)',
          'primary-dark': 'var(--bn-primary-dark)',
          success: 'var(--bn-success)',
          'success-light': 'var(--bn-success-light)',
          warning: 'var(--bn-warning)',
          'warning-light': 'var(--bn-warning-light)',
          danger: 'var(--bn-danger)',
          'danger-light': 'var(--bn-danger-light)',
          info: 'var(--bn-info)',
          'info-light': 'var(--bn-info-light)',
          bg: 'var(--bn-bg)',
          'bg-secondary': 'var(--bn-bg-secondary)',
          surface: 'var(--bn-surface)',
          'surface-hover': 'var(--bn-surface-hover)',
          text: 'var(--bn-text)',
          'text-secondary': 'var(--bn-text-secondary)',
          'text-tertiary': 'var(--bn-text-tertiary)',
          border: 'var(--bn-border)',
          divider: 'var(--bn-divider)',
        },
        // Keep primary for existing Tailwind classes
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        // Amber accent — prices, timers, money signals only
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs': 'var(--bn-shadow-xs)',
        'card': 'var(--bn-shadow-card)',
        'card-hover': 'var(--bn-shadow-card-hover)',
        'soft': 'var(--bn-shadow-sm)',
        'soft-md': 'var(--bn-shadow-md)',
        'soft-lg': 'var(--bn-shadow-lg)',
        'airbnb': 'var(--bn-shadow-lg)',
      },
      borderRadius: {
        'bn-sm': 'var(--bn-radius-sm)',
        'bn-md': 'var(--bn-radius-md)',
        'bn-lg': 'var(--bn-radius-lg)',
        'bn-xl': 'var(--bn-radius-xl)',
        'bn-2xl': 'var(--bn-radius-2xl)',
      },
      maxWidth: {
        'bn': 'var(--bn-max-width)',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        'header': 'var(--bn-header-height)',
      },
      transitionTimingFunction: {
        'bn': 'var(--bn-ease)',
        'bn-bounce': 'var(--bn-ease-bounce)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
