import { useState } from 'react'
import { numeroCorto, pesos } from '../../lib/utils'

// Paleta validada contra el fondo del panel (#161513) con el validador de
// paletas: banda de luminosidad, croma, separación para daltonismo, piso de
// visión normal y contraste — las seis pasan.
export const SERIE = {
  a: '#BC8600', // ventas / ingresos
  b: '#3E93C4', // egresos / comparativo
}
const EJE = 'rgba(255,255,255,0.10)'

/** Redondea el tope del eje a un número legible (1, 2, 2.5 o 5 × 10^n). */
function techoLindo(n) {
  if (n <= 0) return 1
  const exp = Math.floor(Math.log10(n))
  const base = 10 ** exp
  const r = n / base
  const paso = r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10
  return paso * base
}
const TINTA = '#A3A099'

function Tooltip({ x, y, children }) {
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-white/15 bg-ink px-3 py-2 text-xs whitespace-nowrap text-paper shadow-lg"
      style={{ left: x, top: y - 8 }}
    >
      {children}
    </div>
  )
}

export function Leyenda({ series }) {
  return (
    <div className="mt-3 flex flex-wrap gap-4">
      {series.map((s) => (
        <span key={s.label} className="flex items-center gap-2 text-xs text-ash">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

/**
 * Barras verticales. `datos` = [{ label, a, b? }].
 * Con dos series se dibujan agrupadas, con 2px de aire entre barras.
 */
export function Barras({ datos, series = [{ k: 'a', label: 'Ventas', color: SERIE.a }], alto = 240, formato = pesos }) {
  const [sobre, setSobre] = useState(null)
  if (!datos.length) return <p className="py-10 text-center text-sm text-ash">Sin datos en este período.</p>

  const crudo = Math.max(1, ...datos.flatMap((d) => series.map((s) => d[s.k] || 0)))
  const max = techoLindo(crudo)
  const lineas = [0, 0.25, 0.5, 0.75, 1]
  // el ancho es relativo al grupo (cada grupo ya ocupa 1/n del gráfico)
  const anchoBarra = 64 / series.length

  return (
    <div className="relative">
      <div className="flex">
        {/* eje Y */}
        <div className="flex flex-col justify-between pr-2 text-right" style={{ height: alto }}>
          {[...lineas].reverse().map((l) => (
            <span key={l} className="text-[10px] tabular-nums" style={{ color: TINTA }}>
              {numeroCorto(max * l)}
            </span>
          ))}
        </div>

        <div className="relative flex-1" style={{ height: alto }}>
          {lineas.map((l) => (
            <div
              key={l}
              className="absolute inset-x-0 border-t"
              style={{ bottom: `${l * 100}%`, borderColor: EJE }}
            />
          ))}

          <div className="absolute inset-0 flex items-end">
            {datos.map((d, i) => (
              <div key={d.label + i} className="flex h-full flex-1 items-end justify-center gap-[2px]">
                {series.map((s) => (
                  <div
                    key={s.k}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.closest('.relative').getBoundingClientRect()
                      const b = e.currentTarget.getBoundingClientRect()
                      setSobre({ x: b.left - r.left + b.width / 2, y: b.top - r.top, d, s })
                    }}
                    onMouseLeave={() => setSobre(null)}
                    className="rounded-t-[4px] transition-opacity hover:opacity-80"
                    style={{
                      width: `${anchoBarra}%`,
                      minWidth: 8,
                      height: `${((d[s.k] || 0) / max) * 100}%`,
                      background: s.color,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {sobre && (
            <Tooltip x={sobre.x} y={sobre.y}>
              <span className="font-bold">{sobre.d.label}</span>
              <br />
              {series.length > 1 && `${sobre.s.label}: `}
              {formato(sobre.d[sobre.s.k] || 0)}
            </Tooltip>
          )}
        </div>
      </div>

      {/* eje X */}
      <div className="mt-2 flex pl-[38px]">
        {datos.map((d, i) => (
          <span
            key={d.label + i}
            className="flex-1 truncate text-center text-[10px]"
            style={{ color: TINTA }}
          >
            {d.label}
          </span>
        ))}
      </div>

      {series.length > 1 && <Leyenda series={series} />}
    </div>
  )
}

/** Barras horizontales rankeadas, con el valor escrito al lado. */
export function BarrasH({ datos, formato = pesos, color = SERIE.a, max: maxProp }) {
  if (!datos.length) return <p className="py-10 text-center text-sm text-ash">Sin datos en este período.</p>
  const max = maxProp ?? Math.max(1, ...datos.map((d) => d.valor))

  return (
    <div className="space-y-2.5">
      {datos.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(90px,150px)_1fr_auto] items-center gap-3">
          <span className="truncate text-xs text-ash" title={d.label}>
            {d.label}
          </span>
          <div className="h-3.5 overflow-hidden rounded-[4px] bg-white/5">
            <div
              className="h-full rounded-[4px]"
              style={{ width: `${Math.max(2, (d.valor / max) * 100)}%`, background: color }}
            />
          </div>
          <span className="w-24 text-right text-xs tabular-nums text-paper">{formato(d.valor)}</span>
        </div>
      ))}
    </div>
  )
}

/** Toggle Gráfico / Tabla: la vista de datos siempre disponible. */
export function ConTabla({ datos, series, formato = pesos, children }) {
  const [vista, setVista] = useState('grafico')
  return (
    <>
      <div className="mb-3 flex justify-end gap-1">
        {['grafico', 'tabla'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest transition-colors ${
              vista === v ? 'bg-amber text-ink' : 'text-ash hover:text-paper'
            }`}
          >
            {v === 'grafico' ? 'Gráfico' : 'Tabla'}
          </button>
        ))}
      </div>
      {vista === 'grafico' ? (
        children
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ink-2">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest text-ash">
                  Período
                </th>
                {series.map((s) => (
                  <th
                    key={s.k}
                    className="px-3 py-2 text-right text-[10px] font-extrabold uppercase tracking-widest text-ash"
                  >
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((d, i) => (
                <tr key={d.label + i} className="border-t border-white/5">
                  <td className="px-3 py-2 text-ash">{d.label}</td>
                  {series.map((s) => (
                    <td key={s.k} className="px-3 py-2 text-right tabular-nums text-paper">
                      {formato(d[s.k] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
