import { useEffect, useState } from 'react'
import { ingresar, salir, sembrarEjemplos, suscribirSesion, vaciarDemo } from '../lib/pedidos'
import { modoDemo } from '../lib/supabase'
import { LOCALES } from '../data/negocio'
import { irA, useRuta } from '../lib/ruta'
import { ICONOS, MODULOS, resolverRuta, rutaDe } from './navegacion'
import { usePedidos } from './usePedidos'
import { Boton } from './comp/ui'

import Crud from './pantallas/Crud'
import { VentasDelivery, VentasMostrador } from './pantallas/Ventas'
import Preguntar from './pantallas/Preguntar'
import {
  Balance,
  CuentasCobrar,
  EstadisticasVentas,
  EstadoResultados,
  FlujoCaja,
  ReporteGastos,
  ReporteProductos,
} from './pantallas/Reportes'
import { Fichas, Inventario, ListaPrecios, Stock } from './pantallas/Inventario'
import { Arqueos } from './pantallas/Caja'
import Clientes from './pantallas/Clientes'
import Asistente from './pantallas/Asistente'
import {
  ConfigIA,
  DeliveryApps,
  OpcionesImpresion,
  TiendaConfig,
  TiendaEnvios,
  TiendaHorarios,
  TiendaInicio,
} from './pantallas/Ajustes'

const PANTALLAS = {
  VentasDelivery,
  VentasMostrador,
  EstadisticasVentas,
  ReporteProductos,
  ReporteGastos,
  Balance,
  EstadoResultados,
  FlujoCaja,
  CuentasCobrar,
  Stock,
  Inventario,
  Fichas,
  ListaPrecios,
  Arqueos,
  Clientes,
  Asistente,
  Preguntar,
  TiendaInicio,
  TiendaHorarios,
  TiendaEnvios,
  TiendaConfig,
  OpcionesImpresion,
  DeliveryApps,
  ConfigIA,
}

// ------------------------------------------------------------------- login
function Login({ onOk }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      await ingresar(email.trim(), pass)
      onOk?.()
    } catch {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setCargando(false)
    }
  }

  const input =
    'w-full rounded-xl border border-white/15 bg-ink-2 px-4 py-3.5 text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber'

  return (
    <div className="grid min-h-svh place-items-center bg-ink px-5">
      <form onSubmit={entrar} className="w-full max-w-sm">
        <p className="display text-4xl text-paper">
          Nasty<span className="text-flame">.</span>
        </p>
        <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber">Sistema del local</p>

        <div className="mt-8 space-y-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" placeholder="Mail del local" className={input} />
          <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" autoComplete="current-password" placeholder="Contraseña" className={input} />
        </div>

        {/* Cada local tiene su cuenta y ve solo sus comandas. */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {LOCALES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setEmail(l.cuenta)}
              className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                email === l.cuenta
                  ? 'border-amber bg-amber/10'
                  : 'border-white/15 hover:border-white/35'
              }`}
            >
              <span className="block text-xs font-bold text-paper">{l.nombre}</span>
              <span className="block truncate text-[10px] text-ash">{l.cuenta}</span>
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-flame">{error}</p>}
        {modoDemo && (
          <p className="mt-3 text-[11px] leading-relaxed text-ash">
            Modo demo: elegí un local y entrá con cualquier contraseña. Cada cuenta
            ve solo las comandas de su local.
          </p>
        )}

        <button type="submit" disabled={cargando} className="mt-5 w-full rounded-full bg-amber px-6 py-4 text-sm font-extrabold uppercase tracking-widest text-ink disabled:opacity-50">
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>

        <button type="button" onClick={() => irA('/')} className="mt-6 block w-full text-center text-xs font-semibold uppercase tracking-widest text-ash hover:text-paper">
          Volver a la web
        </button>
      </form>
    </div>
  )
}

// ------------------------------------------------------------------- barra
function Icono({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function BarraSuperior({ moduloActivo, ctrl, sesion }) {
  const [reloj, setReloj] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setReloj(new Date()), 30000)
    return () => clearInterval(t)
  }, [])

  const pendientes = ctrl.pedidos.filter((p) => p.estado === 'pendiente').length
  const nombreLocal = LOCALES.find((l) => l.id === ctrl.local)?.nombre

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 backdrop-blur">
      <div className="flex items-center gap-1 px-3 py-2 sm:px-4">
        <button type="button" onClick={() => irA('/')} title="Ver la web" className="display mr-2 shrink-0 text-xl text-paper">
          Nasty<span className="text-flame">.</span>
        </button>

        <nav className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto">
          {MODULOS.map((m) => {
            const activo = m.id === moduloActivo.id
            return (
              <button
                key={m.id}
                type="button"
                title={m.titulo}
                onClick={() => irA(rutaDe(m.id, m.secciones[0].id))}
                className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${
                  activo ? 'bg-amber text-ink' : 'text-ash hover:bg-white/5 hover:text-paper'
                }`}
              >
                <Icono d={ICONOS[m.icono]} />
                {m.id === 'ventas' && pendientes > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-flame px-1 text-[9px] font-extrabold text-ink">
                    {pendientes}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="ml-2 flex shrink-0 items-center gap-2">
          {/* De qué local es esta pantalla. Es lo primero que hay que saber. */}
          {nombreLocal && (
            <span className="hidden rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber md:inline-block">
              {nombreLocal}
            </span>
          )}
          <span className="hidden text-right text-[10px] uppercase leading-tight tracking-widest text-ash sm:block">
            {reloj.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })}
            <br />
            <span className="text-sm text-paper">{reloj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          </span>
          {sesion && (
            <Boton onClick={salir} className="hidden sm:inline-flex">
              Salir
            </Boton>
          )}
        </div>
      </div>
    </header>
  )
}

