/** @type {import('tailwindcss').Config} */
module.exports = {
  // darkMode: false,
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // white: { "100": "black" },
        primary: { "50": "#eff6ff", "100": "#dbeafe", "200": "#bfdbfe", "300": "#93c5fd", "400": "#60a5fa", "500": "#3b82f6", "600": "#2563eb", "700": "#1d4ed8", "800": "#1e40af", "900": "#1e3a8a" },
        primary2: { "10": "#d9faef", "100": "#469e81", "200": "#bfdbfe", "300": "#93c5fd", "400": "#60a5fa", "500": "#3b82f6", "600": "#2563eb", "700": "#1d4ed8", "800": "#1e40af", "900": "#1e3a8a" }
      },
      fontSize: {
        'sedang': '1em',
        'kecil': '0.6em',
        'kecil2': '0.8em'
      },
      backgroundColor: {
        'gray': { "800": "white" }
      }
    },
    fontFamily: {
      body: ['"Plus Jakarta Sans"', 'sans-serif'],
      sans: ['"Plus Jakarta Sans"', 'sans-serif'],
    }
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('child', '& > *');
      // addVariant('child-hover', '& > *:hover');
    },
  ],
}
