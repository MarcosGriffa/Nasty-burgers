import { LOCALES } from '../data/negocio'

export default function Locales() {
  return (
    <section id="locales" className="grain relative overflow-hidden bg-amber py-16 text-ink sm:py-24">
      <div className="grain-layer pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <h2 data-reveal className="display mb-10 text-[clamp(2.5rem,7vw,5rem)]">
          Dónde estamos
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {LOCALES.map((l, i) => (
            <div
              key={l.id}
              data-reveal="escala"
              style={{ '--d': `${i * 120}ms` }}
              className="rounded-3xl border-2 border-ink bg-amber/40 p-6 sm:p-8"
            >
              <h3 className="display text-3xl">{l.nombre}</h3>
              <p className="mt-3 text-base font-semibold">{l.direccion}</p>
              <p className="mt-1 text-sm text-ink/70">{l.dias}</p>
              <p className="text-sm text-ink/70">{l.horario} hs</p>

              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={l.maps}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-ink px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-amber transition-transform hover:scale-105"
                >
                  Cómo llegar
                </a>
                <a
                  href={`https://wa.me/${l.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border-2 border-ink px-5 py-3 text-xs font-extrabold uppercase tracking-widest transition-colors hover:bg-ink hover:text-amber"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
