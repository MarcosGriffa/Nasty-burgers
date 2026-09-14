import { useEffect, useMemo, useState } from 'react'
import { pesos } from '../lib/utils'
import Foto from './Foto'

/**
 * La ventana donde el cliente arma su hamburguesa antes de agregarla.
 *
 * Aparece solo si el producto tiene grupos de opciones. Los grupos con mínimo 1
 * arrancan con la primera opción ya marcada (las papas normales, por ejemplo):
 * así el que no quiere elegir nada aprieta Agregar y listo, y el que quiere las
 * sazonadas las cambia con un toque. Cero fricción para el caso de siempre.
 */
export default function Opciones({ item, grupos, onAgregar, onCerrar }) {
  const [elegidas, setElegidas] = useState(() => {
    const inicial = {}
    grupos.forEach((g) => {
      inicial[g.nombre] = (g.minimo ?? 0) >= 1 && g.opciones?.[0] ? [g.opciones[0].nombre] : []
    })
    return inicial
  })

  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onCerrar])

  const alternar = (grupo, opcion) => {
    setElegidas((prev) => {
      const actuales = prev[grupo.nombre] ?? []
      const ya = actuales.includes(opcion.nombre)
      const max = grupo.maximo ?? 99

      // De a uno: elegir reemplaza. De a varios: suma hasta el máximo.
      if (max === 1) return { ...prev, [grupo.nombre]: ya && !grupo.minimo ? [] : [opcion.nombre] }
      if (ya) {
        return { ...prev, [grupo.nombre]: actuales.filter((n) => n !== opcion.nombre) }
      }
      if (actuales.length >= max) return prev
      return { ...prev, [grupo.nombre]: [...actuales, opcion.nombre] }
    })
  }

  const seleccion = useMemo(
    () =>
      grupos.flatMap((g) =>
        (elegidas[g.nombre] ?? []).map((nombre) => {
          const o = g.opciones.find((x) => x.nombre === nombre)
          return {
            grupo: g.nombre,
            opcion: nombre,
            precio: Number(o?.precio) || 0,
            // viajan con la opción para que al aceptar el pedido se descuenten
            ...(o?.ingrediente ? { ingrediente: o.ingrediente, cantidad: o.cantidad } : {}),
          }
        }),
      ),
    [grupos, elegidas],
  )

  const extra = seleccion.reduce((a, o) => a + o.precio, 0)
  const falta = grupos.find((g) => (elegidas[g.nombre] ?? []).length < (g.minimo ?? 0))

  return (
    <div className="fixed inset-0 z-60 grid place-items-end bg-ink/80 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="flex max-h-[92svh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-ink-2 sm:rounded-3xl">
        <div className="flex items-start gap-3 border-b border-white/10 p-4">
          <Foto img={item.img} alt={item.nombre} className="h-16 w-16 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <h3 className="display text-xl leading-tight text-paper">
              {item.nombreCorto ?? item.nombre}
            </h3>
            <p className="line-clamp-2 text-xs text-ash">{item.desc}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-paper"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-5">
            {grupos.map((g) => {
              const actuales = elegidas[g.nombre] ?? []
              const unico = (g.maximo ?? 99) === 1
              return (
                <fieldset key={g.nombre}>
                  <legend className="mb-1 flex w-full items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-paper">{g.nombre}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ash">
                      {(g.minimo ?? 0) >= 1 ? 'Elegí uno' : `Hasta ${g.maximo}`}
                    </span>
                  </legend>
                  {g.bajada && <p className="mb-2 text-xs text-ash">{g.bajada}</p>}

                  <div className="space-y-2">
                    {g.opciones.map((o) => {
                      const marcada = actuales.includes(o.nombre)
                      return (
                        <label
                          key={o.nombre}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                            marcada ? 'border-amber bg-amber/10' : 'border-white/15 hover:border-white/30'
                          }`}
                        >
                          <input
                            type={unico ? 'radio' : 'checkbox'}
                            name={g.nombre}
                            checked={marcada}
                            onChange={() => alternar(g, o)}
                            className="h-5 w-5 shrink-0 accent-[#f5b301]"
                          />
                          <span className="min-w-0 flex-1 text-sm text-paper">{o.nombre}</span>
                          {o.precio > 0 && (
                            <span className="shrink-0 text-sm font-bold text-amber">
                              +{pesos(o.precio)}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              )
            })}
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            disabled={!!falta}
            onClick={() => {
              onAgregar(item, seleccion)
              onCerrar()
            }}
            className={`flex w-full items-center justify-between rounded-full px-6 py-4 text-sm font-extrabold uppercase tracking-widest transition-transform ${
              falta ? 'cursor-not-allowed bg-white/10 text-ash' : 'bg-amber text-ink hover:scale-[1.02]'
            }`}
          >
            <span>{falta ? `Elegí ${falta.nombre.toLowerCase()}` : 'Agregar al pedido'}</span>
            <span>{pesos((Number(item.precio) || 0) + extra)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
