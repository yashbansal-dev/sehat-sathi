/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // Teal
          600: '#0d9488', // Deep healthcare teal
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        mint: {
          50: '#f2fcf6',
          100: '#e1f8eb',
          200: '#c5f1d8',
          500: '#10b981',
          600: '#059669',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
