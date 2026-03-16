/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",       //Buscar en todos los HTML
    "./scripts/*.js"  //Buscar en todos los JS
  ],
  theme: {
    extend: {}, //Personalizar colores, fuentes, ect.
  },
  plugins: [], //Plugins adicionales

}