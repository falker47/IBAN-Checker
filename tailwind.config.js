/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./script.js"],
  theme: {
    extend: {
      colors: {
        'body-bg': '#b9cdc9',
        'container-bg': '#f2f7f6',
        'accent-orange': '#FFB347',
        'accent-teal': '#7a9f9c',
        'accent-teal-hover': '#74c4bf',
        'border-color': '#506e69',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
