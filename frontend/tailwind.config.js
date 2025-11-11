/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF8F3',
          100: '#FFE6D6',
          200: '#FFD4B3',
          300: '#FFB37A',
          400: '#FF9447',
          500: '#FF7F1A',
          600: '#FF6A00',
          700: '#E45700',
          800: '#B84500',
          900: '#8C3400',
        },
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
    },
  },
  plugins: [],
}

