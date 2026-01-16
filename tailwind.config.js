/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './react-project/src/**/*.{js,jsx,ts,tsx}',
    './react-project/public/index.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Outfit', 'sans-serif'],           // Default sans-serif
        'system': ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'], // Tailwind's original default
        'calibri': ['Calibri', 'Carlito', 'Arial', 'sans-serif'], // Microsoft Calibri (system font)
        'outfit': ['Outfit', 'sans-serif'],
        'serif': ['Cormorant Garamond', 'serif'],
        'display': ['Playfair Display', 'serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

