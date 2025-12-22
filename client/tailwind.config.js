/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        corporate: {
          navy: '#0F172A',
          blue: '#3B82F6',
          slate: '#1E293B',
          text: '#F8FAFC',
          muted: '#94A3B8',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}