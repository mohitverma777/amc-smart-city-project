/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#0e0e10',
        neonBlue: '#00FFFF',
        cardBg: '#1a1a1d',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(0, 255, 255, 0.5)',
      },
    },
  },
  plugins: [],
};
