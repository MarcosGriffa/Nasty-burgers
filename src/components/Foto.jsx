import { useState } from 'react'

/**
 * Fotos que viajan DENTRO del archivo.
 * Todo lo que está en src/img/ se empaqueta con la página: por eso las fotos
 * se ven igual en el HTML suelto que se abre desde la PC, sin carpetas al lado.
 * Las que se agreguen después en public/img/ siguen funcionando por URL.
 */
const EMPAQUETADAS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../img/*.{jpg,jpeg,png,webp}', {
      eager: true,
      query: '?url',
      import: 'default',
    }),
  ).map(([ruta, url]) => [ruta.split('/').pop(), url]),
)

const fuente = (img) =>
  EMPAQUETADAS[img] ?? `${import.meta.env.BASE_URL}img/${img}`

/**
 * Imagen de producto con fallback.
 * Si el archivo no existe, muestra un placeholder de marca en vez de romper
 * el layout con el icono de imagen rota.
 */
export default function Foto({ img, alt, className = '', ajuste = 'cover' }) {
  const [falla, setFalla] = useState(!img)

  if (falla) {
    return (
      <div
        className={`grid place-items-center bg-linear-to-br from-amber to-amber-deep ${className}`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 48" className="h-1/2 w-1/2 opacity-25" fill="none">
          <path
            d="M8 20c0-7 7-12 16-12s16 5 16 12"
            stroke="#0B0B0B"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M6 25h36M6 31c4 3 8 0 12 3s8 0 12 3 8-1 12-3"
            stroke="#0B0B0B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 38h32"
            stroke="#0B0B0B"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    )
  }

  return (
    <img
      src={fuente(img)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFalla(true)}
      className={`${ajuste === 'contain' ? 'object-contain' : 'object-cover'} ${className}`}
    />
  )
}
