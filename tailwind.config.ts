import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#e50914',
          dark: '#050505',
          panel: 'rgba(255,255,255,0.08)',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(229, 9, 20, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