// ------------------------------------------------------------------- shell
export default function Shell() {
  const [sesion, setSesion] = useState(undefined)
  const ruta = useRuta()
  const { modulo, seccion } = resolverRuta(ruta)
  const ctrl = usePedidos()

  useEffect(() => suscribirSesion(setSesion), [])

  // En modo demo, la primera vez se cargan comandas de ejemplo.
  useEffect(() => {
    if (!modoDemo) return
    try {
      if (localStorage.getItem('nasty.sembrado')) return
      localStorage.setItem('nasty.sembrado', '1')
    } catch {
      /* sin storage: sembramos igual */
    }
    sembrarEjemplos({ soloSiVacio: true })
  }, [])

  if (sesion === undefined) return <div className="grid min-h-svh place-items-center bg-ink text-ash">Cargando…</div>
  if (!sesion) return <Login onOk={() => setSesion({})} />

  const Pantalla = seccion.pantalla ? PANTALLAS[seccion.pantalla] : null
  const lateral = modulo.tipo === 'lateral'

  return (
    <div className="min-h-svh bg-ink">
      <BarraSuperior moduloActivo={modulo} ctrl={ctrl} sesion={sesion} />

      {modoDemo && (
        <div className="flex flex-wrap items-center justify-center gap-3 bg-flame/15 px-4 py-2 text-center text-xs text-flame">
          <span>
            <strong>Modo demo</strong> — los datos viven en este navegador. Con las claves de Supabase en{' '}
            <code className="rounded bg-white/10 px-1">.env</code> pasa a funcionar en vivo.
          </span>
          <span className="flex gap-2">
            <button type="button" onClick={() => sembrarEjemplos()} className="underline hover:text-paper">
              + comandas
            </button>
            <button type="button" onClick={vaciarDemo} className="underline hover:text-paper">
              vaciar
            </button>
          </span>
        </div>
      )}

      {/* sub-navegación */}
      {!lateral && (
        <nav className="no-scrollbar sticky top-[52px] z-30 flex gap-1 overflow-x-auto border-b border-white/10 bg-ink-2 px-3 sm:px-4">
          {modulo.secciones.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => irA(rutaDe(modulo.id, s.id))}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${
                s.id === seccion.id
                  ? 'border-amber text-amber'
                  : 'border-transparent text-ash hover:text-paper'
              }`}
            >
              {s.titulo}
            </button>
          ))}
        </nav>
      )}

      {lateral && (
        <nav className="no-scrollbar sticky top-[52px] z-30 flex gap-1 overflow-x-auto border-b border-white/10 bg-ink-2 px-3 lg:hidden">
          {modulo.secciones.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => irA(rutaDe(modulo.id, s.id))}
              className={`shrink-0 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-widest ${
                s.id === seccion.id ? 'border-amber text-amber' : 'border-transparent text-ash'
              }`}
            >
              {s.titulo}
            </button>
          ))}
        </nav>
      )}

      <div className={lateral ? 'flex' : ''}>
        {lateral && (
          <aside className="sticky top-[52px] hidden h-[calc(100svh-52px)] w-56 shrink-0 overflow-y-auto border-r border-white/10 bg-ink-2 py-4 lg:block">
            <p className="px-5 pb-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-ash">{modulo.titulo}</p>
            {modulo.secciones.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => irA(rutaDe(modulo.id, s.id))}
                className={`block w-full px-5 py-2.5 text-left text-sm transition-colors ${
                  s.id === seccion.id ? 'bg-amber/15 font-bold text-amber' : 'text-ash hover:bg-white/5 hover:text-paper'
                }`}
              >
                {s.titulo}
              </button>
            ))}
          </aside>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {Pantalla ? <Pantalla ctrl={ctrl} /> : <Crud coleccion={seccion.crud} />}
        </main>
      </div>
    </div>
  )
}
