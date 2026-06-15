/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: '#0f172a',
        canvas: '#f6f7fb',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.06), 0 10px 30px -12px rgba(15,23,42,.18)',
        lift: '0 4px 10px rgba(15,23,42,.08), 0 24px 48px -16px rgba(15,23,42,.28)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .35s ease both',
      },
    },
  },
  plugins: [],
};
