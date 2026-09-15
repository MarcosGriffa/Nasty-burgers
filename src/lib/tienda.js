import { useColeccion } from './almacen'
import { AJUSTES_INICIALES } from '../data/semillas'

/**
 * ¿La tienda está abierta ahora mismo?
 *
 * Los horarios y el botón «Pausar tienda» se cargan en el panel. Hasta acá no
 * llegaban nunca: se podía pedir a las 4 de la mañana con el local cerrado.
 * Este archivo es el único lugar donde se decide, y lo usan la web y el
 * carrito.
 *
 * Los días vienen del panel en el orden Lun → Dom; el getDay() del navegador
 * arranca en domingo, de ahí el corrimiento.
 */

const MINUTOS = (hhmm) => {
  const [h, m] = String(hhmm ?? '').split(':')
  const hh = Number(h)
  const mm = Number(m)
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
  return hh * 60 + mm
}

/** Índice del día en la tabla del panel (0 = lunes). */
const indiceDia = (fecha) => (fecha.getDay() + 6) % 7

/**
 * Un turno que cierra más tarde de lo que abre es el caso normal (19:30 a
 * 23:00). Uno que cierra ANTES cruza la medianoche (20:00 a 01:00): a la 1 de
 * la mañana el local sigue abierto, pero con el horario del día anterior.
 */
const dentroDelTurno = (ahora, desde, hasta) => {
  const d = MINUTOS(desde)
  const h = MINUTOS(hasta)
  if (d === null || h === null) return false
  if (h > d) return ahora >= d && ahora < h
  return ahora >= d // la parte después de medianoche la resuelve el día anterior
}

const siguePorLaMadrugada = (ahora, desde, hasta) => {
  const d = MINUTOS(desde)
  const h = MINUTOS(hasta)
  if (d === null || h === null) return false
  return h <= d && ahora < h
}

/**
 * Estado de la tienda para una modalidad ('delivery' o 'retiro').
 * Devuelve { abierto, motivo } — el motivo es lo que se le muestra al cliente.
 */
export function estadoDeTienda(ajustes, modalidad = 'delivery', fecha = new Date()) {
  const a = ajustes ?? {}
  if (a.tienda_activa === false) {
    return { abierto: false, motivo: 'Ahora mismo no estamos tomando pedidos.' }
  }

  const horarios = a.horarios ?? AJUSTES_INICIALES[0].horarios
  if (!horarios?.length) return { abierto: true, motivo: null }

  const ahora = fecha.getHours() * 60 + fecha.getMinutes()
  const hoy = horarios[indiceDia(fecha)]
  const ayer = horarios[(indiceDia(fecha) + 6) % 7]
  const habilita = (h) => (modalidad === 'retiro' ? h?.retiro : h?.delivery)

  if (habilita(hoy) && dentroDelTurno(ahora, hoy.desde, hoy.hasta)) {
    return { abierto: true, motivo: null }
  }
  // Todavía estamos en el turno de anoche (abrió 20:00, cierra 01:00).
  if (habilita(ayer) && siguePorLaMadrugada(ahora, ayer.desde, ayer.hasta)) {
    return { abierto: true, motivo: null }
  }

  const texto =
    modalidad === 'retiro'
      ? 'El local está cerrado para retirar'
      : 'El delivery está cerrado'
  const cuando = habilita(hoy)
    ? `Hoy abrimos de ${hoy.desde} a ${hoy.hasta}.`
    : `${proximoDia(horarios, fecha, modalidad)}`

  return { abierto: false, motivo: `${texto}. ${cuando}` }
}

/** «Abrimos el miércoles a las 19:30» — el primer día que vuelve a haber turno. */
function proximoDia(horarios, fecha, modalidad) {
  const NOMBRES = {
    Lun: 'el lunes',
    Mar: 'el martes',
    Mié: 'el miércoles',
    Jue: 'el jueves',
    Vie: 'el viernes',
    Sáb: 'el sábado',
    Dom: 'el domingo',
  }
  const desdeHoy = indiceDia(fecha)
  for (let i = 1; i <= 7; i += 1) {
    const h = horarios[(desdeHoy + i) % 7]
    const sirve = modalidad === 'retiro' ? h?.retiro : h?.delivery
    if (sirve) return `Abrimos ${NOMBRES[h.dia] ?? h.dia} a las ${h.desde}.`
  }
  return 'Escribinos por WhatsApp y coordinamos.'
}

/** Lo que cuesta el envío hoy. Un solo número para todas las zonas. */
export const costoDeEnvio = (ajustes) => {
  const n = Number(ajustes?.costo_envio)
  return Number.isFinite(n) && n >= 0 ? n : Number(AJUSTES_INICIALES[0].costo_envio) || 0
}

/**
 * Lo que necesita la web pública: si está abierto, cuánto sale el envío y
 * cuál es el mínimo. Sale de la misma tabla que edita el panel.
 */
export function useTienda(modalidad = 'delivery') {
  const { filas } = useColeccion('ajustes', AJUSTES_INICIALES)
  const a = filas[0] ?? AJUSTES_INICIALES[0]
  const { abierto, motivo } = estadoDeTienda(a, modalidad)
  const otra = estadoDeTienda(a, modalidad === 'retiro' ? 'delivery' : 'retiro')
  return {
    ajustes: a,
    abierto,
    motivo,
    // Puede estar cerrado el delivery y abierto el retiro: si alguna de las
    // dos anda, el cliente todavía puede pedir cambiando de modalidad.
    cerradoDelTodo: !abierto && !otra.abierto,
    costoEnvio: costoDeEnvio(a),
    montoMinimo: a.monto_minimo_activo ? Number(a.monto_minimo) || 0 : 0,
  }
}
