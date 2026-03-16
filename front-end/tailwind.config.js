/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./router/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
    "./*.tsx",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#06b6d4',
        'brand-secondary': '#8b5cf6',
        'brand-accent': '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
