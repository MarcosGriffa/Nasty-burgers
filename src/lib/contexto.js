import {
  clientesDePedidos,
  consumoIngredientes,
  estadoResultados,
  filtrar,
  porDiaSemana,
  porHora,
  porMedioDePago,
  porModalidad,
  rankingProductos,
  resumen,
} from './estadisticas'
import { LOCALES, NEGOCIO } from '../data/negocio'
import { pesos } from './utils'

/**
 * El resumen del negocio que se le manda a la IA para que pueda contestar
 * preguntas.
 *
 * DOS REGLAS, y son importantes:
 *
 * 1. NO SALEN DATOS DE CLIENTES. Ni nombres, ni teléfonos, ni mails, ni
 *    direcciones. Solo números agregados: cuántos clientes hay, cuántos
 *    repiten, cuánto gastan en promedio. Los datos personales de la gente del
 *    barrio no tienen por qué viajar a un servidor de Google.
 *
 * 2. Va todo calculado y resumido, no la base entera. Son unas 60 líneas de
 *    texto: alcanza para contestar bien y mantiene el costo por consulta en
 *    fracciones de centavo.
 */

const linea = (etiqueta, valor) => `${etiqueta}: ${valor}`
const dia = (d) => new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })

function bloqueVentas(pedidos, productos, gastos, medios, dias, titulo) {
  const delPeriodo = filtrar(pedidos, { dias })
  const r = resumen(delPeriodo)
  if (!r.cantidad) return `${titulo}: sin ventas registradas.`

  // los gastos tienen 'fecha', no 'creado_en': se filtran acá
  const desde = new Date(Date.now() - (dias - 1) * 86400000)
  const gastosDel = gastos.filter((g) => new Date(g.fecha || g.creado_en) >= desde)
  const pyl = estadoResultados(delPeriodo, gastosDel, productos, medios)
  const top = rankingProductos(delPeriodo, productos).slice(0, 8)

  return [
    `${titulo} (${dias} días)`,
    linea('  Pedidos', r.cantidad),
    linea('  Ventas brutas', pesos(r.brutas)),
    linea('  Descuentos', pesos(r.descuentos)),
    linea('  Ventas netas', pesos(r.netas)),
    linea('  Ticket promedio', pesos(r.promedio)),
    linea('  Costo de la mercadería (CMV)', `${pesos(pyl.cmv)} (${pyl.netas ? Math.round((pyl.cmv / pyl.netas) * 100) : 0}%)`),
    linea('  Gastos cargados', pesos(pyl.gastos)),
    linea(
      '  Comisiones de medios de pago',
      pyl.comisionesSinAsignar.length
        ? `${pesos(pyl.comisiones)} (INCOMPLETO: ${pyl.comisionesSinAsignar.join(' y ')} sin medio de pago asignado)`
        : pesos(pyl.comisiones),
    ),
    linea('  Ganancia bruta', `${pesos(pyl.gananciaBruta)} (margen ${pyl.margenBruto}%)`),
    linea('  Ganancia neta', `${pesos(pyl.gananciaNeta)} (margen ${pyl.margenNeto}%)`),
    '  Más vendidos:',
    ...top.map(
      (p) =>
        `    ${p.cantidad}x ${p.nombre} — vendido ${pesos(p.venta)}, CMV ${p.cmv}%`,
    ),
  ].join('\n')
}

export function contextoDelNegocio({
  pedidos = [],
  productos = [],
  ingredientes = [],
  gastos = [],
  medios = [],
  local,
} = {}) {
  const hoy = filtrar(pedidos, { dias: 1 })
  const mes = filtrar(pedidos, { dias: 30 })
  const nombreLocal = LOCALES.find((l) => l.id === local)?.nombre

  // --- clientes: solo agregados, nunca la ficha de nadie ---
  const clientes = clientesDePedidos(mes)
  const repiten = clientes.filter((c) => c.compras > 1).length

  // --- stock: lo que se está por acabar ---
  const consumo = consumoIngredientes(filtrar(pedidos, { dias: 30 }), productos)
  const criticos = ingredientes
    .map((i) => {
      const porDia = (consumo.get(i.nombre) || 0) / 30
      return {
        nombre: i.nombre,
        stock: Number(i.stock) || 0,
        unidad: i.unidad,
        dias: porDia > 0 ? Math.floor((Number(i.stock) || 0) / porDia) : null,
      }
    })
    .filter((i) => i.dias !== null)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 10)

  // --- carta ---
  const carta = productos
    .filter((p) => p.activo !== false)
    .map((p) => {
      const cmv = p.precio ? Math.round((p.costo / p.precio) * 100) : 0
      return `  ${p.nombre} (${p.categoria}) — precio ${pesos(p.precio)}, costo ${pesos(p.costo)}, CMV ${cmv}%${
        p.visible_web === false ? ', NO visible en la web' : ''
      }${p.destacado ? ', destacado' : ''}`
    })

  const horas = porHora(mes)
    .filter((h) => h.a > 0)
    .map((h) => `${h.label}h ${pesos(h.a)}`)
  const dias7 = porDiaSemana(mes).map((d) => `${d.label} ${pesos(d.a)}`)

  return [
    `NEGOCIO: ${NEGOCIO.nombre}. Hamburguesería con dos locales: ${LOCALES.map((l) => l.nombre).join(' y ')}.`,
    `Descuento vigente: ${Math.round(NEGOCIO.promoEfectivo * 100)}% pagando en efectivo.`,
    nombreLocal
      ? `Estás hablando con el local de ${nombreLocal}: los números de abajo son SOLO de ese local.`
      : 'Los números de abajo son de los dos locales juntos.',
    `Fecha de hoy: ${new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`,
    '',
    `HOY: ${hoy.length} pedidos, ${pesos(resumen(hoy).netas)} netos.`,
    '',
    bloqueVentas(pedidos, productos, gastos, medios, 7, 'ÚLTIMA SEMANA'),
    '',
    bloqueVentas(pedidos, productos, gastos, medios, 30, 'ÚLTIMOS 30 DÍAS'),
    '',
    'CUÁNDO SE VENDE (últimos 30 días)',
    `  Por hora: ${horas.join(', ') || 'sin datos'}`,
    `  Por día: ${dias7.join(', ')}`,
    `  Delivery vs mostrador: ${porModalidad(mes).map((m) => `${m.label} ${m.cantidad} pedidos, ${pesos(m.valor)}`).join(' | ')}`,
    `  Medios de pago: ${porMedioDePago(mes).map((m) => `${m.label} ${pesos(m.valor)}`).join(', ')}`,
    '',
    'CLIENTES (últimos 30 días, solo números — no hay datos personales acá)',
    `  Distintos: ${clientes.length}`,
    `  Que compraron más de una vez: ${repiten}`,
    `  Gasto promedio por cliente: ${pesos(clientes.length ? Math.round(clientes.reduce((a, c) => a + c.gastado, 0) / clientes.length) : 0)}`,
    '',
    'STOCK — los que menos duran, con el consumo del último mes',
    ...criticos.map((i) => `  ${i.nombre}: quedan ${i.stock} ${i.unidad} ≈ ${i.dias} días`),
    '',
    'LA CARTA',
    ...carta,
    '',
    `Último pedido registrado: ${
      pedidos.length
        ? dia(Math.max(...pedidos.map((p) => new Date(p.creado_en).getTime())))
        : '—'
    }.`,
  ].join('\n')
}
