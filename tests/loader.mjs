// Resuelve los imports sin extension, como hace Vite. Solo para correr tests.
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve as res } from 'node:path'
export async function resolve(especificador, contexto, siguiente) {
  if (especificador.startsWith('.') && !/\.[a-z]+$/.test(especificador)) {
    const base = dirname(fileURLToPath(contexto.parentURL))
    for (const ext of ['.js', '.jsx', '/index.js']) {
      const p = res(base, especificador + ext)
      if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true }
    }
  }
  return siguiente(especificador, contexto)
}
