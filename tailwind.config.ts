import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Hero Design System Colors
        'ir-bg': {
          primary: '#020617',
          secondary: '#111827',
          tertiary: '#1f2937',
          card: '#0f172a',
        },
        'ir-accent': {
          teal: '#14b8a6',
          cyan: '#06b6d4',
          purple: '#a855f7',
          magenta: '#ec4899',
          amber: '#f59e0b',
          blue: '#3b82f6',
        },
      },
      boxShadow: {
        ambient: "0 18px 60px rgba(15,23,42,0.8)",
        'hero-card': "0 4px 24px rgba(0,0,0,0.4)",
        'hero-glow': "0 0 30px rgba(20,184,166,0.15)",
      },
      borderColor: {
        'ir-subtle': 'rgba(255, 255, 255, 0.08)',
        'ir-accent': 'rgba(20, 184, 166, 0.3)',
      },
    },
  },
  plugins: [],
} as Config;
