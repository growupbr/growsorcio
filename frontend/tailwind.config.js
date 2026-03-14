/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        // GrowSorcio Design System
        bg:         '#020617',
        surface:    '#0F172A',
        'surface-2':'#1E293B',
        'surface-3':'#334155',
        text:       '#F8FAFC',
        muted:      '#94A3B8',
        accent:     '#FF4500',
        success:    '#22C55E',
        danger:     '#EF4444',
        info:       '#3B82F6',
        warning:    '#F59E0B',
        // backward-compat aliases (usados em classes Tailwind existentes)
        dark: {
          950: '#020617',
          900: '#0F172A',
          800: '#1E293B',
          700: '#1E293B',
          600: '#334155',
          500: '#334155',
          400: '#94A3B8',
          300: '#94A3B8',
          200: '#CBD5E1',
          100: '#F8FAFC',
        },
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
