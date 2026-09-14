import { useState } from 'react'
import { LOCALES, MENSAJES } from '../data/negocio'
import { ESTADOS, etiquetaSiguiente, siguienteEstado } from '../lib/pedidos'
import {
  hora,
  linkWhatsapp,
  minutosDesde,
  pesos,
  telefonoWhatsapp,
} from '../lib/utils'

const COLOR_ESTADO = {
  pendiente: 'bg-flame text-ink',
  preparando: 'bg-amber text-ink',
  en_envio: 'bg-amber/20 text-amber',
  listo: 'bg-amber/20 text-amber',
  entregado: 'bg-white/10 text-ash',
  rechazado: 'bg-white/10 text-ash',
}

function Dato({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ash">{label}</p>
      <p className="text-sm break-words text-paper">{children}</p>
    </div>
  )
}

export default function Comanda({ pedido, onAceptar, onRechazar, onAvanzar, onCobrar }) {
  const [confirmandoRechazo, setConfirmandoRechazo] = useState(false)
  const local = LOCALES.find((l) => l.id === pedido.local)
  const esEfectivo = pedido.pago === 'efectivo'
  const cerrado = pedido.estado === 'entregado' || pedido.estado === 'rechazado'
  const espera = minutosDesde(pedido.creado_en)
  const urgente = pedido.estado === 'pendiente' && espera >= 5

  const siguiente = siguienteEstado(pedido)
  const bloqueadoPorEfectivo =
    siguiente === 'entregado' && esEfectivo && !pedido.efectivo_cobrado

  // El pedido entero, no un resumen: los mensajes usan el local, la dirección
  // y los importes. Si se le pasan de a pedazos, el WhatsApp sale con $0.
  const avisar = (plantilla) => {
    const texto = plantilla({
      nombre: pedido.cliente_nombre,
      numero: pedido.numero,
      minutos: pedido.demora_min,
      modalidad: pedido.modalidad,
      local: pedido.local,
      direccion: pedido.direccion,
      subtotal: pedido.subtotal,
      descuento: pedido.descuento,
      envio: pedido.envio,
      total: pedido.total,
    })
    window.open(
      linkWhatsapp(telefonoWhatsapp(pedido.cliente_telefono), texto),
      '_blank',
      'noopener',
    )
  }

  return (
    <article
      className={`rounded-2xl border bg-ink-2 p-4 transition-colors ${
        cerrado
          ? 'border-white/5 opacity-60'
          : urgente
            ? 'border-flame shadow-[0_0_0_3px_rgba(255,77,0,0.15)]'
            : 'border-white/12'
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="display text-3xl text-paper">#{pedido.numero}</span>
          <span className="text-xs text-ash">
            {hora(pedido.creado_en)} · hace {espera}′
          </span>
        </div>
        <div className="flex items-center gap-2">
          {esEfectivo && (
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                pedido.efectivo_cobrado
                  ? 'bg-white/10 text-ash'
                  : 'bg-flame/20 text-flame'
              }`}
            >
              {pedido.efectivo_cobrado ? 'Efectivo cobrado' : 'Efectivo'}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${COLOR_ESTADO[pedido.estado]}`}
          >
            {ESTADOS[pedido.estado].label}
          </span>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-2 gap-3 border-y border-white/10 py-3">
        <Dato label="Cliente">{pedido.cliente_nombre}</Dato>
        <Dato label="Teléfono">
          <a href={`tel:${pedido.cliente_telefono}`} className="underline decoration-white/25">
            {pedido.cliente_telefono}
          </a>
        </Dato>
        {pedido.cliente_email && (
          <Dato label="Mail">
            <a
              href={`mailto:${pedido.cliente_email}`}
              className="underline decoration-white/25"
            >
              {pedido.cliente_email}
            </a>
          </Dato>
        )}
        <Dato label="Local">{local?.nombre ?? pedido.local}</Dato>
        {pedido.modalidad === 'delivery' && pedido.direccion && (
          <div className="col-span-2">
            <Dato label="Dirección">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.direccion)}`}
                target="_blank"
                rel="noreferrer"
                className="underline decoration-white/25"
              >
                {pedido.direccion}
              </a>
            </Dato>
          </div>
        )}
      </div>

      <ul className="mt-3 space-y-1">
        {pedido.items.map((it, i) => (
          <li key={i} className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 text-paper">
              <span className="display mr-2 text-amber">{it.cantidad}×</span>
              {it.nombre}
              {/* Lo que eligió el cliente: papas sazonadas, sin cebolla, extras.
                  Va debajo del nombre porque la cocina lo necesita ver sin abrir nada. */}
              {it.opciones?.length > 0 && (
                <span className="mt-0.5 block pl-7 text-xs leading-snug text-amber/80">
                  {it.opciones.map((o) => o.opcion).join(' · ')}
                </span>
              )}
            </span>
            <span className="shrink-0 text-ash">{pesos(it.precio * it.cantidad)}</span>
          </li>
        ))}
      </ul>

      {pedido.nota && (
        <p className="mt-3 rounded-xl bg-flame/10 px-3 py-2 text-sm text-flame">
          {pedido.nota}
        </p>
      )}

      <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
        <span className="text-xs uppercase tracking-widest text-ash">
          {pedido.pago}
          {pedido.demora_min ? ` · ${pedido.demora_min}′ estimados` : ''}
        </span>
        <span className="display text-2xl text-amber">{pesos(pedido.total)}</span>
      </div>

      {/* ------------------------------------------------------------ acciones */}
      {pedido.estado === 'pendiente' && !confirmandoRechazo && (
        <div className="mt-4 grid grid-cols-[2fr_1fr] gap-2">
          <button
            type="button"
            onClick={() => onAceptar(pedido)}
            className="rounded-full bg-amber px-4 py-3.5 text-sm font-extrabold uppercase tracking-widest text-ink hover:scale-[1.02]"
          >
            Aceptar pedido
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoRechazo(true)}
            className="rounded-full border border-white/20 px-4 py-3.5 text-sm font-extrabold uppercase tracking-widest text-ash hover:border-flame hover:text-flame"
          >
            Rechazar
          </button>
        </div>
      )}

      {confirmandoRechazo && (
        <div className="mt-4 rounded-xl border border-flame/40 p-3">
          <p className="text-sm text-paper">¿Rechazar la comanda #{pedido.numero}?</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                avisar(MENSAJES.rechazado)
                onRechazar(pedido)
                setConfirmandoRechazo(false)
              }}
              className="flex-1 rounded-full bg-flame px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-ink"
            >
              Sí, rechazar y avisar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoRechazo(false)}
              className="rounded-full border border-white/20 px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-ash"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {!cerrado && pedido.estado !== 'pendiente' && (
        <div className="mt-4 space-y-2">
          {esEfectivo && siguiente === 'entregado' && (
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 px-3 py-3">
              <input
                type="checkbox"
                checked={pedido.efectivo_cobrado}
                onChange={(e) => onCobrar(pedido, e.target.checked)}
                className="h-5 w-5 accent-[#f5b301]"
              />
              <span className="text-sm text-paper">
                Conté el efectivo: {pesos(pedido.total)}
              </span>
            </label>
          )}

          <button
            type="button"
            disabled={bloqueadoPorEfectivo}
            onClick={() => onAvanzar(pedido)}
            className={`w-full rounded-full px-4 py-3.5 text-sm font-extrabold uppercase tracking-widest ${
              bloqueadoPorEfectivo
                ? 'cursor-not-allowed bg-white/10 text-ash'
                : 'bg-amber text-ink hover:scale-[1.02]'
            }`}
          >
            {etiquetaSiguiente(pedido)}
          </button>

          {(pedido.estado === 'en_envio' || pedido.estado === 'listo') && (
            <button
              type="button"
              onClick={() => avisar(MENSAJES[pedido.estado])}
              className="w-full rounded-full border border-[#25D366]/60 px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-[#25D366]"
            >
              Avisar al cliente
            </button>
          )}

          {pedido.estado === 'preparando' && !pedido.avisado && (
            <button
              type="button"
              onClick={() => avisar(MENSAJES.aceptado)}
              className="w-full rounded-full border border-[#25D366]/60 px-4 py-3 text-xs font-extrabold uppercase tracking-widest text-[#25D366]"
            >
              Avisar la demora al cliente
            </button>
          )}
        </div>
      )}
    </article>
  )
}
