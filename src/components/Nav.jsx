import { useEffect, useState } from 'react'
import { NEGOCIO } from '../data/negocio'
import { modoDemo } from '../lib/supabase'
import { irA } from '../lib/ruta'

const LINKS = [
  { href: '#menu', label: 'Menú' },
  { href: '#locales', label: 'Locales' },
  { href: '#contacto', label: 'Contacto' },
]

export default function Nav() {
  const [scrolleado, setScrolleado] = useState(false)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolleado(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolleado
          ? 'bg-ink/95 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.08)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <a
          href="#top"
          className={`display text-xl leading-none tracking-tight sm:text-2xl ${
            scrolleado ? 'text-paper' : 'text-ink'
          }`}
        >
          Nasty<span className="text-flame">.</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm font-semibold uppercase tracking-widest transition-colors ${
                scrolleado
                  ? 'text-ash hover:text-amber'
                  : 'text-ink/70 hover:text-ink'
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {modoDemo && (
            <button
              type="button"
              onClick={() => irA('/panel')}
              className={`hidden rounded-full border px-4 py-2.5 text-xs font-extrabold uppercase tracking-widest transition-colors sm:block ${
                scrolleado
                  ? 'border-amber/60 text-amber hover:bg-amber hover:text-ink'
                  : 'border-ink/40 text-ink hover:bg-ink hover:text-amber'
              }`}
            >
              Ver panel
            </button>
          )}
          <a
            href="#menu"
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest text-amber transition-transform hover:scale-105 sm:text-sm"
          >
            Pedir ahora
          </a>
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={abierto}
            className={`grid h-10 w-10 place-items-center rounded-full border md:hidden ${
              scrolleado ? 'border-white/15 text-paper' : 'border-ink/20 text-ink'
            }`}
          >
            <span className="sr-only">Menú</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {abierto ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 8h16M4 16h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {abierto && (
        <div className="border-t border-white/10 bg-ink px-5 pb-5 pt-2 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setAbierto(false)}
              className="block py-3 text-sm font-semibold uppercase tracking-widest text-paper"
            >
              {l.label}
            </a>
          ))}
          <a
            href={`https://instagram.com/${NEGOCIO.instagram}`}
            target="_blank"
            rel="noreferrer"
            className="block py-3 text-sm font-semibold uppercase tracking-widest text-amber"
          >
            Instagram
          </a>
          {modoDemo && (
            <button
              type="button"
              onClick={() => {
                setAbierto(false)
                irA('/panel')
              }}
              className="block w-full py-3 text-left text-sm font-semibold uppercase tracking-widest text-amber"
            >
              Ver panel del empleado
            </button>
          )}
        </div>
      )}
    </header>
  )
}
