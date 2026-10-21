import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// BUILD_SINGLE=1 npm run build  ->  genera un unico index.html autocontenido
// npm run build                 ->  build normal para Vercel / Netlify
const single = process.env.BUILD_SINGLE === '1'
const esPanel = process.env.VITE_INICIO === 'panel'

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
  plugins: [react(), tailwindcss(), marcarComoPrivado(), ...(single ? [viteSingleFile()] : [])],
  build: {
    // en modo single-file inlineamos tambien las fuentes
    assetsInlineLimit: single ? 100_000_000 : 4096,
    outDir: single ? 'dist-single' : 'dist',
  },
})
