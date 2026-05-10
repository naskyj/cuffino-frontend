/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "./src/**/*.{js,jsx,ts,tsx}",],
  theme: {
    extend: {
      colors: {
        "black": "#000000",
        "white": "#FFFFFF",
        "primary": "#A86746"
      },
       backgroundImage:{
        "hero":"url('/assets/images/hero-bg.svg')",
        "auth-bg":"url('/assets/images/auth/auth-bg.png')",
        // "hero-mobile":"url('/images/hero-mobile-background.svg')",
        // "minting":"url('/images/minting-bg.svg')",
      },
    },
  },
  plugins: [],
}
