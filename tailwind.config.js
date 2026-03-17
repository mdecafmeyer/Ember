/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'journal': {
          'dark': '#4A3728',
          'medium': '#8B7D6B', 
          'light': '#A49585',
        },
        'rose': {
          'dusty': '#D4A0A0',
          'soft': '#E8C4C4', 
          'pale': '#F2DEDE',
          'muted': '#C08080',
        },
        'linen': {
          'cream': '#FDF8F4',
          'warm': '#F5F0EB',
        }
      },
      fontFamily: {
        'heading': ['Playfair Display', 'serif'],
        'body': ['Lato', 'sans-serif'],
      },
      boxShadow: {
        'journal': '0 2px 12px rgba(139, 125, 107, 0.08)',
        'journal-hover': '0 4px 20px rgba(139, 125, 107, 0.12)',
      }
    },
  },
  plugins: [],
}