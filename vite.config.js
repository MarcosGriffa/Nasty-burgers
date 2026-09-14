import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// BUILD_SINGLE=1 npm run build  ->  genera un unico index.html autocontenido
// npm run build                 ->  build normal para Vercel / Netlify
const single = process.env.BUILD_SINGLE === '1'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile()] : [])],
  build: {
    // en modo single-file inlineamos tambien las fuentes
    assetsInlineLimit: single ? 100_000_000 : 4096,
    outDir: single ? 'dist-single' : 'dist',
  },
})
