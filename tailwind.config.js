/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'pool-dark': '#1A2526',
        'pool-blue': '#0074E4',
        'pool-gray': '#A3BFFA',
      },
    },
  },
  plugins: [],
}