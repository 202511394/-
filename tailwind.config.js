/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 이 부분이 반드시 있어야 합니다!
  theme: {
    extend: {},
  },
  plugins: [],
}