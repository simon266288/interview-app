/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // blue-600
          50: '#eff6ff',
        },
        success: '#22C55E', // green-500
        danger: '#EF4444', // red-500
        surface: '#FFFFFF',
        text: {
          DEFAULT: '#111827',
          muted: '#6B7280',
        },
        background: '#F9FAFB',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
