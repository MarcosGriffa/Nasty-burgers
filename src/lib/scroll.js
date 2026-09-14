import { useEffect, useState } from 'react'

export const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n))

/** Normaliza n dentro del rango [a, b] a 0..1 */
export const rango = (n, a, b) => clamp((n - a) / (b - a))

export const lerp = (a, b, t) => a + (b - a) * t

/** Interpola dos colores hex. Devuelve "rgb(r, g, b)". */
export function mezclarColor(hexA, hexB, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [r1, g1, b1] = p(hexA)
  const [r2, g2, b2] = p(hexB)
  const m = (a, b) => Math.round(lerp(a, b, clamp(t)))
  return `rgb(${m(r1, r2)}, ${m(g1, g2)}, ${m(b1, b2)})`
}

export const menosMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Progreso 0..1 del scroll dentro de un elemento alto que contiene un hijo
 * `sticky`. 0 = recien empieza a pegarse, 1 = termina de despegarse.
 */
export function useProgresoScroll(ref) {
  const [p, setP] = useState(0)

  useEffect(() => {
    if (menosMovimiento()) return
    let raf = 0

    const calcular = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const recorrido = r.height - window.innerHeight
      setP(recorrido <= 0 ? 0 : clamp(-r.top / recorrido))
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(calcular)
    }

    calcular()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])

  return p
}

/**
 * Observa todos los [data-reveal] del documento y les pone .is-visible
 * cuando entran en pantalla. Incluye los que aparecen despues (filtros
 * del buscador, comandas nuevas), via MutationObserver.
 */
export function useReveals() {
  useEffect(() => {
    const marcarTodo = () =>
      document
        .querySelectorAll('[data-reveal]')
        .forEach((el) => el.classList.add('is-visible'))

    if (menosMovimiento() || !('IntersectionObserver' in window)) {
      marcarTodo()
      return
    }

    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
    )

    const escanear = () =>
      document
        .querySelectorAll('[data-reveal]:not(.is-visible)')
        .forEach((el) => io.observe(el))

    escanear()
    const mo = new MutationObserver(escanear)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
}

/** Velocidad de scroll normalizada, para acelerar la cinta. */
export function useVelocidadScroll() {
  const [v, setV] = useState(0)

  useEffect(() => {
    if (menosMovimiento()) return
    let ultimo = window.scrollY
    let raf = 0
    let actual = 0

    const tick = () => {
      const y = window.scrollY
      const delta = Math.abs(y - ultimo)
      ultimo = y
      actual = lerp(actual, clamp(delta / 40), 0.15)
      setV(actual)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return v
}
