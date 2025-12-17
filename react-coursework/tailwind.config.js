/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'roboto-mono': ['"Roboto Mono"', 'monospace'],
        'hannari': ['serif'], // или используйте реальный шрифт
        'hanken-grotesk': ['sans-serif'],
      },
    },
  },
  plugins: [],
}