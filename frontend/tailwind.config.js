/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        // Grow Up — GitHub Dark-inspired palette
        dark: {
          950: '#080B14',   // page background
          900: '#0D1117',   // card / panel background
          800: '#0a0f1a',   // gradient end
          700: '#161B22',   // elevated / inputs
          600: '#1C2333',   // borders
          500: '#30363D',   // subtle borders / hover borders
          400: '#484F58',   // tertiary text
          300: '#8B949E',   // secondary text
          200: '#C9D1D9',   // dimmed primary
          100: '#F0F6FC',   // primary text
        },
        // Grow Up Orange
        accent: {
          DEFAULT: '#FF4500',
          hover:   '#e03d00',
          light:   '#ff6a33',
          muted:   'rgba(255,69,0,0.12)',
        },
        success: '#22c55e',
        danger:  '#ef4444',
        warning: '#f59e0b',
      },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(255,69,0,0.12)',
        'glow':     '0 0 24px rgba(255,69,0,0.15)',
        'glow-lg':  '0 0 40px rgba(255,69,0,0.20)',
        'card':     '0 4px 24px rgba(0,0,0,0.4)',
        'card-lg':  '0 8px 40px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
