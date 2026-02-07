/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#0a0a0f',
          surface: '#12121a',
          elevated: '#1a1a24',
          border: '#2a2a35',

          green: '#00ff88',
          'green-dim': '#00cc6a',
          amber: '#ffb86c',
          blue: '#61afef',
          purple: '#c678dd',
          red: '#ff6b6b',
          cyan: '#56b6c2',
          yellow: '#f1fa8c',

          text: '#abb2bf',
          muted: '#5c6370',
          bright: '#ffffff',
        },

        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a24',
          hover: '#252530',
        },
        text: {
          primary: '#abb2bf',
          secondary: '#828997',
          muted: '#5c6370',
        },
        accent: {
          primary: '#00ff88',
          hover: '#00cc6a',
          active: '#00994f',
        },
        border: '#2a2a35',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        terminal: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'terminal-xs': ['11px', { lineHeight: '1.5' }],
        'terminal-sm': ['13px', { lineHeight: '1.5' }],
        'terminal-base': ['14px', { lineHeight: '1.5' }],
        'terminal-lg': ['16px', { lineHeight: '1.5' }],
      },
      boxShadow: {
        'terminal-glow': '0 0 10px rgba(0, 255, 136, 0.3)',
        'terminal-glow-strong': '0 0 20px rgba(0, 255, 136, 0.5)',
        'terminal-border': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'terminal-blink': 'blink 1s step-end infinite',
        'terminal-fade-in': 'fadeIn 0.15s ease-out',
        'terminal-slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
