import { esVenta } from './estadisticas'
import { medioDe } from './cobros'

/**
 * EL ARQUEO DE CAJA
 *
 * Qué hace y por qué está separado de la pantalla: acá se decide plata, y la
 * plata se tiene que poder probar sin abrir un navegador.
 *
 * El arqueo compara dos cosas que NO son lo mismo y por eso se guardan aparte:
 *
 * 1. Lo que dice el sistema: el monto inicial que se cargó al abrir, más todo
 *    lo que se vendió desde entonces, menos los egresos de caja. Esto no lo
 *    toca nadie, sale de los pedidos y de los movimientos.
 *
 * 2. Lo que declara el empleado: cuánto contó de cada forma de cobro al
 *    cerrar. Es una declaración, no un cálculo — por eso se le pide forma por
 *    forma y no un número solo. Si el total no coincide, la diferencia es el
 *    dato que importa, y se ve en el acto.
 *
 * Un medio de pago que no está enganchado a ninguna forma de cobro (Pedidos Ya,
 * por ejemplo) no tiene pedidos asociados: el sistema le calcula cero y el
 * empleado igual declara lo que contó. Eso está bien y es a propósito: acá no
 * se adivina de dónde salió la plata.
 */

const enRango = (iso, desde, hasta) => {
  const t = new Date(iso).getTime()
  return t >= desde && (hasta === null || t <= hasta)
}

/** Los medios que se le muestran al empleado al cerrar, en el orden del panel. */
export const mediosDelArqueo = (medios = []) => medios.filter((m) => m.activo !== false)

/**
 * Lo que el sistema dice que tendría que haber.
 *
 * `arqueo` necesita `apertura`, `monto_inicial` y, si ya cerró, `cierre`.
 */
export function calcularArqueo(arqueo, pedidos = [], movimientos = [], medios = []) {
  const desde = new Date(arqueo?.apertura).getTime()
  const hasta = arqueo?.cierre ? new Date(arqueo.cierre).getTime() : null
  const inicial = Number(arqueo?.monto_inicial) || 0

  const ventas = pedidos.filter(
    (p) => esVenta(p) && p.creado_en && enRango(p.creado_en, desde, hasta),
  )

  // Lo vendido, abierto por forma de cobro. La clave del pedido ('efectivo',
  // 'mercadopago'…) se cruza con el medio configurado, nunca por nombre: si el
  // local renombra «Mercado Pago» a «MP», esto tiene que seguir andando.
  const porMedio = new Map()
  mediosDelArqueo(medios).forEach((m) => porMedio.set(m.nombre, 0))

  // Algunos medios no se reconocen por la forma de pago sino por DE DÓNDE vino
  // el pedido: Pedidos Ya cobra él y le liquida al local, así que el pedido
  // puede decir cualquier cosa en `pago`. El origen manda sobre la clave.
  const porOrigen = mediosDelArqueo(medios).filter((m) => m.origen)

  let ventasTotal = 0
  ventas.forEach((p) => {
    const monto = Number(p.total) || 0
    ventasTotal += monto
    const porSuOrigen = porOrigen.find((m) => m.origen === p.origen)
    const medio = porSuOrigen ?? medioDe(medios, p.pago)
    if (medio) porMedio.set(medio.nombre, (porMedio.get(medio.nombre) || 0) + monto)
  })

  const movs = movimientos.filter((m) => m.fecha && enRango(m.fecha, desde, hasta))
  const ingresosManuales = movs
    .filter((m) => m.tipo === 'Ingreso')
    .reduce((a, m) => a + (Number(m.monto) || 0), 0)
  const egresos = movs
    .filter((m) => m.tipo !== 'Ingreso')
    .reduce((a, m) => a + (Number(m.monto) || 0), 0)

  const ingresos = ventasTotal + ingresosManuales

  // Lo que entró por canales que no pasan por el cajón del local (Pedidos Ya
  // liquida aparte). Se informa para que el encargado sepa que esa plata no la
  // tiene que encontrar contando.
  const fueraDeCaja = mediosDelArqueo(medios)
    .filter((m) => m.fuera_de_caja)
    .reduce((a, m) => a + (porMedio.get(m.nombre) || 0), 0)

  return {
    inicial,
    ventas: ventasTotal,
    fueraDeCaja,
    ingresosManuales,
    ingresos,
    egresos,
    porMedio: Object.fromEntries(porMedio),
    // El monto inicial entra en efectivo, así que cuenta para lo que tiene que
    // haber al cerrar: el empleado va a contar esos billetes también.
    total: inicial + ingresos - egresos,
  }
}

/** Lo que declaró el empleado, saneado: nunca NaN, nunca negativo. */
export function totalDeclarado(declarado = {}) {
  return Object.values(declarado).reduce((a, v) => {
    const n = Number(v)
    return a + (Number.isFinite(n) && n > 0 ? n : 0)
  }, 0)
}

/** Positiva: sobra plata. Negativa: falta. */
export const diferenciaDe = (arqueo, sistemaTotal) =>
  totalDeclarado(arqueo?.declarado) - (Number(sistemaTotal) || 0)
