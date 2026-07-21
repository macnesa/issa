/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./node_modules/flowbite/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {},
    fontFamily: {
      raleway: ["Raleway"],
      Playfair: ["Playfair Display"],
      Comfortaa: ["Comfortaa"],
    },
  },
  daisyui: {
    themes: false,
  },
  plugins: [require("daisyui"), require("flowbite/plugin")],
};
