import { useEffect, useState } from 'react'

/**
 * Ruteo por hash con navegacion tambien por estado, para que el panel se pueda
 * abrir aunque la pagina este embebida en un visor que no deja tocar la URL.
 * VITE_INICIO=panel genera un build que arranca directamente en el panel.
 */
// El build del sistema arranca en el panel, salvo que la URL ya traiga una
// ruta: así se puede abrir la misma página en otra pestaña con #/ y ver la web.
const INICIAL =
  import.meta.env.VITE_INICIO === 'panel' &&
  typeof window !== 'undefined' &&
  !window.location.hash.startsWith('#/')
    ? '/panel'
    : null
const oyentes = new Set()

const leerHash = () => {
  const h = window.location.hash
  return h.startsWith('#/') ? h.slice(1) : '/'
}

export function irA(ruta) {
  try {
    window.location.hash = ruta === '/' ? '' : ruta
  } catch {
    /* visor sin acceso a la URL: alcanza con avisar a los oyentes */
  }
  oyentes.forEach((fn) => fn(ruta))
}

export function useRuta() {
  const [ruta, setRuta] = useState(() => INICIAL ?? leerHash())

  useEffect(() => {
    const alCambiarHash = () => setRuta(leerHash())
    window.addEventListener('hashchange', alCambiarHash)
    oyentes.add(setRuta)
    return () => {
      window.removeEventListener('hashchange', alCambiarHash)
      oyentes.delete(setRuta)
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [ruta])

  return ruta
}
