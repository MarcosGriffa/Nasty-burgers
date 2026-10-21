/**
 * El panel, en la version publica: no existe.
 *
 * Con VITE_SOLO_WEB=1 este archivo REEMPLAZA a Shell.jsx (ver vite.config.js).
 * No alcanza con no renderizarlo: el `import()` dinamico de App.jsx hace que el
 * empaquetador genere igual un archivo con todo el panel adentro, y ese archivo
 * queda publicado y lo puede pedir cualquiera. Se comprobo: en dist-web/assets
 * aparecia un `Shell-xxxx.js` con las pantallas de caja.
 *
 * Reemplazando el modulo entero, lo que viaja son estas pocas lineas.
 */
export default function SinPanel() {
  return null
}
