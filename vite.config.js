import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { fileURLToPath } from 'node:url'

// BUILD_SINGLE=1 npm run build  ->  genera un unico index.html autocontenido
// npm run build                 ->  build normal para Vercel / Netlify
const single = process.env.BUILD_SINGLE === '1'
const esPanel = process.env.VITE_INICIO === 'panel'
const soloWeb = process.env.VITE_SOLO_WEB === '1'

/**
 * En la version publica, el panel se reemplaza por un modulo vacio.
 *
 * El `import()` dinamico de App.jsx no alcanza: aunque la condicion sea falsa y
 * nunca se ejecute, el empaquetador genera igual un archivo aparte con TODO el
 * panel adentro, y ese archivo queda publicado en el sitio. Cambiando a que
 * modulo apunta, lo que se empaqueta son cuatro lineas.
 */
const sacarElPanel = () => ({
  name: 'sacar-el-panel-de-la-web-publica',
  // 'pre' para que se resuelva antes que el resolvedor de Vite: si llega
  // despues, el import ya quedo apuntando al panel de verdad.
  enforce: 'pre',
  resolveId(fuente) {
    if (!soloWeb) return null
    if (/(^|\/)panel\/Shell(\.jsx)?$/.test(fuente)) {
      return fileURLToPath(new URL('./src/panel/sin-panel.jsx', import.meta.url))
    }
    return null
  },
})

/**
 * El sitio del local no es para que lo encuentre nadie.
 *
 * Va a estar publicado en internet para que el encargado entre desde la
 * computadora del local sin instalar nada, pero no tiene por qué aparecer en
 * Google. El buscador no es una protección —lo que protege es el login y las
 * reglas de la base—, pero tampoco hay motivo para publicarlo en una vidriera.
 *
 * Y de paso la pestaña dice qué es, que con las dos páginas abiertas al mismo
 * tiempo se confunden.
 */
const marcarComoPrivado = () => ({
  name: 'marcar-el-panel-como-privado',
  transformIndexHtml(html) {
    if (!esPanel) return html
    return html
      .replace(
        '<meta name="theme-color"',
        '<meta name="robots" content="noindex, nofollow" />\n    <meta name="theme-color"',
      )
      .replace(
        /<title>.*?<\/title>/,
        '<title>Nasty — Sistema del local</title>',
      )
  },
  generateBundle() {
    if (!esPanel || single) return
    this.emitFile({
      type: 'asset',
      fileName: 'robots.txt',
      source: 'User-agent: *\nDisallow: /\n',
    })
  },
})

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    sacarElPanel(),
    marcarComoPrivado(),
    ...(single ? [viteSingleFile()] : []),
  ],
  build: {
    // en modo single-file inlineamos tambien las fuentes
    assetsInlineLimit: single ? 100_000_000 : 4096,
    outDir: single ? 'dist-single' : 'dist',
  },
})
