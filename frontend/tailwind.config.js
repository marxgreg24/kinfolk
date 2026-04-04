/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#CDB53F",
        secondary: "#A0522D",
      },
      fontFamily: {
        merriweather: ["Merriweather", "serif"],
      },
    },
  },
  plugins: [],
}
