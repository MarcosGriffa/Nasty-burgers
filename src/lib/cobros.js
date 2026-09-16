/**
 * Lo que se lleva cada medio de pago.
 *
 * Por qué existe este archivo: la comisión de Mercado Pago estaba escrita a
 * mano —un 0.035 en el medio de la pantalla de Cuentas a cobrar—. Si mañana
 * Mercado Pago cambia el arancel, el panel sigue mostrando el número viejo y
 * nadie se entera. Peor todavía: las tarjetas también cobran comisión y no
 * aparecían por ningún lado, así que la ganancia neta del Estado de resultados
 * daba de más.
 *
 * El único lugar donde ese número tiene que vivir es Configuración → Medios de
 * Pago, que es el que el local puede editar. Acá se lee de ahí.
 *
 * El enganche entre el pedido y el medio de pago se hace por `clave` y NO por
 * nombre: si el encargado renombra "Mercado Pago" a "MP", la comisión tiene que
 * seguir descontándose igual. (Es el mismo agujero que todavía tiene el stock,
 * que cruza pedido y producto por nombre.)
 *
 * Y si un medio no está enganchado a ninguna clave, acá no se adivina nada: se
 * devuelve comisión 0 y `sinAsignar` en true, para que la pantalla pueda decir
 * "esto no lo sé" en vez de inventar un porcentaje.
 */

/** Las cuatro formas de pago que puede traer un pedido (web y mostrador). */
export const CLAVES_PAGO = [
  { clave: 'efectivo', label: 'Efectivo' },
  { clave: 'mercadopago', label: 'Mercado Pago' },
  { clave: 'transferencia', label: 'Transferencia' },
  { clave: 'tarjeta', label: 'Tarjeta' },
]

export const CLAVES = CLAVES_PAGO.map((p) => p.clave)

export const etiquetaPago = (clave) =>
  CLAVES_PAGO.find((p) => p.clave === clave)?.label ?? clave ?? 'Otro'

/** El medio de pago configurado que corresponde a esta forma de pago, o null. */
export function medioDe(medios, clave) {
  if (!clave) return null
  return (medios || []).find((m) => m.clave === clave && m.activo !== false) ?? null
}

/** El arancel del medio, saneado: nunca negativo, nunca NaN. */
export const porcentajeDe = (medio) => {
  const n = Number(medio?.comision)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Lo que se lleva el medio de pago de este pedido, en pesos. */
export function comisionDePedido(pedido, medios) {
  const medio = medioDe(medios, pedido?.pago)
  if (!medio) return 0
  return Math.round(((pedido?.total || 0) * porcentajeDe(medio)) / 100)
}

/**
 * Desglose de comisiones de un conjunto de pedidos, una fila por forma de pago.
 *
 * Las formas sin ventas no se listan: la pantalla muestra lo que pasó, no el
 * catálogo entero.
 */
export function comisiones(pedidos = [], medios = []) {
  const mapa = new Map()

  pedidos.forEach((p) => {
    const clave = p?.pago || 'otro'
    const e = mapa.get(clave) ?? { clave, bruto: 0, cantidad: 0 }
    e.bruto += p?.total || 0
    e.cantidad += 1
    mapa.set(clave, e)
  })

  const filas = [...mapa.values()]
    .map((e) => {
      const medio = medioDe(medios, e.clave)
      const porcentaje = porcentajeDe(medio)
      const comision = Math.round((e.bruto * porcentaje) / 100)
      return {
        ...e,
        label: etiquetaPago(e.clave),
        medio: medio?.nombre ?? null,
        // sin medio enganchado no sabemos cuánto cobra: no es lo mismo que 0 %
        sinAsignar: !medio,
        porcentaje,
        comision,
        neto: e.bruto - comision,
      }
    })
    .sort((a, b) => b.bruto - a.bruto)

  return {
    filas,
    total: filas.reduce((a, f) => a + f.comision, 0),
    brutoSinAsignar: filas.filter((f) => f.sinAsignar).reduce((a, f) => a + f.bruto, 0),
    sinAsignar: filas.filter((f) => f.sinAsignar).map((f) => f.label),
  }
}
