/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f172a',
        panel: '#111827',
        accent: '#2563eb',
      },
      keyframes: {
        'field-pop': {
          '0%': { backgroundColor: 'rgba(37,99,235,0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
      },
      animation: {
        'field-pop': 'field-pop 1.2s ease-out',
      },
    },
  },
  plugins: [],
};
