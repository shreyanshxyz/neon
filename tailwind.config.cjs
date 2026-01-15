/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1a1a1a',
          secondary: '#2d2d2d',
          tertiary: '#404040',
          hover: '#3a3a3a',
        },
        text: {
          primary: '#ffffff',
          secondary: '#cccccc',
          muted: '#888888',
        },
        accent: {
          primary: '#4a90e2',
          hover: '#3a7bc8',
          active: '#2d6cb5',
        },
        border: '#404040',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
