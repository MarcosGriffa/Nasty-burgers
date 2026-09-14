import { useMemo, useState } from 'react'
import { LOCALES, NEGOCIO } from '../../data/negocio'
import { useMenuPublico } from '../../lib/menu'
import { crearPedido, ESTADOS } from '../../lib/pedidos'
import { hora, minutosDesde, pesos } from '../../lib/utils'
import { imprimirComandaCocina, imprimirTicket } from '../../lib/imprimir'
import Comanda from '../Comanda'
import ModalAceptar from '../ModalAceptar'
import { Boton, Encabezado, Modal } from '../comp/ui'

const esDeHoy = (p) => new Date(p.creado_en).toDateString() === new Date().toDateString()

// ------------------------------------------------------------- nuevo pedido
function NuevoPedido({ modalidad, onCerrar }) {
  const [items, setItems] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [pago, setPago] = useState('efectivo')
  const [local, setLocal] = useState(LOCALES[0].id)

  // El mostrador vende del mismo catálogo que la web.
  const { todos } = useMenuPublico()
  const catalogo = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const base = todos.map((i) => ({ ...i, etiqueta: i.nombre }))
    return q ? base.filter((i) => i.etiqueta.toLowerCase().includes(q)) : base.slice(0, 14)
  }, [busqueda, todos])

  const agregar = (i) =>
    setItems((prev) => {
      const ya = prev.find((x) => x.id === i.id)
      if (ya) return prev.map((x) => (x.id === i.id ? { ...x, cantidad: x.cantidad + 1 } : x))
      return [
        ...prev,
        { id: i.id, nombre: i.etiqueta, cantidad: 1, precio: i.precio, categoriaId: i.categoriaId },
      ]
    })

  const subtotal = items.reduce((a, i) => a + i.precio * i.cantidad, 0)
  const descuento = pago === 'efectivo' ? Math.round(subtotal * NEGOCIO.promoEfectivo) : 0
  const listo = items.length > 0 && nombre.trim().length > 1

  const guardar = async () => {
    await crearPedido({
      modalidad,
      local,
      cliente_nombre: nombre.trim(),
      cliente_telefono: telefono.trim(),
      cliente_email: null,
      direccion: modalidad === 'delivery' ? direccion.trim() : null,
      nota: null,
      items,
      subtotal,
      descuento,
      total: subtotal - descuento,
      pago,
      origen: 'Mostrador',
    })
    onCerrar()
  }

  const input =
    'w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber'

  return (
    <Modal
      titulo="Nuevo pedido"
      bajada={modalidad === 'delivery' ? 'Se carga en Delivery' : 'Se carga en Mostrador'}
      onCerrar={onCerrar}
      ancho="max-w-3xl"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto…"
            className={input}
          />
          <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
            {catalogo.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => agregar(i)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-left text-sm hover:border-amber"
              >
                <span className="truncate text-paper">{i.etiqueta}</span>
                <span className="shrink-0 text-amber">{pesos(i.precio)}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="min-h-24 rounded-xl border border-white/10 p-3">
            {items.length === 0 ? (
              <p className="py-6 text-center text-xs text-ash">Elegí productos de la izquierda.</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-paper">
                      <span className="display mr-2 text-amber">{i.cantidad}×</span>
                      {i.nombre}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setItems((p) =>
                          p
                            .map((x) => (x.id === i.id ? { ...x, cantidad: x.cantidad - 1 } : x))
                            .filter((x) => x.cantidad > 0),
                        )
                      }
                      className="shrink-0 text-ash hover:text-flame"
                      aria-label={`Quitar ${i.nombre}`}
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 space-y-2">
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Cliente" className={input} />
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className={input} />
            {modalidad === 'delivery' && (
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección" className={input} />
            )}
            <div className="grid grid-cols-2 gap-2">
              <select value={pago} onChange={(e) => setPago(e.target.value)} className={input}>
                <option value="efectivo">Efectivo</option>
                <option value="mercadopago">Mercado Pago</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
              <select value={local} onChange={(e) => setLocal(e.target.value)} className={input}>
                {LOCALES.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-widest text-ash">
              Total {descuento > 0 && <span className="text-amber">(−10% efectivo)</span>}
            </span>
            <span className="display text-2xl text-amber">{pesos(subtotal - descuento)}</span>
          </div>

          <Boton variante="primario" disabled={!listo} onClick={guardar} className="mt-3 w-full py-3.5">
            Cargar pedido
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

// ------------------------------------------------------------------ comunes
// El tablero ya muestra cuántas comandas hay en cada estado, así que acá no
// se repite: solo el resumen del día en una línea.
function Cabecera({ titulo, pedidos, ctrl, onNuevo, children }) {
  const facturado = pedidos
    .filter((p) => p.estado === 'entregado')
    .reduce((a, p) => a + (p.total || 0), 0)

  return (
    <Encabezado
      titulo={titulo}
      bajada={`${pedidos.length} ${pedidos.length === 1 ? 'pedido' : 'pedidos'} hoy · ${pesos(facturado)} entregado`}
    >
      {children}
      <Boton onClick={() => ctrl.setSonido(!ctrl.sonido)}>
        {ctrl.sonido ? 'Sonido on' : 'Sonido off'}
      </Boton>
      <Boton variante="primario" onClick={onNuevo}>
        + Nuevo pedido
      </Boton>
    </Encabezado>
  )
}

// ---------------------------------------------------------------- TABLERO
//
// Un tablero por estado, tipo kanban. La idea es que con muchas comandas no
// haya que leer tablas: cada comanda es una ficha con lo mínimo (número,
// cliente, plata, cuánto hace que espera) y UN solo botón, el que corresponde
// a su estado. El resto del detalle está a un clic, en el panel de la derecha.

const PUNTO = {
  pendiente: 'bg-flame',
  preparando: 'bg-amber',
  listo: 'bg-amber',
  en_envio: 'bg-ash',
}

/** Ficha de comanda. Sin bordes de colores por todos lados: solo una barrita. */
function Ficha({ pedido, onAbrir, onAccion, accion, principal }) {
  const min = minutosDesde(pedido.creado_en)
  const tarde = min > (pedido.demora_min ?? 40)

  return (
    <article
      onClick={() => onAbrir(pedido.id)}
      className="cursor-pointer rounded-xl border border-white/10 bg-ink-2 p-3 transition-colors hover:border-white/25"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="display text-lg leading-none text-paper">#{pedido.numero}</span>
        <span className={`text-xs tabular-nums ${tarde ? 'font-bold text-flame' : 'text-ash'}`}>
          {min}′
        </span>
      </div>

      <p className="mt-1.5 truncate text-sm text-paper">{pedido.cliente_nombre}</p>
      <p className="truncate text-xs text-ash">
        {pedido.modalidad === 'delivery' ? pedido.direccion || 'Sin dirección' : 'Retira en el local'}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold tabular-nums text-amber">{pesos(pedido.total)}</span>
        {pedido.pago === 'efectivo' && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-ash">Efectivo</span>
        )}
      </div>

      {accion && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAccion(pedido)
          }}
          className={`mt-2.5 w-full rounded-lg px-3 py-2 text-xs font-extrabold uppercase tracking-widest transition-colors ${
            principal
              ? 'bg-amber text-ink hover:bg-amber-deep'
              : 'border border-white/15 text-ash hover:border-white/35 hover:text-paper'
          }`}
        >
          {accion}
        </button>
      )}
    </article>
  )
}

