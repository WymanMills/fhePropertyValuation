import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'accent': '#6d6eff',
        'accent-hover': '#5456ff',
        'success': '#2bc37b',
        'panel': 'rgba(16, 20, 36, 0.92)',
        'border': 'rgba(120, 142, 182, 0.22)',
      },
      borderRadius: {
        'lg': '1.35rem',
        'md': '1.05rem',
        'full': '999px',
      },
      backdropBlur: {
        'glass': '18px',
      },
    },
  },
  plugins: [],
}
export default config
