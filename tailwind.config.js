/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  safelist: [
    'bg-emerald-50',
    'bg-blue-50',
    'bg-orange-50',
    'text-emerald-600',
    'text-blue-600',
    'text-orange-600',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981',
        danger: '#ef4444',
        'sidebar-dark': '#2C5F6F',
        'sidebar-darker': '#234B57',
        'bg-main': '#E8F4F8',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