/**
 * Un carril del tablero: un estado, con sus comandas de izquierda a derecha.
 * Los carriles van uno abajo del otro, así aceptar una comanda la hace bajar
 * al carril siguiente, que es como se lee el flujo de la cocina.
 */
function Carril({ titulo, pedidos, tono, accion, destacarPrimera, onAccion, onAbrir }) {
  return (
    <section>
      <header className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${tono}`} aria-hidden="true" />
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-ash">{titulo}</h3>
        <span className="text-[11px] font-bold tabular-nums text-ash">{pedidos.length}</span>
        <span className="ml-1 h-px flex-1 bg-white/8" aria-hidden="true" />
      </header>

      {pedidos.length === 0 ? (
        <p className="pb-1 pl-4 text-[11px] text-ash/40">Vacío</p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {pedidos.map((p, i) => (
            <Ficha
              key={p.id}
              pedido={p}
              onAbrir={onAbrir}
              onAccion={onAccion}
              accion={accion}
              // solo la más vieja lleva el botón lleno: es la que hay que
              // atender primero, y así no hay diez botones amarillos gritando
              principal={destacarPrimera && i === 0}
            />
          ))}
        </div>
      )}
    </section>
  )
}

/** Lo cerrado del día: no necesita acción, así que va chico y apagado. */
function Cerradas({ pedidos, onAbrir }) {
  const [abierta, setAbierta] = useState(false)
  if (!pedidos.length) return null

  return (
    <section className="border-t border-white/10 pt-4">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        className="flex w-full items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-ash hover:text-paper"
      >
        <span>Cerradas hoy ({pedidos.length})</span>
        <span className="text-[10px]">{abierta ? '▲' : '▼'}</span>
      </button>

      {abierta && (
        <ul className="mt-3 divide-y divide-white/5">
          {pedidos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onAbrir(p.id)}
                className="flex w-full items-center gap-3 px-1 py-2 text-left text-xs hover:bg-white/5"
              >
                <span className="w-12 shrink-0 font-bold text-ash">#{p.numero}</span>
                <span className="w-14 shrink-0 text-ash">{hora(p.creado_en)}</span>
                <span className="min-w-0 flex-1 truncate text-paper">{p.cliente_nombre}</span>
                <span className="shrink-0 text-ash">{ESTADOS[p.estado].label}</span>
                <span className="w-20 shrink-0 text-right tabular-nums text-ash">
                  {pesos(p.total)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** El detalle completo, en una ventana. Así los carriles usan todo el ancho. */
function DetalleModal({ pedido, ctrl, onAceptar, onCerrar }) {
  if (!pedido) return null
  return (
    <Modal
      titulo={`Comanda #${pedido.numero}`}
      bajada={`${pedido.modalidad === 'delivery' ? 'Delivery' : 'Para retirar'} · ${hora(pedido.creado_en)}`}
      onCerrar={onCerrar}
      ancho="max-w-md"
    >
      <div className="space-y-3">
        <Comanda
          pedido={pedido}
          onAceptar={(p) => {
            onCerrar()
            onAceptar(p)
          }}
          onRechazar={ctrl.rechazar}
          onAvanzar={ctrl.avanzar}
          onCobrar={ctrl.cobrar}
        />
        <div className="flex gap-2">
          <Boton className="flex-1 py-3" onClick={() => imprimirComandaCocina(pedido)}>
            Imprimir comanda
          </Boton>
          <Boton className="flex-1 py-3" onClick={() => imprimirTicket(pedido)}>
            Imprimir ticket
          </Boton>
        </div>
      </div>
    </Modal>
  )
}

