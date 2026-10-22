/** Identidad visual de Happy Kids (ver guía de marca aprobada). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Colores del logo: solo para el logo, íconos y detalles grandes
        rosa: '#EE547B',
        amarillo: '#EBDC52',
        verde: '#44AE94',
        lila: '#9C859D',
        // Texto y acción
        violeta: '#5B4FC4',
        tinta: '#3B3354',
        suave: '#6B6280',
        fondo: '#FBFAFF',
        // Pasteles de la interfaz
        pastel: {
          lavanda: '#ECE8FF',
          cielo: '#DDF1FB',
          rosa: '#FDE4EB',
          menta: '#DCF3EC',
          mantequilla: '#FFF6C7',
        },
      },
      fontFamily: {
        titulo: ['"Fredoka Variable"', 'system-ui', 'sans-serif'],
        texto: ['Nunito', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
