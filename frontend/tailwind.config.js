/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/*.html", //Buscar en todos los HTML
    "./src/scripts/*.js"  //Buscar en todos los JS
  ],
  theme: {
    extend: {}, //Personalizar colores, fuentes, ect.
  },
  plugins: [], //Plugins adicionales

}