/** El tablero completo. */
function Tablero({ ctrl, carriles, pedidos, selId, setSelId, onAceptar }) {
  const sel = ctrl.pedidos.find((p) => p.id === selId)
  const cerradas = pedidos.filter((p) => p.estado === 'entregado' || p.estado === 'rechazado')

  // En la cocina se atiende por orden de llegada: la más vieja primero.
  const porEstado = (estado) =>
    pedidos
      .filter((p) => p.estado === estado)
      .sort((a, b) => new Date(a.creado_en) - new Date(b.creado_en))

  return (
    <>
      <div className="space-y-6">
        {carriles.map((c) => (
          <Carril
            key={c.estado}
            titulo={c.titulo}
            tono={PUNTO[c.estado]}
            pedidos={porEstado(c.estado)}
            accion={c.accion}
            destacarPrimera={c.estado === 'pendiente'}
            onAccion={c.estado === 'pendiente' ? onAceptar : ctrl.avanzar}
            onAbrir={setSelId}
          />
        ))}

        <Cerradas pedidos={cerradas} onAbrir={setSelId} />
      </div>

      <DetalleModal
        pedido={sel}
        ctrl={ctrl}
        onAceptar={onAceptar}
        onCerrar={() => setSelId(null)}
      />
    </>
  )
}

// ---------------------------------------------------------------- DELIVERY
export function VentasDelivery({ ctrl }) {
  const [selId, setSelId] = useState(null)
  const [aceptando, setAceptando] = useState(null)
  const [nuevo, setNuevo] = useState(false)

  const delHoy = ctrl.pedidos.filter((p) => p.modalidad === 'delivery' && esDeHoy(p))

  return (
    <>
      <Cabecera titulo="Delivery" pedidos={delHoy} ctrl={ctrl} onNuevo={() => setNuevo(true)} />

      <Tablero
        ctrl={ctrl}
        pedidos={delHoy}
        selId={selId}
        setSelId={setSelId}
        onAceptar={setAceptando}
        carriles={[
          { estado: 'pendiente', titulo: 'Sin aceptar', accion: 'Aceptar' },
          { estado: 'preparando', titulo: 'En la cocina', accion: 'Listo' },
          { estado: 'listo', titulo: 'Para salir', accion: 'Salió' },
          { estado: 'en_envio', titulo: 'En camino', accion: 'Entregado' },
        ]}
      />

      {aceptando && (
        <ModalAceptar
          pedido={aceptando}
          onCancelar={() => setAceptando(null)}
          onAceptar={(min, avisar) => {
            ctrl.aceptar(aceptando, min, avisar)
            setAceptando(null)
          }}
        />
      )}
      {nuevo && <NuevoPedido modalidad="delivery" onCerrar={() => setNuevo(false)} />}
    </>
  )
}

// --------------------------------------------------------------- MOSTRADOR
export function VentasMostrador({ ctrl }) {
  const [selId, setSelId] = useState(null)
  const [aceptando, setAceptando] = useState(null)
  const [nuevo, setNuevo] = useState(false)

  const hoy = ctrl.pedidos.filter((p) => p.modalidad !== 'delivery' && esDeHoy(p))

  return (
    <>
      <Cabecera titulo="Mostrador" pedidos={hoy} ctrl={ctrl} onNuevo={() => setNuevo(true)} />

      <Tablero
        ctrl={ctrl}
        pedidos={hoy}
        selId={selId}
        setSelId={setSelId}
        onAceptar={setAceptando}
        carriles={[
          { estado: 'pendiente', titulo: 'Sin aceptar', accion: 'Aceptar' },
          { estado: 'preparando', titulo: 'En la cocina', accion: 'Listo' },
          { estado: 'listo', titulo: 'Para retirar', accion: 'Entregado' },
        ]}
      />

      {aceptando && (
        <ModalAceptar
          pedido={aceptando}
          onCancelar={() => setAceptando(null)}
          onAceptar={(min, avisar) => {
            ctrl.aceptar(aceptando, min, avisar)
            setAceptando(null)
          }}
        />
      )}
      {nuevo && <NuevoPedido modalidad="retiro" onCerrar={() => setNuevo(false)} />}
    </>
  )
}
