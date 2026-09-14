import { useMemo, useState } from 'react'
import { useMenuPublico } from '../lib/menu'
import { normalizar, pesos } from '../lib/utils'
import Carrito from './Carrito'
import Foto from './Foto'

function ItemCard({ item, cantidad, onAgregar, onQuitar, indice = 0 }) {
  return (
    <article
      data-reveal
      style={{ '--d': `${Math.min(indice, 5) * 60}ms` }}
      className="group flex gap-4 rounded-2xl border border-white/10 bg-ink-2 p-3 transition-colors hover:border-amber/50"
    >
      <Foto
        img={item.img}
        alt={item.nombre}
        className="h-24 w-24 shrink-0 rounded-xl sm:h-28 sm:w-28"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="display text-lg text-paper">{item.nombreCorto ?? item.nombre}</h4>
          {item.promo && (
            <span className="shrink-0 rounded-full bg-flame px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink">
              Promo
            </span>
          )}
          {!item.promo && item.destacado && (
            <span className="shrink-0 rounded-full bg-amber px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink">
              Top
            </span>
          )}
        </div>
        {item.desc && (
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ash">{item.desc}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="display text-lg text-amber">{pesos(item.precio)}</span>
          {cantidad === 0 ? (
            <button
              type="button"
              onClick={() => onAgregar(item)}
              className="rounded-full bg-amber px-5 py-2 text-xs font-extrabold uppercase tracking-widest text-ink transition-transform hover:scale-105"
            >
              Agregar
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-full bg-amber px-2 py-1.5 text-ink">
              <button
                type="button"
                onClick={() => onQuitar(item.id)}
                aria-label={`Quitar uno de ${item.nombre}`}
                className="h-6 w-6 rounded-full font-bold hover:bg-ink/10"
              >
                −
              </button>
              <span className="w-4 text-center text-sm font-extrabold">{cantidad}</span>
              <button
                type="button"
                onClick={() => onAgregar(item)}
                aria-label={`Agregar uno de ${item.nombre}`}
                className="h-6 w-6 rounded-full font-bold hover:bg-ink/10"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Pedido({ carrito, drawerAbierto, setDrawerAbierto }) {
  const [modalidad, setModalidad] = useState('delivery')
  // arranca sin elegir: el cliente lo decide en el carrito, antes de confirmar
  const [localId, setLocalId] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  // La carta sale de la misma tabla de productos que edita el panel: lo que el
  // empleado agrega o cambia allá, aparece acá.
  const { secciones } = useMenuPublico()

  const categorias = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return secciones
    return secciones
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) => normalizar(i.nombre).includes(q) || normalizar(i.desc || '').includes(q),
        ),
      }))
      .filter((c) => c.items.length > 0)
  }, [busqueda, secciones])

  return (
    <section id="menu" className="relative bg-ink py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div data-reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.25em] text-flame">
              Hacé tu pedido
            </p>
            <h2 className="display text-[clamp(2.5rem,7vw,5rem)] text-paper">El menú</h2>
          </div>
          <p className="max-w-xs text-sm text-ash">
            Elegís, confirmás y listo. El pedido le llega directo al local y te
            escriben por WhatsApp. Sin apps, sin registro.
          </p>
        </div>

        {/* controles tipo Fudo */}
        <div className="mb-6 grid gap-3 sm:grid-cols-[auto_1fr]">
          <div className="inline-flex rounded-full border border-white/15 p-1">
            {[
              { id: 'delivery', label: 'Delivery' },
              { id: 'retiro', label: 'Para retirar' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModalidad(m.id)}
                className={`rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-widest transition-colors ${
                  modalidad === m.id ? 'bg-amber text-ink' : 'text-ash hover:text-paper'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <label className="relative flex items-center">
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-4 h-4 w-4 text-ash"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Buscar productos</span>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por producto…"
              className="w-full rounded-full border border-white/15 bg-ink-2 py-3 pl-11 pr-4 text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber"
            />
          </label>
        </div>

        {/* chips de categoria */}
        <div className="no-scrollbar sticky top-16 z-30 -mx-5 mb-8 overflow-x-auto bg-ink/95 px-5 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="flex gap-2">
            {secciones.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-ash transition-colors hover:border-amber hover:text-amber"
              >
                {c.nombre}
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-12">
            {categorias.length === 0 && (
              <p className="py-16 text-center text-ash">
                No encontramos nada con “{busqueda}”.
              </p>
            )}
            {categorias.map((c) => (
              <div key={c.id} id={`cat-${c.id}`} className="scroll-mt-40">
                <div
                  data-reveal="izq"
                  className="mb-4 flex items-baseline gap-3 border-b border-white/10 pb-3"
                >
                  <h3 className="display text-2xl text-paper sm:text-3xl">{c.nombre}</h3>
                  {c.bajada && <p className="text-xs text-ash">{c.bajada}</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {c.items.map((item, i) => (
                    <ItemCard
                      key={item.id}
                      indice={i}
                      item={item}
                      cantidad={carrito.cantidadDe(item.id)}
                      onAgregar={carrito.agregar}
                      onQuitar={carrito.quitar}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* carrito fijo en desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100svh-8rem)]">
              <Carrito carrito={carrito} modalidad={modalidad} localId={localId} onLocal={setLocalId} />
            </div>
          </aside>
        </div>
      </div>

      {/* barra inferior en mobile */}
      {carrito.unidades > 0 && !drawerAbierto && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 p-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerAbierto(true)}
            className="flex w-full items-center justify-between rounded-full bg-amber px-6 py-4 text-ink"
          >
            <span className="text-sm font-extrabold uppercase tracking-widest">
              Ver pedido ({carrito.unidades})
            </span>
            <span className="display text-lg">{pesos(carrito.subtotal)}</span>
          </button>
        </div>
      )}

      {/* drawer del carrito en mobile */}
      {drawerAbierto && (
        <div className="fixed inset-0 z-50 bg-ink/80 p-3 backdrop-blur-sm lg:hidden">
          <div className="mx-auto h-full max-w-md">
            <Carrito
              carrito={carrito}
              modalidad={modalidad}
              localId={localId}
              onLocal={setLocalId}
              onCerrar={() => setDrawerAbierto(false)}
            />
          </div>
        </div>
      )}
    </section>
  )
}
