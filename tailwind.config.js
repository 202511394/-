/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 이 설정이 꼭 있어야 합니다!
  theme: {
    extend: {},
  },
  plugins: [],
}