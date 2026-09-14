import { NEGOCIO } from '../data/negocio'
import { irA } from '../lib/ruta'

export default function Footer() {
  return (
    <footer id="contacto" className="bg-ink pb-28 pt-16 sm:pb-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-12 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="display text-4xl text-paper sm:text-5xl">
              Nasty<span className="text-flame">.</span>
            </p>
            <p className="mt-3 max-w-sm text-sm text-ash">{NEGOCIO.claim}</p>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber">
              Contacto
            </p>
            <ul className="space-y-2 text-sm text-ash">
              <li>
                <a
                  href={`https://wa.me/${NEGOCIO.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-paper"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${NEGOCIO.email}`} className="hover:text-paper">
                  {NEGOCIO.email}
                </a>
              </li>
              <li>
                <a
                  href={`https://instagram.com/${NEGOCIO.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-paper"
                >
                  @{NEGOCIO.instagram}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber">
              Horarios
            </p>
            <ul className="space-y-2 text-sm text-ash">
              <li>Benavídez · Mié a Dom</li>
              <li>Escobar · Lun a Dom</li>
              <li>19:30 a 23:00 hs</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="text-xs text-ash/70">
            © {new Date().getFullYear()} {NEGOCIO.nombre}. Todos los derechos reservados.
          </p>
          <button
            type="button"
            onClick={() => irA('/panel')}
            className="text-[11px] font-bold uppercase tracking-widest text-ash/60 hover:text-amber"
          >
            Panel del local
          </button>
        </div>
      </div>
    </footer>
  )
}
