import { useState } from 'react'
import { LOCALES } from '../data/negocio'
import { nombreCompleto, pesos, soloDigitos } from '../lib/utils'
import { crearPedido } from '../lib/pedidos'
import { useTienda } from '../lib/tienda'
import { precioConOpciones } from '../hooks/useCarrito'
import { modoDemo } from '../lib/supabase'

const PAGOS = [
  { id: 'efectivo', label: 'Efectivo', nota: '10% OFF' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'tarjeta', label: 'Tarjeta' },
]

const MODALIDADES = [
  { id: 'delivery', label: 'Delivery', nota: 'Te lo llevamos' },
  { id: 'retiro', label: 'Para retirar', nota: 'Lo buscás vos' },
]

function Campo({ error, ...props }) {
  const clase = `w-full rounded-xl border bg-ink px-4 py-3 text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber ${
    error ? 'border-flame' : 'border-white/15'
  }`
  return props.rows ? (
    <textarea {...props} className={`${clase} resize-none`} />
  ) : (
    <input {...props} className={clase} />
  )
}

export default function Carrito({
  carrito,
  modalidad,
  onModalidad,
  localId,
  onLocal,
  onCerrar,
}) {
  const {
    lineas,
    agregar,
    quitar,
    eliminar,
    vaciar,
    unidades,
    subtotal,
    descuentoEfectivo,
  } = carrito

  const [pago, setPago] = useState('efectivo')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [direccion, setDireccion] = useState('')
  const [nota, setNota] = useState('')
  const [intento, setIntento] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [confirmado, setConfirmado] = useState(null)
  const [error, setError] = useState(null)

  // Horarios y costo de envío salen del panel: si el local está cerrado o
  // pausado, acá no se puede confirmar nada.
  const { abierto, motivo, cerradoDelTodo, costoEnvio, montoMinimo } = useTienda(modalidad)

  const local = LOCALES.find((l) => l.id === localId) ?? null
  const descuento = descuentoEfectivo(pago)
  const envio = modalidad === 'delivery' ? costoEnvio : 0
  const total = subtotal - descuento + envio

  const faltaNombre = nombre.trim().length < 2
  const faltaTelefono = soloDigitos(telefono).length < 8
  const faltaDireccion = modalidad === 'delivery' && direccion.trim().length < 5
  const faltaLocal = !local
  const faltaMinimo = montoMinimo > 0 && subtotal < montoMinimo
  const listo =
    unidades > 0 &&
    abierto &&
    !faltaMinimo &&
    !faltaLocal &&
    !faltaNombre &&
    !faltaTelefono &&
    !faltaDireccion

  const confirmar = async () => {
    if (!listo) {
      setIntento(true)
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const pedido = await crearPedido({
        modalidad,
        local: local.id,
        cliente_nombre: nombre.trim(),
        cliente_telefono: telefono.trim(),
        cliente_email: email.trim() || null,
        direccion: modalidad === 'delivery' ? direccion.trim() : null,
        nota: nota.trim() || null,
        items: lineas.map((li) => ({
          id: li.item.id,
          nombre: nombreCompleto(li.item),
          cantidad: li.cantidad,
          precio: precioConOpciones(li.item, li.opciones),
          opciones: li.opciones ?? [],
        })),
        subtotal,
        descuento,
        // se guarda en el pedido: si mañana sube el envío, los pedidos viejos
        // tienen que seguir mostrando lo que se cobró de verdad
        envio,
        total,
        pago,
      })
      setConfirmado(pedido)
    } catch (e) {
      setError('No pudimos registrar el pedido. Probá de nuevo en un momento.')
      console.error(e)
    } finally {
      setEnviando(false)
    }
  }

  const nuevoPedido = () => {
    vaciar()
    setConfirmado(null)
    setIntento(false)
    setNota('')
  }

  // --------------------------------------------------------------- confirmado
  if (confirmado) {
    return (
      <div className="flex h-full flex-col justify-center rounded-3xl border border-amber/40 bg-ink-2 p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="#0B0B0B" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="display mt-5 text-3xl text-paper">¡Listo!</p>
        <p className="mt-2 text-sm leading-relaxed text-ash">
          Recibimos tu pedido{' '}
          <span className="font-bold text-paper">#{confirmado.numero}</span> para{' '}
          {local.nombre}. Te escribimos por WhatsApp cuando lo confirmen, con el
          tiempo de{modalidad === 'delivery' ? ' entrega' : ' preparación'}.
        </p>
        <p className="mt-4 display text-3xl text-amber">{pesos(confirmado.total)}</p>

        <button
          type="button"
          onClick={nuevoPedido}
          className="mt-7 text-xs font-semibold uppercase tracking-widest text-ash hover:text-paper"
        >
          Hacer otro pedido
        </button>

        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            className="mt-6 text-xs font-semibold uppercase tracking-widest text-ash lg:hidden"
          >
            Cerrar
          </button>
        )}
      </div>
    )
  }

  // ------------------------------------------------------------------ carrito
  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-ink-2">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h3 className="display text-xl text-paper">
          Tu pedido{' '}
          {unidades > 0 && (
            <span className="ml-1 rounded-full bg-amber px-2.5 py-0.5 align-middle text-sm text-ink">
              {unidades}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-3">
          {unidades > 0 && (
            <button
              type="button"
              onClick={vaciar}
              className="text-xs font-semibold uppercase tracking-wider text-ash hover:text-flame"
            >
              Vaciar
            </button>
          )}
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-paper lg:hidden"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {unidades === 0 ? (
          <p className="py-10 text-center text-sm text-ash">
            Todavía no agregaste nada.
            <br />
            Elegí del menú y aparece acá.
          </p>
        ) : (
          <ul className="space-y-3">
            {lineas.map((li) => (
              <li key={li.clave} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight font-bold text-balance text-paper">
                    {nombreCompleto(li.item)}
                  </p>
                  {li.opciones?.length > 0 && (
                    <p className="mt-0.5 text-[11px] leading-snug text-amber">
                      {li.opciones.map((o) => o.opcion).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-ash">
                    {pesos(precioConOpciones(li.item, li.opciones))} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/15 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => quitar(li.clave)}
                    aria-label={`Quitar uno de ${nombreCompleto(li.item)}`}
                    className="h-6 w-6 rounded-full text-paper hover:bg-white/10"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-sm font-bold text-paper">
                    {li.cantidad}
                  </span>
                  <button
                    type="button"
                    onClick={() => agregar(li.item, li.opciones)}
                    aria-label={`Agregar uno de ${nombreCompleto(li.item)}`}
                    className="h-6 w-6 rounded-full text-paper hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
                <div className="w-20 text-right text-sm font-bold text-amber">
                  {pesos(precioConOpciones(li.item, li.opciones) * li.cantidad)}
                </div>
                <button
                  type="button"
                  onClick={() => eliminar(li.clave)}
                  aria-label={`Eliminar ${nombreCompleto(li.item)}`}
                  className="text-ash hover:text-flame"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {unidades > 0 && (
          <div className="mt-6 space-y-4">
            {/* Las dos preguntas que definen el pedido van juntas y arriba de
                todo: cómo lo querés y de qué local. Una al lado de la otra,
                donde el cliente ya está decidiendo. */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ash">
                ¿Cómo lo querés?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MODALIDADES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onModalidad?.(m.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      modalidad === m.id
                        ? 'border-amber bg-amber text-ink'
                        : 'border-white/15 text-paper hover:border-white/35'
                    }`}
                  >
                    <span className="block text-xs font-bold">{m.label}</span>
                    <span
                      className={`block text-[10px] leading-tight ${
                        modalidad === m.id ? 'text-ink/70' : 'text-ash'
                      }`}
                    >
                      {m.id === 'delivery'
                        ? costoEnvio > 0
                          ? `+${pesos(costoEnvio)}`
                          : 'sin cargo'
                        : m.nota}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ash">
                {modalidad === 'delivery' ? '¿Desde qué local?' : '¿Dónde lo retirás?'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LOCALES.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => onLocal?.(l.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      localId === l.id
                        ? 'border-amber bg-amber text-ink'
                        : intento && faltaLocal
                          ? 'border-flame text-paper'
                          : 'border-white/15 text-paper hover:border-white/35'
                    }`}
                  >
                    <span className="block text-xs font-bold">{l.nombre}</span>
                    <span
                      className={`block text-[10px] leading-tight ${
                        localId === l.id ? 'text-ink/70' : 'text-ash'
                      }`}
                    >
                      {l.direccion}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-ash">
                Forma de pago
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAGOS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPago(p.id)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors ${
                      pago === p.id
                        ? 'border-amber bg-amber text-ink'
                        : 'border-white/15 text-paper hover:border-white/35'
                    }`}
                  >
                    {p.label}
                    {p.nota && (
                      <span className="block text-[10px] font-semibold opacity-70">
                        {p.nota}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Campo
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                error={intento && faltaNombre}
              />
              <Campo
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono (para avisarte)"
                type="tel"
                inputMode="tel"
                error={intento && faltaTelefono}
              />
              <Campo
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Mail (opcional)"
                type="email"
                inputMode="email"
              />
              {modalidad === 'delivery' && (
                <Campo
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección y entre calles"
                  error={intento && faltaDireccion}
                />
              )}
              <Campo
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                rows={2}
                placeholder="Aclaraciones (sin pickles, timbre roto, etc.)"
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="mb-1 flex justify-between text-sm text-ash">
          <span>Subtotal</span>
          <span>{pesos(subtotal)}</span>
        </div>
        {descuento > 0 && (
          <div className="mb-1 flex justify-between text-sm text-amber">
            <span>Descuento efectivo</span>
            <span>−{pesos(descuento)}</span>
          </div>
        )}
        {modalidad === 'delivery' && (
          <div className="mb-1 flex justify-between text-sm text-ash">
            <span>Envío</span>
            <span>{envio === 0 ? 'sin cargo' : pesos(envio)}</span>
          </div>
        )}
        <div className="mb-4 flex items-baseline justify-between">
          <span className="display text-lg text-paper">Total</span>
          <span className="display text-2xl text-amber">{pesos(total)}</span>
        </div>

        {/* Con el local cerrado no se toma el pedido. Se dice acá, arriba del
            botón, y se dice cuándo se puede. */}
        {!abierto && (
          <p className="mb-3 rounded-xl border border-flame/40 bg-flame/10 px-4 py-3 text-center text-xs leading-relaxed text-flame">
            {motivo}
            {!cerradoDelTodo && (
              <span className="mt-1 block text-ash">
                {modalidad === 'delivery'
                  ? 'Para retirar sí estamos abiertos.'
                  : 'El delivery sí está abierto.'}
              </span>
            )}
          </p>
        )}

        <button
          type="button"
          onClick={confirmar}
          disabled={enviando || !abierto}
          className={`w-full rounded-full px-6 py-4 text-sm font-extrabold uppercase tracking-widest transition-transform ${
            listo && !enviando
              ? 'bg-amber text-ink hover:scale-[1.02]'
              : 'cursor-not-allowed bg-white/10 text-ash'
          }`}
        >
          {enviando ? 'Enviando…' : abierto ? 'Confirmar pedido' : 'Cerrado por ahora'}
        </button>

        {intento && !listo && unidades > 0 && abierto && (
          <p className="mt-2 text-center text-xs text-flame">
            {faltaMinimo
              ? `El pedido mínimo es de ${pesos(montoMinimo)}.`
              : faltaLocal
                ? 'Elegí de qué local lo querés.'
                : faltaNombre
                  ? 'Escribí tu nombre.'
                  : faltaTelefono
                    ? 'Falta el teléfono.'
                    : 'Escribí la dirección de entrega.'}
          </p>
        )}
        {error && <p className="mt-2 text-center text-xs text-flame">{error}</p>}
        {!error && (
          <p className="mt-2 text-center text-[11px] text-ash">
            {modoDemo
              ? 'Modo demo: el pedido queda en este navegador.'
              : 'El pedido le llega al local al instante.'}
          </p>
        )}
      </div>
    </div>
  )
}
