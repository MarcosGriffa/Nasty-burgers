import { useEffect, useRef, useState } from 'react'
import Foto from './Foto'
import { NEGOCIO } from '../data/negocio'
import { lerp, mezclarColor, rango, useProgresoScroll } from '../lib/scroll'

/** En desktop la foto arranca en la columna derecha y viaja al centro. */
function useEsDesktop() {
  const [es, setEs] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const on = () => setEs(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return es
}

export default function Hero() {
  const wrap = useRef(null)
  const p = useProgresoScroll(wrap)
  const esDesktop = useEsDesktop()

  const t1 = rango(p, 0, 0.4) // el titular sube y se va
  const t2 = rango(p, 0.34, 0.6) // entra la linea grande
  const t3 = rango(p, 0.72, 1) // el amarillo se apaga

  const fondo = mezclarColor('#f5b301', '#0b0b0b', t3)
  const tinta = mezclarColor('#0b0b0b', '#fff8e7', rango(p, 0.72, 0.92))

  return (
    <section id="top" ref={wrap} className="relative h-[200svh]">
      <div
        className="grain sticky top-0 flex h-svh flex-col justify-center overflow-hidden"
        style={{ backgroundColor: fondo }}
      >
        <div
          className="grain-layer pointer-events-none absolute inset-0"
          style={{ opacity: 0.4 * (1 - t3) }}
        />

        {/* palabra fantasma */}
        <span
          aria-hidden="true"
          className="ghost pointer-events-none absolute left-1/2 top-1/2 z-0 whitespace-nowrap text-[26vw]"
          style={{
            transform: `translate(-50%, -50%) translateX(${-p * 14}vw) scale(${lerp(1, 1.25, p)})`,
            opacity: 1 - t3,
          }}
        >
          Burger
        </span>

        {/* producto: crece y se va al centro */}
        <div
          // en celular la foto va abajo del texto, no atrás: si no, el titular
          // queda ilegible sobre la hamburguesa
          className="pointer-events-none absolute inset-0 z-10 mx-auto flex max-w-7xl items-end px-5 pb-[7vh] sm:px-8 lg:items-center lg:pb-0"
          style={{ justifyContent: esDesktop ? 'flex-end' : 'center' }}
        >
          <div
            className="aspect-square w-[min(76vw,21rem)] will-change-transform lg:w-[min(78vw,26rem)]"
            style={{
              transform: `translate3d(${esDesktop ? -p * 52 : 0}%, ${-p * 4}vh, 0) scale(${lerp(1, 1.45, rango(p, 0, 0.8))}) rotate(${lerp(-6, 5, p)}deg)`,
            }}
          >
            {/* la foto está recortada, así que la sombra la ponemos nosotros:
                una elipse abajo para que la hamburguesa quede apoyada y no
                flotando sobre el amarillo */}
            <div
              className="absolute bottom-[13%] left-1/2 h-[7%] w-[62%] -translate-x-1/2 rounded-[50%] bg-ink/35 blur-xl"
              style={{ opacity: 1 - t3 }}
            />
            <Foto
              img="hero.webp"
              alt="Critical Doble de Nasty Burgers"
              ajuste="contain"
              className="relative h-full w-full drop-shadow-[0_22px_28px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>

        {/* bloque de texto */}
        <div className="relative z-20 mx-auto grid w-full max-w-7xl -translate-y-[15vh] items-center gap-10 px-5 sm:px-8 lg:translate-y-0 lg:grid-cols-[1.15fr_1fr]">
          <div
            style={{
              transform: `translateY(${-t1 * 130}px)`,
              opacity: 1 - t1,
              pointerEvents: t1 > 0.4 ? 'none' : 'auto',
            }}
          >
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-flame" />
              Benavídez · Escobar
            </p>

            <h1 className="display text-ink text-[clamp(3rem,9vw,7.5rem)]">
              No es solo
              <br />
              una
              <br />
              hamburguesa
              <span className="text-flame">.</span>
            </h1>

            <p className="mt-6 max-w-md text-base font-medium text-ink/75 sm:text-lg">
              Smash de 120 g, cheddar de verdad y papas con nuestro sazonado.
              Delivery y take away, de 19:30 a 23:00.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#menu"
                className="rounded-full bg-ink px-8 py-4 text-sm font-extrabold uppercase tracking-widest text-amber transition-transform hover:scale-105"
              >
                Ver el menú
              </a>
              <a
                href={`https://wa.me/${NEGOCIO.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border-2 border-ink px-8 py-4 text-sm font-extrabold uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-amber"
              >
                WhatsApp
              </a>
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-ink/60">
              10% OFF abonando en efectivo
            </p>
          </div>
        </div>

        {/* segunda fase: la linea grande, siempre por encima de la foto */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-5 pb-[10vh] pt-32 text-center sm:px-8"
          style={{
            opacity: t2,
            transform: `translateY(${(1 - t2) * 40}px)`,
            background: `linear-gradient(to top, ${mezclarColor('#f5b301', '#0b0b0b', t3)} 22%, transparent)`,
          }}
        >
          <p
            className="display mx-auto max-w-4xl text-[clamp(2.2rem,6.5vw,5rem)]"
            style={{ color: tinta }}
          >
            De la plancha
            <br />a tu puerta
          </p>
          <a
            href="#menu"
            className="pointer-events-auto mt-6 inline-block rounded-full border-2 px-7 py-3.5 text-xs font-extrabold uppercase tracking-widest"
            style={{ color: tinta, borderColor: tinta }}
          >
            Pedir ahora
          </a>
        </div>

        <a
          href="#menu"
          aria-label="Bajar al menú"
          className="absolute bottom-6 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-2 text-ink/50 sm:flex"
          style={{ opacity: 1 - rango(p, 0, 0.08) }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Scroll</span>
          <span className="h-10 w-px bg-ink/30" />
        </a>
      </div>
    </section>
  )
}
