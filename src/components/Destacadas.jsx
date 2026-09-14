import { useMenuPublico } from '../lib/menu'
import { pesos } from '../lib/utils'
import Foto from './Foto'

export default function Destacadas() {
  const { todos } = useMenuPublico()
  const destacadas = todos.filter((i) => i.destacado).slice(0, 4)
  // con un número impar de destacadas la última ocupa el ancho completo, así no
  // queda un hueco al lado
  const ultimaAncha = destacadas.length % 2 === 1 && destacadas.length > 1

  if (!destacadas.length) return null

  return (
    <section className="bg-paper py-16 text-ink sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        {/* el titulo se queda quieto mientras pasan las cards */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div data-reveal>
            <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.25em] text-flame">
              Las favoritas
            </p>
            <h2 className="display text-[clamp(2.8rem,7vw,5.5rem)]">
              Las que más
              <br />
              <span className="text-flame">salen</span>
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink/70">
              Las que nunca fallan. El menú completo, con todas las variantes
              simple, doble y triple, está más abajo.
            </p>
            <a
              href="#menu"
              className="mt-7 inline-block rounded-full border-2 border-ink px-6 py-3 text-xs font-extrabold uppercase tracking-widest transition-colors hover:bg-ink hover:text-amber"
            >
              Ver todo el menú
            </a>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {destacadas.map((item, i) => {
            const ancha = ultimaAncha && i === destacadas.length - 1
            return (
            <article
              key={item.id}
              data-reveal="escala"
              style={{ '--d': `${i * 90}ms` }}
              className={`group overflow-hidden rounded-3xl bg-ink text-paper transition-transform duration-300 hover:-translate-y-2 ${
                ancha ? 'sm:col-span-2 sm:flex sm:items-center' : ''
              }`}
            >
              <Foto
                img={item.img}
                alt={item.nombre}
                // las fotos son cuadradas: al recortarlas se saca de abajo
                // (la mesa) y no de arriba, para no cortar el pan
                className={`aspect-4/3 w-full object-[50%_32%] transition-transform duration-700 group-hover:scale-105 ${
                  ancha ? 'sm:aspect-square sm:w-1/2 sm:shrink-0' : ''
                }`}
              />
              <div className={`p-5 ${ancha ? 'sm:p-8' : ''}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className={`display ${ancha ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}>
                    {item.nombre}
                  </h3>
                  <span className={`display text-amber ${ancha ? 'text-2xl' : 'text-xl'}`}>
                    {pesos(item.precio)}
                  </span>
                </div>
                <p
                  className={`mt-2 leading-relaxed text-ash ${
                    ancha ? 'text-sm sm:mt-4' : 'line-clamp-2 text-xs'
                  }`}
                >
                  {item.desc}
                </p>
              </div>
            </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
