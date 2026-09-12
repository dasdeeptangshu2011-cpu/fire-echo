/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#0a1f0a',
          900: '#0f2e0f',
          800: '#1a3d1a',
          700: '#245224',
          600: '#2d6a2d',
          500: '#3d8b3d',
        },
        ember: {
          500: '#f97316',
          400: '#fb923c',
          300: '#fdba74',
        },
        status: {
          normal: '#22c55e',
          watch: '#eab308',
          elevated: '#f97316',
          critical: '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
