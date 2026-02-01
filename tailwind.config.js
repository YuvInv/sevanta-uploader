/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      colors: {
        // Warm neutrals (replace gray usage)
        warm: {
          50: '#FAFAF8',
          100: '#F5F4F0',
          200: '#E8E6E1',
          300: '#D4D1C9',
          400: '#A8A49A',
          500: '#78746A',
          600: '#5C584F',
          700: '#3D3A33',
          800: '#252319',
          900: '#141310',
        },
        // Semantic colors - softer, warmer versions
        success: {
          50: '#F0F9F4',
          100: '#D1F0DE',
          500: '#22A563',
          600: '#1B8A52',
          700: '#156B40',
        },
        caution: {
          50: '#FFFBF0',
          100: '#FFF3D1',
          500: '#E5A000',
          600: '#CC8E00',
          700: '#A37200',
        },
        danger: {
          50: '#FFF5F5',
          100: '#FFE0E0',
          500: '#DC4A4A',
          600: '#C43C3C',
          700: '#A32E2E',
        },
        // Accent - warm teal
        accent: {
          50: '#F0F9F7',
          100: '#D1F0EA',
          200: '#A3E1D5',
          400: '#2DD4BF',
          500: '#0D9488',
          600: '#0B7A70',
          700: '#095E57',
        },
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(37, 35, 25, 0.05)',
        DEFAULT: '0 4px 12px rgba(37, 35, 25, 0.08)',
        md: '0 4px 12px rgba(37, 35, 25, 0.08)',
        lg: '0 8px 24px rgba(37, 35, 25, 0.12)',
        focus: '0 0 0 3px rgba(13, 148, 136, 0.2)',
      },
      fontSize: {
        // Senior-friendly sizing
        xs: ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
        sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14px
        base: ['0.9375rem', { lineHeight: '1.5rem' }], // 15px
        lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.875rem' }], // 20px
      },
    },
  },
  plugins: [],
};
