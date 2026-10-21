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

/**
 * Las formas de pago que puede traer un pedido.
 *
 * `qr` es del mostrador: el cliente escanea el QR del local con el celular. No
 * es lo mismo que `mercadopago` —que es el pago online de la web— aunque la
 * plata termine en la misma cuenta: entran por canales distintos, el arancel
 * puede ser distinto, y el empleado los cuenta por separado al cerrar la caja.
 */
export const CLAVES_PAGO = [
  { clave: 'efectivo', label: 'Efectivo' },
  { clave: 'mercadopago', label: 'Mercado Pago' },
  // `tarjeta` es el débito. Se deja con ese nombre de clave —y no `debito`—
  // porque los pedidos que ya están guardados dicen 'tarjeta': cambiarla
  // dejaría esas ventas sin medio asignado.
  { clave: 'tarjeta', label: 'Tarj. Débito' },
  { clave: 'credito', label: 'Tarj. Crédito' },
  { clave: 'qr', label: 'Mercado Pago QR' },
]

export const CLAVES = CLAVES_PAGO.map((p) => p.clave)

/**
 * Formas de cobro que antes eran dos y hoy son una.
 *
 * «Transferencia» y «Mercado Pago» estaban como botones distintos, y es la
 * misma plata entrando a la misma cuenta (Marcos, 21/10). Quedó «Mercado
 * Pago» sola, pero los pedidos que ya están guardados siguen diciendo
 * 'transferencia' en la base, y esas ventas no se pueden quedar huérfanas: sin
 * medio asignado no se les calcula arancel y no aparecen en el arqueo.
 *
 * Por eso la equivalencia se traduce acá, en un solo lugar, en vez de ir a
 * reescribir el historial. El SQL igual pone al día lo que ya estaba, pero
 * esto cubre lo que todavía no se migró y cualquier pedido viejo que aparezca.
 */
const EQUIVALENTES = { transferencia: 'mercadopago' }

/** La forma de cobro de hoy que corresponde a esta clave (puede ser vieja). */
export const claveVigente = (clave) => (clave ? (EQUIVALENTES[clave] ?? clave) : null)

export const etiquetaPago = (clave) =>
  CLAVES_PAGO.find((p) => p.clave === claveVigente(clave))?.label ?? clave ?? 'Otro'

/** El medio de pago configurado que corresponde a esta forma de pago, o null. */
export function medioDe(medios, clave) {
  const vigente = claveVigente(clave)
  if (!vigente) return null
  return (medios || []).find((m) => m.clave === vigente && m.activo !== false) ?? null
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
    // Vigente y no cruda: así las ventas viejas de «Transferencia» suman en la
    // misma fila que las de Mercado Pago, en vez de abrir dos renglones de algo
    // que en el banco es uno solo.
    const clave = claveVigente(p?.pago) || 'otro'
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

// ---------------------------------------------------------------------------
// EL 10 % POR PAGAR EN EFECTIVO
// ---------------------------------------------------------------------------
//
// Por qué vive acá: la cuenta estaba escrita en tres lugares distintos —el
// carrito de la web, el mostrador del panel y el generador de pedidos de
// ejemplo—, cada uno con su propia copia del `* 0.1`. Tres copias de una regla
// de plata es tres chances de que una quede vieja, y así fue: el descuento se
// aplicaba también en delivery, donde el local ya está poniendo el envío.
//
// Decisión D7: el 10 % es **solo para take away**. El que paga en efectivo y
// retira por el local le ahorra al negocio la comisión y el viaje; el que pide
// delivery, no.
//
// Si mañana cambia —otro porcentaje, o que valga también en delivery— se
// cambia acá y cambia en los tres lados el mismo día.

/** ¿A este pedido le corresponde el descuento por efectivo? */
// Se pide 'retiro' explícito y no "cualquier cosa que no sea delivery": en la
// web el cliente arranca sin haber elegido, y en ese momento no corresponde
// mostrarle un descuento que después le puede desaparecer.
export const aplicaDescuentoEfectivo = (pago, modalidad) =>
  pago === 'efectivo' && modalidad === 'retiro'

/**
 * Lo que se le descuenta al pedido por pagar en efectivo, en pesos.
 * `porcentaje` entra como fracción (0.1 = 10 %), igual que NEGOCIO.promoEfectivo.
 */
export function descuentoPorEfectivo(subtotal, pago, modalidad, porcentaje) {
  if (!aplicaDescuentoEfectivo(pago, modalidad)) return 0
  const n = Number(porcentaje)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round((Number(subtotal) || 0) * n)
}
