/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#070910',
        'panel': 'rgba(16, 20, 36, 0.92)',
        'panel-alt': 'rgba(20, 24, 42, 0.95)',
        'border-soft': 'rgba(120, 142, 182, 0.22)',
        'border-strong': 'rgba(120, 142, 182, 0.42)',
        'accent': '#6d6eff',
        'accent-hover': '#5456ff',
        'success': '#2bc37b',
        'warning': '#f3b13b',
        'error': '#ef5350',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
