/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#050505',
          secondary: '#0a0a0a',
          tertiary: '#111111',
          hover: '#1a1a1a',
          active: '#222222',
        },

        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          muted: '#666666',
        },

        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
          active: '#1d4ed8',
          muted: '#1e3a5f',
        },

        border: '#1a1a1a',

        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
