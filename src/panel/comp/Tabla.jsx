import { Fragment, useMemo, useState } from 'react'
import { pesos, fechaCorta } from '../../lib/utils'
import { Chip, Vacio } from './ui'

export function valorCelda(fila, col) {
  const bruto = col.calc ? col.calc(fila) : fila[col.k]
  if (bruto === null || bruto === undefined || bruto === '') return '-'
  if (col.tipo === 'moneda') return pesos(bruto)
  if (col.tipo === 'fecha') return fechaCorta(bruto)
  if (col.tipo === 'bool') return bruto ? 'Sí' : 'No'
  return bruto
}

export default function Tabla({
  columnas,
  filas,
  onSeleccionar,
  seleccionadaId,
  agrupar,
  vacio = 'No hay registros.',
}) {
  const [orden, setOrden] = useState(null)

  const ordenadas = useMemo(() => {
    if (!orden) return filas
    const col = columnas.find((c) => c.k === orden.k)
    if (!col) return filas
    const val = (f) => {
      const v = col.calc ? col.calc(f) : f[col.k]
      return typeof v === 'number' ? v : String(v ?? '').toLowerCase()
    }
    return [...filas].sort((a, b) => {
      const x = val(a)
      const y = val(b)
      if (x === y) return 0
      return (x > y ? 1 : -1) * (orden.desc ? -1 : 1)
    })
  }, [filas, orden, columnas])

  const grupos = useMemo(() => {
    if (!agrupar) return [{ nombre: null, filas: ordenadas }]
    const mapa = new Map()
    ordenadas.forEach((f) => {
      const g = f[agrupar] || 'Sin categoría'
      if (!mapa.has(g)) mapa.set(g, [])
      mapa.get(g).push(f)
    })
    return [...mapa.entries()].map(([nombre, filas]) => ({ nombre, filas }))
  }, [ordenadas, agrupar])

  if (!filas.length) return <Vacio>{vacio}</Vacio>

  const alOrdenar = (k) =>
    setOrden((o) => (o?.k === k ? { k, desc: !o.desc } : { k, desc: false }))

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-white/5">
            {columnas.map((c) => (
              <th
                key={c.k}
                style={c.ancho ? { width: c.ancho } : undefined}
                className={`whitespace-nowrap px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                  c.num ? 'text-right' : 'text-left'
                }`}
              >
                <button
                  type="button"
                  onClick={() => alOrdenar(c.k)}
                  className="inline-flex items-center gap-1 hover:text-paper"
                >
                  {c.label}
                  {orden?.k === c.k && <span className="text-amber">{orden.desc ? '↓' : '↑'}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <Fragment key={g.nombre ?? 'todo'}>
              {g.nombre && (
                <tr>
                  <td
                    colSpan={columnas.length}
                    className="bg-white/[0.03] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber"
                  >
                    {g.nombre}
                    <span className="ml-2 text-ash">{g.filas.length}</span>
                  </td>
                </tr>
              )}
              {g.filas.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => onSeleccionar?.(f)}
                  className={`border-t border-white/5 transition-colors ${
                    onSeleccionar ? 'cursor-pointer hover:bg-white/5' : ''
                  } ${seleccionadaId === f.id ? 'bg-amber/10' : ''}`}
                >
                  {columnas.map((c) => (
                    <td
                      key={c.k}
                      className={`px-4 py-2.5 ${c.num ? 'text-right tabular-nums' : ''} ${
                        c.principal ? 'font-bold text-paper' : 'text-ash'
                      }`}
                    >
                      {c.chip && f[c.k] ? <Chip>{f[c.k]}</Chip> : valorCelda(f, c)}
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
