import { useEffect } from 'react'
import { pesos } from '../../lib/utils'

// --------------------------------------------------------------------- botones
export function Boton({ variante = 'ghost', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest transition-colors disabled:opacity-40'
  const estilos = {
    primario: 'bg-amber text-ink hover:bg-amber-deep',
    peligro: 'bg-flame text-ink hover:brightness-110',
    ok: 'bg-[#25D366] text-ink hover:brightness-110',
    ghost: 'border border-white/15 text-ash hover:border-white/35 hover:text-paper',
  }
  return <button type="button" className={`${base} ${estilos[variante]} ${className}`} {...props} />
}

// ----------------------------------------------------------------------- chips
const TONOS = {
  ok: 'bg-[#25D366]/15 text-[#3ee07f] border-[#25D366]/30',
  alerta: 'bg-flame/15 text-flame border-flame/30',
  aviso: 'bg-amber/15 text-amber border-amber/30',
  neutro: 'bg-white/5 text-ash border-white/15',
}

const TONO_POR_VALOR = {
  Publicado: 'ok',
  Activo: 'ok',
  Pagado: 'ok',
  Ingreso: 'ok',
  Cerrada: 'ok',
  Entregado: 'ok',
  Borrador: 'neutro',
  'A pagar': 'aviso',
  Pendiente: 'alerta',
  Egreso: 'alerta',
  Rechazado: 'neutro',
}

export function Chip({ children, tono }) {
  const t = tono ?? TONO_POR_VALOR[children] ?? 'neutro'
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${TONOS[t]}`}>
      {children}
    </span>
  )
}

// ------------------------------------------------------------------------- kpi
export function Kpi({ label, valor, detalle, tono }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-2 px-5 py-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ash">{label}</p>
      <p className={`display mt-1 text-3xl ${tono === 'amber' ? 'text-amber' : tono === 'flame' ? 'text-flame' : 'text-paper'}`}>
        {valor}
      </p>
      {detalle && <p className="mt-1 text-xs text-ash">{detalle}</p>}
    </div>
  )
}

export function FilaKpis({ children, cols = 4 }) {
  const clase = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5' }[cols]
  return <div className={`mb-6 grid gap-3 ${clase}`}>{children}</div>
}

// ----------------------------------------------------------------------- modal
export function Modal({ titulo, bajada, onCerrar, children, ancho = 'max-w-lg' }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onCerrar?.()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onCerrar])

  return (
    <div className="fixed inset-0 z-60 grid place-items-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className={`w-full ${ancho} max-h-[92svh] overflow-y-auto rounded-3xl border border-white/10 bg-ink-2 p-6`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="display text-2xl text-paper">{titulo}</h3>
            {bajada && <p className="mt-1 text-xs text-ash">{bajada}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/15 text-paper"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------------- campo
const claseInput =
  'w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber'

export function Campo({ campo, valor, onChange }) {
  const opciones = typeof campo.opciones === 'function' ? campo.opciones() : campo.opciones

  if (campo.tipo === 'bool') {
    return (
      <label className="flex cursor-pointer items-center gap-3 py-2">
        <input
          type="checkbox"
          checked={!!valor}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-[#F5B301]"
        />
        <span className="text-sm text-paper">{campo.label}</span>
      </label>
    )
  }

  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ash">
        {campo.label}
        {campo.requerido && <span className="text-flame"> *</span>}
      </span>
      {campo.tipo === 'select' ? (
        <select value={valor ?? ''} onChange={(e) => onChange(e.target.value)} className={claseInput}>
          <option value="">—</option>
          {opciones?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : campo.tipo === 'area' ? (
        <textarea rows={3} value={valor ?? ''} onChange={(e) => onChange(e.target.value)} className={`${claseInput} resize-none`} />
      ) : campo.tipo === 'fecha' ? (
        <input
          type="date"
          value={valor ? String(valor).slice(0, 10) : ''}
          onChange={(e) => onChange(e.target.value ? new Date(`${e.target.value}T20:00:00`).toISOString() : '')}
          className={claseInput}
        />
      ) : campo.tipo === 'numero' || campo.tipo === 'moneda' ? (
        <input
          type="number"
          step={campo.tipo === 'moneda' ? '1' : 'any'}
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className={claseInput}
        />
      ) : (
        <input type="text" value={valor ?? ''} onChange={(e) => onChange(e.target.value)} className={claseInput} />
      )}
    </label>
  )
}

// -------------------------------------------------------------------- buscador
export function Buscador({ valor, onChange, placeholder = 'Buscar…' }) {
  return (
    <label className="relative flex min-w-[220px] flex-1 items-center">
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 h-4 w-4 text-ash" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{placeholder}</span>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-white/15 bg-ink-2 py-2.5 pl-11 pr-4 text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber"
      />
    </label>
  )
}

// ------------------------------------------------------------------- encabezado
export function Encabezado({ titulo, bajada, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-3xl text-paper sm:text-4xl">{titulo}</h1>
        {bajada && <p className="mt-1 text-sm text-ash">{bajada}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Vacio({ children }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-ash">
      {children}
    </p>
  )
}

export function Tarjeta({ titulo, extra, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-ink-2 p-5 ${className}`}>
      {(titulo || extra) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-lg text-paper">{titulo}</h2>
          {extra}
        </div>
      )}
      {children}
    </section>
  )
}

export const dinero = pesos
